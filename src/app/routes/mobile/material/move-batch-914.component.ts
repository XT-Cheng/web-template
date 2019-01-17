import { BaseForm } from '../base.form';
import { Component, Inject } from '@angular/core';
import { ToastService, ToptipsService } from 'ngx-weui';
import { Router } from '@angular/router';
import { TitleService, SettingsService, ALAIN_I18N_TOKEN } from '@delon/theme';
import { BatchService } from '@core/hydra/service/batch.service';
import { OperatorService } from '@core/hydra/service/operator.service';
import { BapiService } from '@core/hydra/service/bapi.service';
import { FormBuilder, Validators } from '@angular/forms';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MaterialBatch } from '@core/hydra/entity/batch';
import { DOCUMENT } from '@angular/common';
import { I18NService } from '@core/i18n/i18n.service';
import { IActionResult } from '@core/utils/helpers';
import { BUFFER_914 } from './constants';
import { requestBatchData } from './request.common';
import { requestBadgeData } from '../request.common';

@Component({
  selector: 'fw-batch-move-914',
  templateUrl: 'move-batch-914.component.html',
  styleUrls: ['./move-batch-914.component.scss']
})
export class MoveBatchTo914Component extends BaseForm {
  //#region View Children

  //#endregion

  //#region Protected member
  protected key = `app.mobile.material.moveTo914`;
  //#endregion

  //#region Public member

  requestBatchData = requestBatchData(this.form, this._batchService);
  requestBadgeData = requestBadgeData(this.form, this._operatorService);

  //#endregion

  //#region Constructor

  constructor(
    fb: FormBuilder,
    _toastService: ToastService,
    _routeService: Router,
    _tipService: ToptipsService,
    _titleService: TitleService,
    _settingService: SettingsService,
    private _batchService: BatchService,
    private _operatorService: OperatorService,
    private _bapiService: BapiService,
    @Inject(DOCUMENT) private _document: Document,
    @Inject(ALAIN_I18N_TOKEN) _i18n: I18NService,
  ) {
    super(fb, _settingService, _toastService, _routeService, _tipService, _titleService, _i18n);
    this.addControls({
      barCode: [null, [Validators.required]],
      batch: [null, [Validators.required]],
      materialBuffer: [null, [Validators.required]],
      badge: [null, [Validators.required]],
      batchData: [null]
    });

    this.form.setValue(Object.assign(this.form.value, {
      badge: this.storedData ? this.storedData.badge : ``,
    }));
  }

  //#endregion

  //#region Public methods

  //#endregion

  //#region Data Request

  //#region Batch Reqeust
  requestBatchDataSuccess = (batch: MaterialBatch) => {
    this.form.controls.batch.setValue(batch.name);
    this.form.controls.barCode.setValue(batch.barCode);
    this.form.controls.batchData.setValue(batch);
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
    if (!this.form.value.materialBuffer) {
      return of(null);
    }

    return this._batchService.getMaterialBuffer(this.form.value.materialBuffer).pipe(
      tap(buffer => {
        if (!buffer) {
          throw Error(`${this.form.value.materialBuffer} not exist!`);
        }
        if (!buffer.parentBuffers.find(x => x === BUFFER_914)) {
          throw Error(`${this.form.value.materialBuffer} not belongs to 914!`);
        }
        if (buffer.name === this.form.value.batchData.bufferName) {
          throw Error(`Batch alreaday in Location ${this.form.value.batchData.bufferName}`);
        }
      })
    );
  }

  //#endregion

  //#region Badge Reqeust
  requestBadgeDataSuccess = () => {
  }

  requestBadgeDataFailed = () => {
  }

  //#endregion

  //#endregion

  //#region Protected methods

  //#endregion

  //#region Event Handler

  //#endregion

  //#region Exeuction
  moveBatchSuccess = (ret: IActionResult) => {
    this.showSuccess(ret.description);
  }

  moveBatchFailed = () => {
  }

  moveBatch = () => {
    // Move Batch
    return this._bapiService.moveBatch(this.form.value.batchData, this.form.value.materialBuffer, this.form.value.badge);
  }

  //#endregion

  //#region Override methods
  protected isValid() {
    return !Array.from(this.descriptions.entries()).some(value => {
      return (value[0] !== `batchData` && value[0] !== `barCode` && !value[1]);
    });
  }

  protected afterReset() {
    this._document.getElementById(`batch`).focus();

    this.form.controls.badge.setValue(this.storedData.badge);
  }

  //#endregion

  //#region Private methods

  //#endregion
}
