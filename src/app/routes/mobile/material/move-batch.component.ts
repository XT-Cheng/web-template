import { BaseForm } from '../base.form';
import { Component, Inject } from '@angular/core';
import { ToastService, ToptipsService } from 'ngx-weui';
import { Router } from '@angular/router';
import { TitleService, SettingsService, ALAIN_I18N_TOKEN } from '@delon/theme';
import { BatchService } from '@core/hydra/service/batch.service';
import { OperatorService } from '@core/hydra/service/operator.service';
import { BapiService } from '@core/hydra/service/bapi.service';
import { FormBuilder, Validators } from '@angular/forms';
import { MaterialBatch } from '@core/hydra/entity/batch';
import { DOCUMENT } from '@angular/common';
import { I18NService } from '@core/i18n/i18n.service';
import { IActionResult } from '@core/utils/helpers';
import { requestBatchData, requestMaterialBufferData } from './request.common';
import { requestBadgeData } from '../request.common';

@Component({
  selector: 'fw-batch-move',
  templateUrl: 'move-batch.component.html',
  styleUrls: ['./move-batch.component.scss']
})
export class MoveBatchComponent extends BaseForm {
  //#region View Children

  //#endregion

  //#region Protected member
  protected key = `app.mobile.material.move`;
  //#endregion

  //#region Public member

  requestBatchData = requestBatchData(this.form, this._batchService);
  requestMaterialBufferData = requestMaterialBufferData(this.form, this._batchService);
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
