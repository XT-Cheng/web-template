import { Component, Injector } from '@angular/core';
import { Validators } from '@angular/forms';
import { Observable, BehaviorSubject } from 'rxjs';
import { Machine } from '@core/hydra/entity/machine';
import { MachineService } from '@core/hydra/service/machine.service';
import { Operation } from '@core/hydra/entity/operation';
import { OperationService } from '@core/hydra/service/operation.service';
import { map } from 'rxjs/operators';
import { BaseExtendForm } from '../base.form.extend';
import { BDEBapiService } from '@core/hydra/bapi/bde/bapi.service';

@Component({
  selector: 'fw-operation-logoff',
  templateUrl: 'logoff-operation.component.html',
  styleUrls: ['./logoff-operation.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class LogoffOperationComponent extends BaseExtendForm {
  //#region View Children

  //#endregion

  //#region Protected member
  protected key = `app.mobile.operation.logoff`;
  //#endregion

  //#region Public member

  operations$: BehaviorSubject<Operation[]> = new BehaviorSubject<[]>([]);

  //#endregion

  //#region Public member

  //#endregion

  //#region Constructor

  constructor(
    injector: Injector,
    private _machineService: MachineService,
    private _operationService: OperationService,
    private _bapiService: BDEBapiService,
  ) {
    super(injector);
    this.addControls({
      machine: [null, [Validators.required], 'machineData'],
      operation: [null, [Validators.required], 'operationData'],
    });
  }

  //#endregion

  //#region Public methods

  //#endregion

  //#region Data Request

  //#region Machine Reqeust

  requestMachineDataSuccess = (machine: Machine) => {
    this.operations$.next(machine.currentOperations);
    if (machine.currentOperations.length > 0) {
      this.form.controls.operation.setValue(machine.currentOperations[0].name);
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

  //#region Operation Reqeust
  requestOperationDataSuccess = (_) => {
  }

  requestOperationDataFailed = () => {
    this.document.getElementById('machine').focus();
  }

  requestOperationData = (): Observable<any> => {
    return this._operationService.getOperation(this.form.value.operation).pipe(
      map(operation => {
        if (operation.pendingYieldQty !== 0) {
          throw Error(`Please Generate Output Batch first!`);
        }
        return operation;
      }));
  }

  //#endregion

  //#endregion

  //#region Protected methods

  //#endregion

  //#region Event Handler

  //#endregion

  //#region Exeuction
  logoffOperationSuccess = () => {
  }

  logoffOperationFailed = () => {
  }

  logoffOperation = () => {
    // Interrupt Operation
    return this._bapiService.logoffOperation(this.operationData,
      this.machineData, this.operatorData);
  }

  //#endregion

  //#region Override methods

  protected afterReset() {
    this.document.getElementById(`machine`).focus();
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
