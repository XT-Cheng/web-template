import { Component, Injector } from '@angular/core';
import { Validators } from '@angular/forms';
import { map } from 'rxjs/operators';
import { BaseExtendForm } from '../base.form.extend';
import { ToolService } from '@core/hydra/service/tool.service';
import { WRMBapiService } from '@core/hydra/bapi/wrm/bapi.service';
import { throwError, of } from 'rxjs';
import { toNumber } from 'ng-zorro-antd';
import { ToolWebApi } from '@core/webapi/tool.webapi';

@Component({
  selector: 'fw-tool-record-cycle',
  templateUrl: 'record-tool-cycle.component.html',
  styleUrls: ['./record-tool-cycle.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class RecordToolCycleComponent extends BaseExtendForm {
  //#region View Children

  //#endregion

  //#region Protected member

  protected key = `app.mobile.tool.recordCycle`;

  //#endregion

  //#region Public member

  //#endregion

  //#region Public member

  //#endregion

  //#region Constructor

  constructor(
    injector: Injector,
    private _toolWebApi: ToolWebApi,
    // private _toolService: ToolService,
    // private _bapiService: WRMBapiService,
  ) {
    super(injector);
    this.addControls({
      tool: [null, [Validators.required], 'toolData'],
      added: [0],
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

    this.form.controls.added.setValue(0);
  }

  requestToolDataFailed = () => {
  }

  requestToolData = () => {
    return this._toolWebApi.getTool(this.form.value.tool).pipe(
      map(tool => {
        if (!tool) {
          throw Error(`Tool ${this.form.value.tool} invalid!`);
        }

        if (!tool.maintenanceId) {
          throw Error(`Tool ${this.form.value.tool} has no maintenance setup!`);
        }

        if (!tool.loggedOnMachine) {
          throw Error(`Tool ${this.form.value.tool} is not loggedOn!`);
        }

        return tool;
      })
    );
  }

  //#endregion

  //#region Cycles Reqeust
  requestCycleDataSuccess = () => {
  }

  requestCycleDataFailed = () => {
  }

  requestCycleData = () => {
    if (!/^[0-9]*$/.test(this.form.value.added)) {
      return throwError('Incorrect Cycles');
    }

    const cycles = toNumber(this.form.value.added, 0);

    if (cycles < 1) {
      return throwError('Incorrect Cycles');
    }

    return of(cycles);
  }

  //#endregion

  //#endregion

  //#region Protected methods

  //#endregion

  //#region Event Handler

  //#endregion

  //#region Exeuction
  recordCycleToolSuccess = () => {
  }

  recordCycleToolFailed = () => {
  }

  recordCycleTool = () => {
    // Reset Tool
    return this._toolWebApi.recordToolCycle(this.toolData.loggedOnMachine, this.toolData.toolName, this.form.value.added, this.operatorData).pipe(
      map(_ => {
        return {
          isSuccess: true,
          description: `Tool ${this.toolData.toolName} Cycles Added!`
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
