import { Component, Injector } from '@angular/core';
import { Validators } from '@angular/forms';
import { map } from 'rxjs/operators';
import { BaseExtendForm } from '../base.form.extend';
import { ToolService } from '@core/hydra/service/tool.service';
import { WRMBapiService } from '@core/hydra/bapi/wrm/bapi.service';
import { ToolWebApi } from '@core/webapi/tool.webapi';

@Component({
  selector: 'fw-tool-reset-maintenance',
  templateUrl: 'reset-tool-maintenance.component.html',
  styleUrls: ['./reset-tool-maintenance.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class ResetToolMaintenanceComponent extends BaseExtendForm {
  //#region View Children

  //#endregion

  //#region Protected member

  protected key = `app.mobile.tool.reset`;

  //#endregion

  //#region Public member

  //#endregion

  //#region Public member

  //#endregion

  //#region Constructor

  constructor(
    injector: Injector,
    private _toolWebApi: ToolWebApi,
  ) {
    super(injector);
    this.addControls({
      tool: [null, [Validators.required], 'toolData'],
      current: [null],
      next: [null],
      interval: [null],
    });
  }

  //#endregion

  //#region Public methods

  //#endregion

  //#region Data Request

  //#region Tool Reqeust

  requestToolDataSuccess = () => {
    this.form.controls.current.setValue(this.form.value.toolData.currentCycles);
    this.form.controls.next.setValue(this.form.value.toolData.nextMaintennaceCycles);
    this.form.controls.interval.setValue(this.form.value.toolData.intervalCycles);
  }

  requestToolDataFailed = () => {
  }

  requestToolData = () => {
    return this._toolWebApi.getTool(this.form.value.tool).pipe(
      map(tool => {
        if (tool === null) {
          throw Error(`Tool ${this.form.value.tool} invalid!`);
        }

        if (!tool.maintenanceId) {
          throw Error(`Tool ${this.form.value.tool} has no maintenance setup!`);
        }

        return tool;
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
  resetToolSuccess = () => {
  }

  resetToolFailed = () => {
  }

  resetTool = () => {
    // Reset Tool
    return this._toolWebApi.resetTool(this.form.value.toolData.toolId, this.form.value.toolData.maintenanceId,
      this.operatorData).pipe(
        map(_ => {
          return {
            isSuccess: true,
            description: `Tool ${this.toolData.toolName} Maintenance Reset!`
          }
        }));
  }

  //#endregion

  //#region Override methods

  protected afterReset() {
    this.document.getElementById(`tool`).focus();
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
