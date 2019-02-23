import { BaseForm } from '../base.form';
import { Component, Inject } from '@angular/core';
import { ToastService, ToptipsService } from 'ngx-weui';
import { Router } from '@angular/router';
import { toNumber } from 'ng-zorro-antd';
import { TitleService, SettingsService, ALAIN_I18N_TOKEN } from '@delon/theme';
import { BatchService } from '@core/hydra/service/batch.service';
import { OperatorService } from '@core/hydra/service/operator.service';
import { BapiService } from '@core/hydra/service/bapi.service';
import { FormBuilder, Validators } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { switchMap, tap, map } from 'rxjs/operators';
import { DOCUMENT } from '@angular/common';
import { I18NService } from '@core/i18n/i18n.service';
import { IActionResult } from '@core/utils/helpers';
import { PrintService } from '@core/hydra/service/print.service';
import { requestBatchData } from './request.common';
import { requestBadgeData } from '../request.common';
import { MPLBapiService } from '@core/hydra/bapi/mpl/bapi.service';

@Component({
  selector: 'fw-batch-adjust-qty',
  templateUrl: 'adjust-batch-quantity.component.html',
  styleUrls: ['./adjust-batch-quantity.component.scss']
})
export class AdjustBatchQuantityComponent extends BaseForm {
  //#region View Children

  //#endregion

  //#region Protected member
  protected key = `app.mobile.material.adjustQty`;
  //#endregion

  //#region Public member

  requestBatchData = requestBatchData(this.form, this._batchService);

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
    _operatorService: OperatorService,
    private _bapiService: MPLBapiService,
    private _printService: PrintService,
    @Inject(DOCUMENT) private _document: Document,
    @Inject(ALAIN_I18N_TOKEN) _i18n: I18NService,
  ) {
    super(fb, _settingService, _toastService, _routeService, _tipService, _titleService, _i18n, _operatorService);
    this.addControls({
      barCode: [null, [Validators.required]],
      batch: [null, [Validators.required]],
      newQty: [null, [Validators.required, Validators.pattern('^[0-9]*$'), Validators.min(1)]],
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
  requestBatchDataSuccess = (barCodeInfor) => {
    this.form.controls.batch.setValue(barCodeInfor.name);
    this.form.controls.barCode.setValue(barCodeInfor.barCode);
    this.form.controls.batchData.setValue(barCodeInfor);

    if (this.storedData && this.storedData.materialSplits && this.storedData.materialSplits[barCodeInfor.material]) {
      this.form.controls.numberOfSplits.setValue(this.storedData.materialSplits[barCodeInfor.material]);
    }
  }

  requestBatchDataFailed = () => {
  }

  //#endregion

  //#region New Qty Reqeust
  requestNewQtyDataSuccess = () => {
  }

  requestNewQtyDataFailed = () => {
  }

  requestNewQtyData = () => {
    if (!/^[0-9]*$/.test(this.form.value.newQty)) {
      return throwError('Incorrect New Qty');
    }

    if (!this.form.value.batchData) {
      return throwError('Input Batch First');
    }

    if (toNumber(this.form.value.newQty, 0) < 1) {
      return throwError('Incorrect New Qty');
    }

    return of(null);
  }

  //#endregion

  //#endregion

  //#region Protected methods

  //#endregion

  //#region Event Handler

  //#endregion

  //#region Exeuction
  adjustBatchQtySuccess = (ret: IActionResult) => {
    this.showSuccess(ret.description);
  }

  adjustBatchQtyFailed = () => {
  }

  adjustBatchQty = () => {
    // Adjust Batch Qty
    const newQty = toNumber(this.form.value.newQty, 0);
    return this._bapiService.changeBatchQuantity(this.form.value.batchData, newQty, this.form.value.badge).pipe(
      switchMap(_ => {
        return this._printService.printMaterialBatchLabel(this.form.value.batchData.name, `Machine`, 9999);
      }),
      map((_) => {
        return {
          isSuccess: true,
          description: `Batch ${this.form.value.batchData.name} Quantity Changed And Label Printed!`,
        };
      })
    );
  }

  //#endregion

  //#region Override methods
  protected isValid() {
    return !Array.from(this.descriptions.entries()).some(value => {
      return (value[0] !== `batchData` && value[0] !== `barCode` && value[0] !== `newQty` && !value[1]);
    });
  }

  protected afterReset() {
    this._document.getElementById(`batch`).focus();
  }

  //#endregion


  //#region Private methods

  //#endregion
}
