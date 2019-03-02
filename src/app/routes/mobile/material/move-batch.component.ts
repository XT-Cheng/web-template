import { Component, Injector } from '@angular/core';
import { BatchService } from '@core/hydra/service/batch.service';
import { Validators } from '@angular/forms';
import { MaterialBatch } from '@core/hydra/entity/batch';
import { IActionResult } from '@core/utils/helpers';
import { requestBatchData } from './request.common';
import { tap } from 'rxjs/operators';
import { MPLBapiService } from '@core/hydra/bapi/mpl/bapi.service';
import { BaseExtendForm } from '../base.form.extend';

@Component({
  selector: 'fw-batch-move',
  templateUrl: 'move-batch.component.html',
  styleUrls: ['./move-batch.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class MoveBatchComponent extends BaseExtendForm {
  //#region View Children

  //#endregion

  //#region Protected member
  protected key = `app.mobile.material.move`;
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
      materialBuffer: [null, [Validators.required], 'materialBufferData'],
    });
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

  //#region Buffer Reqeust
  requestMaterialBufferDataSuccess = () => {
  }

  requestMaterialBufferDataFailed = () => {
  }

  requestMaterialBufferData = () => {
    return this._batchService.getMaterialBuffer(this.form.value.materialBuffer).pipe(
      tap(buffer => {
        if (!buffer) {
          throw Error(`${this.form.value.materialBuffer} not exist!`);
        }
        if (buffer.name === this.batchData.bufferName) {
          throw Error(`Batch alreaday in Location ${this.batchData.bufferName}`);
        }
      })
    );
  }

  //#endregion

  //#endregion

  //#endregion

  //#region Protected methods

  //#endregion

  //#region Event Handler

  //#endregion

  //#region Exeuction
  moveBatchSuccess = () => {
  }

  moveBatchFailed = () => {
  }

  moveBatch = () => {
    // Move Batch
    return this._bapiService.moveBatch(this.batchData, this.form.value.materialBufferData, this.operatorData);
  }

  //#endregion

  //#region Override methods
  protected afterReset() {
    this.document.getElementById(`batch`).focus();
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
