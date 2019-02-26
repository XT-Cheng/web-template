import { Component, Injector } from '@angular/core';
import { Validators } from '@angular/forms';
import { of, Observable, BehaviorSubject, throwError } from 'rxjs';
import { Machine } from '@core/hydra/entity/machine';
import { MachineService } from '@core/hydra/service/machine.service';
import { Operation, ToolStatus } from '@core/hydra/entity/operation';
import { OperationService } from '@core/hydra/service/operation.service';
import { map, switchMap } from 'rxjs/operators';
import { BaseExtendForm } from '../base.form.extend';
import { getToolStatus } from '@core/hydra/utils/operationHelper';
import { ToolService } from '@core/hydra/service/toolService';
import { requestBatchData } from '../material/request.common';
import { BatchService } from '@core/hydra/service/batch.service';
import { MaterialBatch } from '@core/hydra/entity/batch';
import { WRMBapiService } from '@core/hydra/bapi/wrm/bapi.service';

@Component({
  selector: 'fw-tool-logoff',
  templateUrl: 'logoff-tool.component.html',
  styleUrls: ['./logoff-tool.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class LogoffToolComponent extends BaseExtendForm {
  //#region View Children

  //#endregion

  //#region Protected member

  protected key = `app.mobile.tool.logoff`;

  //#endregion

  //#region Public member

  //#endregion

  //#region Public member

  //#endregion

  //#region Constructor

  constructor(
    injector: Injector,
    private _machineService: MachineService,
    private _bapiService: WRMBapiService,
  ) {
    super(injector);
    this.addControls({
      toolMachine: [null, [Validators.required], 'toolMachineData'],
    });
  }

  //#endregion

  //#region Public methods

  //#endregion

  //#region Data Request

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

        if (toolMachine.toolsLoggedOn.length === 0) {
          throw Error(`Tool Machine ${this.form.value.toolMachine} has no tool logged on!`);
        }

        return toolMachine;
      })
    );
  }

  //#endregion

  //#endregion

  //#region Protected methods

  //#endregion

  //#region Event Handler

  //#endregion

  //#region Exeuction
  logoffToolSuccess = () => {
  }

  logoffToolFailed = () => {
  }

  logoffTool = () => {
    // LogOff Tool
    return this._bapiService.logoffTool({ name: this.form.value.toolMachineData.toolsLoggedOn[0].loggedOnOperation },
      { machineName: this.form.value.toolMachine }, { toolId: this.form.value.toolMachineData.toolsLoggedOn[0].toolId },
      this.operatorData);
  }

  //#endregion

  //#region Override methods

  protected afterReset() {
    this.document.getElementById(`toolMachine`).focus();
  }

  //#endregion

  //#region Private methods

  //#endregion
}
