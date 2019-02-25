import { Component, Injector } from '@angular/core';
import { Validators } from '@angular/forms';
import { of, Observable, BehaviorSubject } from 'rxjs';
import { Machine } from '@core/hydra/entity/machine';
import { MachineService } from '@core/hydra/service/machine.service';
import { Operation, ToolStatus } from '@core/hydra/entity/operation';
import { OperationService } from '@core/hydra/service/operation.service';
import { map } from 'rxjs/operators';
import { BaseExtendForm } from '../base.form.extend';
import { getToolStatus } from '@core/hydra/utils/operationHelper';
import { MPLBapiService } from '@core/hydra/bapi/mpl/bapi.service';
import { ToolService } from '@core/hydra/service/toolService';

@Component({
  selector: 'fw-tool-logon',
  templateUrl: 'logon-tool.component.html',
  styleUrls: ['./logon-tool.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class LogonToolComponent extends BaseExtendForm {
  //#region View Children

  //#endregion

  //#region Protected member

  protected key = `app.mobile.tool.logon`;

  //#endregion

  //#region Public member

  toolStatus$: BehaviorSubject<ToolStatus[]> = new BehaviorSubject<[]>([]);
  operations$: BehaviorSubject<Operation[]> = new BehaviorSubject<[]>([]);

  //#endregion

  //#region Public member

  //#endregion

  //#region Constructor

  constructor(
    injector: Injector,
    private _toolService: ToolService,
    private _machineService: MachineService,
    private _operationService: OperationService,
    private _bapiService: MPLBapiService,
  ) {
    super(injector, false);
    this.addControls({
      operation: [null, [Validators.required], 'operationData'],
      machine: [null, [Validators.required], 'machineData'],
      toolMachine: [null, [Validators.required], 'toolMachineData'],
      tool: [null, [Validators.required], 'toolData'],
      batch: [null, [Validators.required], 'batchData'],
      actionData: [null, [Validators.required]],
    });
  }

  //#endregion

  //#region Public methods

  //#endregion

  //#region Data Request

  //#region Tool Reqeust

  requestToolDataSuccess = () => {
  }

  requestToolDataFailed = () => {
  }

  requestToolData = () => {
    return this._toolService.getTool(this.form.value.tool);
  }

  //#endregion

  //#region Tool Machine Reqeust

  requestToolMachineDataSuccess = () => {
  }

  requestToolMachineDataFailed = () => {
  }

  requestToolMachineData = () => {
    return this._machineService.getMachine(this.form.value.toolMachine);
  }

  //#endregion

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
      this.doAction(this.logonTool, this.logonToolSuccess, this.logonToolFailed);
    }
  }

  requestBatchDataFailed = () => {
  }

  requestBatchData = () => {
    return of(null);
    // return requestBatchData(this.form, this._batchService)().pipe(
    //   switchMap((batch: MaterialBatch) => {
    //     const found = this.componentStatus$.value.find(cs => cs.material === batch.material);
    //     if (!found) {
    //       return throwError(`Material ${batch.material} in-correct!`);
    //     }

    //     if (found.isReady) {
    //       return throwError(`Material ${batch.material} already logged on!`);
    //     }

    //     this.form.controls.actionData.setValue(found);
    //     return of(batch);
    //   }
    //   ));
  }

  //#endregion

  //#region Operation Reqeust
  requestOperationDataSuccess = (_) => {
    setTimeout(() => this.document.getElementById(`toolMachine`).focus(), 0);
  }

  requestOperationDataFailed = () => {
  }

  requestOperationData = (): Observable<any> => {
    return this._operationService.getOperation(this.form.value.operation).pipe(
      map(operation => {
        this.toolStatus$.next(getToolStatus(operation, this.machineData));
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
  logonToolSuccess = () => {
    this.form.controls.batch.setValue(null);
    this.form.controls.operation.setValue(``);
    this.form.controls.batchData.setValue(null);
    this.form.controls.operationData.setValue(null);
    this.form.controls.actionData.setValue(null);

    this.toolStatus$.next([]);
    this.operations$.next([]);

    this.request(this.requestMachineData, this.requestMachineDataSuccess, this.requestMachineDataFailed)
      (null, null, `machine`);
  }

  logonToolFailed = () => {
  }

  logonTool = () => {
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

    this.toolStatus$.next([]);
    this.operations$.next([]);
  }

  //#endregion

  //#region Private methods

  //#endregion
}
