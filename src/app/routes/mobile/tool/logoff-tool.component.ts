import { Component, Injector } from '@angular/core';
import { Validators } from '@angular/forms';
import { MachineService } from '@core/hydra/service/machine.service';
import { map, switchMap, tap } from 'rxjs/operators';
import { BaseExtendForm } from '../base.form.extend';
import { WRMBapiService } from '@core/hydra/bapi/wrm/bapi.service';
import { FetchService } from '@core/hydra/service/fetch.service';
import { ToolWebApi } from '@core/webapi/tool.webapi';
import { MachineWebApi } from '@core/webapi/machine.webapi';
import { ToolLoggedOn } from '@core/hydra/entity/operation';

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
    private _toolWebApi: ToolWebApi,
    private _machineWebApi: MachineWebApi,
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
    return this._machineWebApi.getToolMachine(this.form.value.toolMachine).pipe(
      tap(toolMachine => {
        if (toolMachine === null) {
          throw Error(`Tool Machine ${this.form.value.toolMachine} invalid!`);
        }

        if (toolMachine.toolsLoggedOn.length === 0) {
          throw Error(`Tool Machine ${this.form.value.toolMachine} has no tool logged on!`);
        }
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
    var toolLoggedOn = this.form.value.toolMachineData.toolsLoggedOn[0] as ToolLoggedOn;
    return this._toolWebApi.logoffTool(toolLoggedOn.toolName, toolLoggedOn.toolId,
      toolLoggedOn.loggedOnOperation, toolLoggedOn.loggedOnMachine, this.operatorData).pipe(
        map(_ => {
          return {
            isSuccess: true,
            description: `Tool ${toolLoggedOn.toolName} Logged Off!`
          }
        }));
  }

  //#endregion

  //#region Override methods

  protected afterReset() {
    this.document.getElementById(`toolMachine`).focus();
  }

  //#endregion

  //#region Override properties

  get upperLevel(): string {
    return `/tool/list`;
  }

  //#endregion

  //#region Private methods

  //#endregion
}
