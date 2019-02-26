import { Component, Injector } from '@angular/core';
import { Validators } from '@angular/forms';
import { Observable, BehaviorSubject } from 'rxjs';
import { Machine } from '@core/hydra/entity/machine';
import { MachineService } from '@core/hydra/service/machine.service';
import { Operation, ToolStatus } from '@core/hydra/entity/operation';
import { OperationService } from '@core/hydra/service/operation.service';
import { map } from 'rxjs/operators';
import { BaseExtendForm } from '../base.form.extend';
import { getToolStatus } from '@core/hydra/utils/operationHelper';
import { ToolService } from '@core/hydra/service/toolService';
import { requestBatchData } from '../material/request.common';
import { BatchService } from '@core/hydra/service/batch.service';
import { MaterialBatch } from '@core/hydra/entity/batch';
import { WRMBapiService } from '@core/hydra/bapi/wrm/bapi.service';

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
    private _batchService: BatchService,
    private _operationService: OperationService,
    private _bapiService: WRMBapiService,
  ) {
    super(injector, false);
    this.addControls({
      operation: [null, [Validators.required], 'operationData'],
      machine: [null, [Validators.required], 'machineData'],
      toolMachine: [null, [Validators.required], 'toolMachineData'],
      tool: [null, [Validators.required], 'toolData'],
      batch: [null, [Validators.required], 'batchData'],
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
    return this._toolService.getTool(this.form.value.tool).pipe(
      map(tool => {
        if (!tool) {
          throw Error(`Tool ${this.form.value.tool} not exist`);
        }

        if (tool.loggedOnMachine) {
          throw Error(`Tool ${this.form.value.tool} already log on to ${tool.loggedOnMachine}`);
        }

        const toolItem = this.operationData.toolItems.get(this.batchData.material);
        if (!toolItem.availableTools.includes(tool.toolName)) {
          throw Error(`Tool ${tool.toolName} not valid for Material ${this.batchData.material}`);
        }

        return tool;
      })
    );
  }

  //#endregion

  //#region Tool Machine Reqeust

  requestToolMachineDataSuccess = () => {
  }

  requestToolMachineDataFailed = () => {
  }

  requestToolMachineData = () => {
    return this._machineService.getToolMachine(this.form.value.toolMachine).pipe(
      map(toolMachine => {
        if (toolMachine === null) {
          throw Error(`Tool Machine ${this.form.value.toolMachine} invalid!`);
        }

        if (toolMachine.toolsLoggedOn.length > 0) {
          throw Error(`Tool Machine ${this.form.value.toolMachine} already has tool logged on!`);
        }

        return toolMachine;
      })
    );
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

    setTimeout(() => {
      this.document.getElementById(`tool`).focus();
    }, 0);
    // if (!this.isDisable()) {
    //   this.doAction(this.logonTool, this.logonToolSuccess, this.logonToolFailed);
    // }
  }

  requestBatchDataFailed = () => {
  }

  requestBatchData = () => {
    return requestBatchData(this.form, this._batchService)().pipe(
      map((batch: MaterialBatch) => {
        if (!Array.from(this.operationData.toolItems.keys()).includes(batch.material)) {
          throw Error(`Material ${batch.material} in-correct!`);
        }
        return batch;
      }
      ));
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
    const machineName = this.form.value.machine;
    const operationName = this.form.value.operation;

    this.resetForm();

    this.toolStatus$.next([]);
    this.operations$.next([]);

    this.form.controls.machine.setValue(machineName);
    this._machineService.getMachine(machineName).subscribe((machine) => {
      this.form.controls.machineData.setValue(machine);
      this.operations$.next(machine.nextOperations);
      if (machine.nextOperations.length > 0) {
        this.form.controls.operation.setValue(operationName);
        this.request(this.requestOperationData, this.requestOperationDataSuccess, this.requestOperationDataFailed)
          (null, null, `operation`);
      }
    });
  }

  logonToolFailed = () => {
  }

  logonTool = () => {
    // LogOn Tool
    return this._bapiService.logonTool({ name: this.machineData.toolLogonOrder },
      { machineName: this.form.value.toolMachine }, this.toolData,
      this.operatorData);
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
