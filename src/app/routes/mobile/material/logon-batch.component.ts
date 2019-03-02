import { Component, Injector } from '@angular/core';
import { BatchService } from '@core/hydra/service/batch.service';
import { Validators } from '@angular/forms';
import { MaterialBatch } from '@core/hydra/entity/batch';
import { requestBatchData } from './request.common';
import { of, Observable, BehaviorSubject, throwError } from 'rxjs';
import { Machine } from '@core/hydra/entity/machine';
import { MachineService } from '@core/hydra/service/machine.service';
import { Operation, ComponentStatus } from '@core/hydra/entity/operation';
import { OperationService } from '@core/hydra/service/operation.service';
import { map, switchMap } from 'rxjs/operators';
import { BaseExtendForm } from '../base.form.extend';
import { getComponentStatus } from '@core/hydra/utils/operationHelper';
import { MPLBapiService } from '@core/hydra/bapi/mpl/bapi.service';

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

  //#endregion

  //#region Constructor

  constructor(
    injector: Injector,
    private _batchService: BatchService,
    private _machineService: MachineService,
    private _operationService: OperationService,
    private _bapiService: MPLBapiService,
  ) {
    super(injector, false);
    this.addControls({
      operation: [null, [Validators.required], 'operationData'],
      machine: [null, [Validators.required], 'machineData'],
      batch: [null, [Validators.required], 'batchData'],
      actionData: [null, [Validators.required]],
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
    return this._machineService.getMachine(this.form.value.machine);
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
    return requestBatchData(this.form, this._batchService)().pipe(
      switchMap((batch: MaterialBatch) => {
        const found = this.componentStatus$.value.find(cs => cs.material === batch.material);
        if (!found) {
          return throwError(`Material ${batch.material} in-correct!`);
        }

        if (found.isReady) {
          return throwError(`Material ${batch.material} already logged on!`);
        }

        this.form.controls.actionData.setValue(found);
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
    return this._operationService.getOperation(this.form.value.operation).pipe(
      map(operation => {
        this.componentStatus$.next(getComponentStatus(operation, this.form.value.machineData));
        return operation;
      }));
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
  logonBatchSuccess = () => {
    this.form.controls.batch.setValue(null);
    this.form.controls.operation.setValue(``);
    this.form.controls.batchData.setValue(null);
    this.form.controls.operationData.setValue(null);
    this.form.controls.actionData.setValue(null);

    this.componentStatus$.next([]);
    this.operations$.next([]);

    this.request(this.requestMachineData, this.requestMachineDataSuccess, this.requestMachineDataFailed)
      (null, null, `machine`);
  }

  logonBatchFailed = () => {
  }

  logonBatch = () => {
    // LogOn Batch
    const actionData = this.form.value.actionData;
    return this._bapiService.logonInputBatch(this.form.value.operationData.name,
      this.form.value.machineData.machineName, this.form.value.badge,
      { name: this.form.value.batchData.name, material: this.form.value.batchData.material }, actionData.pos);
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
