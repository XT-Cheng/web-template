import { Component, Injector } from '@angular/core';
import { BatchService } from '@core/hydra/service/batch.service';
import { Validators } from '@angular/forms';
import { MaterialBatch } from '@core/hydra/entity/batch';
import { IActionResult } from '@core/utils/helpers';
import { BUFFER_SAP } from './constants';
import { requestBatchData } from './request.common';
import { MPLBapiService } from '@core/hydra/bapi/mpl/bapi.service';
import { BaseExtendForm } from '../base.form.extend';

@Component({
  selector: 'fw-batch-move-sap',
  templateUrl: 'move-batch-sap.component.html',
  styleUrls: ['./move-batch-sap.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class MoveBatchToSAPComponent extends BaseExtendForm {
  //#region View Children

  //#endregion

  //#region Protected member
  protected key = `app.mobile.material.moveToSAP`;
  //#endregion

  //#region Public member

  requestBatchData = requestBatchData(this.form, this._batchService);

  //#endregion

  //#region Constructor

  constructor(
    injector: Injector,
    private _batchService: BatchService,
    private _bapiService: MPLBapiService,
  ) {
    super(injector);
    this.addControls({
      batch: [null, [Validators.required], 'batchData'],
      materialBuffer: [BUFFER_SAP, [Validators.required]],
    });

    this.form.controls.materialBuffer.setValue(BUFFER_SAP);
  }

  //#endregion

  //#region Public methods

  //#endregion

  //#region Data Request

  //#region Batch Reqeust
  requestBatchDataSuccess = (batch: MaterialBatch) => {
    this.form.controls.batch.setValue(batch.name);
  }

  requestBatchDataFailed = () => {
  }

  //#endregion

  //#endregion

  //#endregion

  //#region Protected methods

  //#endregion

  //#region Event Handler

  //#endregion

  //#region Exeuction
  moveBatchSuccess = (ret: IActionResult) => {
  }

  moveBatchFailed = () => {
  }

  moveBatch = () => {
    // Move Batch
    return this._bapiService.moveBatch(this.batchData, { name: this.form.value.materialBuffer }, this.operatorData);
  }

  //#endregion

  //#region Override methods

  protected afterReset() {
    this.document.getElementById(`batch`).focus();

    this.form.controls.materialBuffer.setValue(BUFFER_SAP);
  }

  //#endregion

  //#region Override properties

  get upperLevel(): string {
    return `/material/list`;
  }

  //#endregion

  //#region Private methods

  //#endregion
}
