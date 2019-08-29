import { Component, Injector } from '@angular/core';
import { BatchService } from '@core/hydra/service/batch.service';
import { Validators } from '@angular/forms';
import { MaterialBatch } from '@core/hydra/entity/batch';
import { requestBatchData } from '../material/request.common';
import { of, Observable, BehaviorSubject, throwError } from 'rxjs';
import { Machine } from '@core/hydra/entity/machine';
import { MachineService } from '@core/hydra/service/machine.service';
import { Operation, ComponentStatus } from '@core/hydra/entity/operation';
import { OperationService } from '@core/hydra/service/operation.service';
import { map, switchMap, tap } from 'rxjs/operators';
import { BaseExtendForm } from '../base.form.extend';
import { getComponentStatus, getComponentToBeReplenish } from '@core/hydra/utils/operationHelper';
import { MPLBapiService } from '@core/hydra/bapi/mpl/bapi.service';
import { IActionResult } from '@core/utils/helpers';
import { MachineWebApi } from '@core/webapi/machine.webapi';
import { BatchWebApi } from '@core/webapi/batch.webapi';
import { OperationWebApi } from '@core/webapi/operation.webapi';

@Component({
  selector: 'fw-batch-logon',
  templateUrl: 'logon-batch.component.html',
  styleUrls: ['./logon-batch.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class LogonBatchComponent extends BaseExtendForm {
  //#region View Children

  //#endregion

  //#region Protected member

  protected key = `app.mobile.material.logon`;

  //#endregion

  //#region Public member

  componentStatus$: BehaviorSubject<ComponentStatus[]> = new BehaviorSubject<[]>([]);
  operations$: BehaviorSubject<Operation[]> = new BehaviorSubject<[]>([]);

  lastOperationSelected = ``;

  //#endregion

  //#region Constructor

  constructor(
    injector: Injector,
    private _machineWebApi: MachineWebApi,
    private _opertionWebApi: OperationWebApi,
    private _batchWebApi: BatchWebApi,
  ) {
    super(injector, false);
    this.addControls({
      operation: [null, [Validators.required], 'operationData'],
      machine: [null, [Validators.required], 'machineData'],
      batch: [null, [Validators.required], 'batchData'],
      compStatusData: [null, [Validators.required]],
    });
  }

  //#endregion

  //#region Public methods

  //#endregion

  //#region Data Request

  //#region Machine Reqeust

  requestMachineDataSuccess = (machine: Machine) => {
    this.operations$.next(machine.nextOperations);
    if (this.lastOperationSelected) {
      this.form.controls.operation.setValue(this.lastOperationSelected);
    } else if (machine.nextOperations.length > 0) {
      this.form.controls.operation.setValue(machine.nextOperations[0].name);
    }

    if (this.form.value.operation) {
      this.request(this.requestOperationData, this.requestOperationDataSuccess, this.requestOperationDataFailed)
        (null, null, `operation`);
    }
  }

  requestMachineDataFailed = () => {
  }

  requestMachineData = () => {
    this.form.controls.operation.setValue(``);
    this.form.controls.operationData.setValue(null);

    return this._machineWebApi.getMachineLightWeight(this.form.value.machine).pipe(
      tap(machine => {
        if (!machine) {
          throw Error('Machine invalid');
        }
      })
    );
  }

  //#endregion

  //#region Batch Reqeust
  requestBatchDataSuccess = (batch) => {
    this.form.controls.batch.setValue(batch.name);
    this.form.controls.batchData.setValue(batch);

    if (!this.isDisable()) {
      this.doAction(this.logonBatch, this.logonBatchSuccess, this.logonBatchFailed);
    }
  }

  requestBatchDataFailed = () => {
  }

  requestBatchData = () => {
    return requestBatchData(this.form, this._batchWebApi)().pipe(
      switchMap((batch: MaterialBatch) => {
        const found = this.componentStatus$.value.find(cs => cs.material === batch.material);
        if (!found) {
          return throwError(`Material ${batch.material} in-correct!`);
        }

        this.form.controls.compStatusData.setValue(found);
        return of(batch);
      }
      ));
  }

  //#endregion

  //#region Operation Reqeust
  requestOperationDataSuccess = (_) => {
    setTimeout(() => this.document.getElementById(`batch`).focus(), 0);
  }

  requestOperationDataFailed = () => {
  }

  requestOperationData = (): Observable<any> => {
    return this._opertionWebApi.getOperation(this.form.value.operation).pipe(
      switchMap(operation => {
        return this._opertionWebApi.getComponentStatus(operation.name, this.form.value.machineData.machineName).pipe(
          map((status: ComponentStatus[]) => {
            this.componentStatus$.next(status);
            return operation;
          })
        );
      }))
  }

  //#endregion

  //#endregion

  //#region Protected methods

  protected beforeRequestCheck(srcElement): Observable<boolean> {
    if (!srcElement) return of(true);

    switch (srcElement.id) {
      case 'batch':
        if (!this.machineData) {
          return throwError(`Input Machine First`);
        }
        break;
      default:
        return of(true);
    }
    return of(true);
  }

  //#endregion

  //#region Event Handler

  operationSelected(operationName) {
    this.operationListPopup.close();
    this.form.controls.operation.setValue(operationName);
    if (operationName) {
      this.request(this.requestOperationData, this.requestOperationDataSuccess, this.requestOperationDataFailed)
        (null, null, `operation`);
    }
  }

  //#endregion

  //#region Exeuction
  logonBatchSuccess = () => {
    this.form.controls.batch.setValue(null);
    this.form.controls.operation.setValue(``);
    this.form.controls.batchData.setValue(null);
    this.form.controls.operationData.setValue(null);
    this.form.controls.compStatusData.setValue(null);

    this.componentStatus$.next([]);
    this.operations$.next([]);

    this.request(this.requestMachineData, this.requestMachineDataSuccess, this.requestMachineDataFailed)
      (null, null, `machine`);
  }

  logonBatchFailed = () => {
  }

  logonBatch = () => {
    this.lastOperationSelected = this.form.value.operation;

    return this._batchWebApi.logonInputBatch(this.form.value.operationData, this.form.value.machineData,
      this.operatorData, this.form.value.batchData, this.form.value.compStatusData.pos).pipe(
        map(_ => {
          return {
            isSuccess: true,
            description: `Batch ${this.batchData.name} Logged On!`,
          }
        }));
  }

  //#endregion

  //#region Override methods

  protected afterReset() {
    this.document.getElementById(`machine`).focus();

    this.componentStatus$.next([]);
    this.operations$.next([]);
  }

  //#endregion

  //#region Override properties

  get upperLevel(): string {
    return `/operation/list`;
  }

  //#endregion

  //#region Private methods

  //#endregion
}
