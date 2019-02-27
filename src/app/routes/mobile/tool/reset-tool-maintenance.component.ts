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
import { ToolService } from '@core/hydra/service/tool.service';
import { requestBatchData } from '../material/request.common';
import { BatchService } from '@core/hydra/service/batch.service';
import { MaterialBatch } from '@core/hydra/entity/batch';
import { WRMBapiService } from '@core/hydra/bapi/wrm/bapi.service';

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
    private _toolService: ToolService,
    private _bapiService: WRMBapiService,
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

    this.form.controls.current.disable();
    this.form.controls.next.disable();
    this.form.controls.interval.disable();
  }

  requestToolDataFailed = () => {
  }

  requestToolData = () => {
    return this._toolService.getTool(this.form.value.tool).pipe(
      map(tool => {
        if (tool === null) {
          throw Error(`Tool ${this.form.value.tool} invalid!`);
        }

        if (tool.maintenanceId === -1) {
          throw Error(`Tool ${this.form.value.tool} has no maintenance setup!`);
        }

        return tool;
      })
    );
  }

  //#endregion

  //#endregion

  //#region Protected methods
  protected init() {
    this.form.controls.current.disable();
    this.form.controls.next.disable();
    this.form.controls.interval.disable();
  }
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
    return this._bapiService.resetTool(this.form.value.toolData, this.operatorData);
  }

  //#endregion

  //#region Override methods

  protected afterReset() {
    this.document.getElementById(`tool`).focus();
  }

  //#endregion

  //#region Private methods

  //#endregion
}
