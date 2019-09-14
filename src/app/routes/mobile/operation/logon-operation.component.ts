import { Component, Injector } from '@angular/core';
import { Validators } from '@angular/forms';
import { Observable, BehaviorSubject, forkJoin, throwError, of } from 'rxjs';
import { Machine } from '@core/hydra/entity/machine';
import { Operation, ComponentStatus, ToolStatus } from '@core/hydra/entity/operation';
import { map, tap, switchMap } from 'rxjs/operators';
import { BaseExtendForm } from '../base.form.extend';
import { MACHINE_STATUS_NOORDER, MACHINE_STATUS_PRODUCTION } from '@core/hydra/bapi/constants';
import { MachineWebApi } from '@core/webapi/machine.webapi';
import { OperationWebApi } from '@core/webapi/operation.webapi';
import { MaterialMasterWebApi } from '@core/webapi/materialMaster.webapi';
import { MaterialMaster } from '@core/hydra/entity/materialMaster';
import { toNumber } from 'ng-zorro-antd';

@Component({
  selector: 'fw-operation-logon',
  templateUrl: 'logon-operation.component.html',
  styleUrls: ['./logon-operation.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class LogonOperationComponent extends BaseExtendForm {
  //#region View Children

  //#endregion

  //#region Protected member
  protected key = `app.mobile.operation.logon`;
  //#endregion

  //#region Public member

  componentStatus$: BehaviorSubject<ComponentStatus[]> = new BehaviorSubject<[]>([]);
  toolStatus$: BehaviorSubject<ToolStatus[]> = new BehaviorSubject<[]>([]);
  operations$: BehaviorSubject<Operation[]> = new BehaviorSubject<[]>([]);

  //#endregion

  //#region Public member

  //#endregion

  //#region Constructor

  constructor(
    injector: Injector,
    private _machineWebApi: MachineWebApi,
    private _operationWebApi: OperationWebApi,
    private _materialMasterWebApi: MaterialMasterWebApi
  ) {
    super(injector);
    this.addControls({
      machine: [null, [Validators.required], 'machineData'],
      operation: [null, [Validators.required], 'operationData'],
      outputBatchSize: [0, [Validators.required, Validators.min(1)], 'outputBatchSizeData'],
    });
  }

  //#endregion

  //#region Public methods

  //#endregion

  //#region Data Request

  //#region Machine Reqeust

  requestMachineDataSuccess = (machine: Machine) => {
    this.operations$.next(machine.nextOperations);
    if (machine.nextOperations.length > 0) {
      this.form.controls.operation.setValue(machine.nextOperations[0].name);
      this.request(this.requestOperationData, this.requestOperationDataSuccess, this.requestOperationDataFailed)
        (null, null, `operation`);
    }
  }

  requestMachineDataFailed = () => {
  }

  requestMachineData = () => {
    return this._machineWebApi.getMachine(this.form.value.machine).pipe(
      tap(machine => {
        if (!machine) {
          throw Error('Machine invalid');
        }

        if (machine.currentStatusNr !== MACHINE_STATUS_NOORDER && machine.currentStatusNr !== MACHINE_STATUS_PRODUCTION) {
          throw Error(`Machine Status not valid!`);
        }
      })
    );
  }

  //#endregion

  //#region Operation Reqeust
  requestOperationDataSuccess = (_) => {
    setTimeout(() => {
      this.document.getElementById(`outputBatchSize`).focus();
    }, 0);
  }

  requestOperationDataFailed = () => {
  }

  requestOperationData = (): Observable<any> => {
    return this._operationWebApi.getOperation(this.form.value.operation).pipe(
      switchMap(operation => {
        return forkJoin(this._operationWebApi.getComponentStatus(operation.name, this.form.value.machineData.machineName),
          this._operationWebApi.getToolStatus(operation.name, this.form.value.machineData.machineName),
          this._materialMasterWebApi.getPartMaster(operation.article)).pipe(
            map((array: [ComponentStatus[], ToolStatus[], MaterialMaster]) => {
              this.componentStatus$.next(array[0]);
              this.toolStatus$.next(array[1]);
              this.form.controls.outputBatchSize.setValue(array[2].standardPackageQty);
              return operation;
            })
          );
      }));
  }

  //#endregion

  //#region Operation Reqeust
  requestOutputBatchSizeDataSuccess = (_) => {
  }

  requestOutputBatchSizeDataFailed = () => {
  }

  requestOutputBatchSizeData = (): Observable<any> => {
    if (!/^[0-9]*$/.test(this.form.value.outputBatchSize)) {
      return throwError('Incorrect Output Batch Size');
    }

    if (!this.operationData) {
      return throwError('Input Operation First');
    }

    return of(toNumber(this.form.value.outputBatchSize, 1));
  }

  //#endregion

  //#endregion

  //#region Protected methods

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
  logonOperationSuccess = () => {
  }

  logonOperationFailed = () => {
  }

  logonOperation = () => {
    // LogOn Operation
    return this._operationWebApi.logonOperation(this.form.value.operationData,
      this.form.value.machineData, this.form.value.outputBatchSizeData, this.form.value.badgeData).pipe(
        map(_ => {
          return {
            isSuccess: true,
            description: `Operation ${this.operationData.name} Logged On!`,
          }
        }));
  }

  //#endregion

  //#region Override methods

  protected afterReset() {
    this.document.getElementById(`machine`).focus();

    this.componentStatus$.next([]);
    this.toolStatus$.next([]);
  }

  protected isValid() {
    return this.componentStatus$.value.every((status: ComponentStatus) => status.isReady)
      && this.toolStatus$.value.every((status: ToolStatus) => status.isReady)
      && this.form.value.machineData.currentOperations.length < this.form.value.machineData.numberOfOperationAllowed;
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
