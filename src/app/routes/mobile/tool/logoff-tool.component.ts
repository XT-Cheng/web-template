import { Component, Injector } from '@angular/core';
import { Validators } from '@angular/forms';
import { MachineService } from '@core/hydra/service/machine.service';
import { map, switchMap, tap } from 'rxjs/operators';
import { BaseExtendForm } from '../base.form.extend';
import { WRMBapiService } from '@core/hydra/bapi/wrm/bapi.service';
import { FetchService } from '@core/hydra/service/fetch.service';

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
    private _fetchService: FetchService
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

  //#region Override properties

  get upperLevel(): string {
    return `/tool/list`;
  }

  //#endregion

  //#region Private methods

  //#endregion
}
