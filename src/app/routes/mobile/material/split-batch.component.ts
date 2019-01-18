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
import { of, throwError, Observable, forkJoin } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { DOCUMENT } from '@angular/common';
import { I18NService } from '@core/i18n/i18n.service';
import { deepExtend, IActionResult } from '@core/utils/helpers';
import { PrintService } from '@core/hydra/service/print.service';
import { requestBatchData } from './request.common';
import { requestBadgeData } from '../request.common';

@Component({
  selector: 'fw-batch-split',
  templateUrl: 'split-batch.component.html',
  styleUrls: ['./split-batch.component.scss']
})
export class SplitBatchComponent extends BaseForm {
  //#region View Children

  //#endregion

  //#region Protected member
  protected key = `app.mobile.material.split`;
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
    private _bapiService: BapiService,
    private _printService: PrintService,
    @Inject(DOCUMENT) private _document: Document,
    @Inject(ALAIN_I18N_TOKEN) _i18n: I18NService,
  ) {
    super(fb, _settingService, _toastService, _routeService, _tipService, _titleService, _i18n, _operatorService);
    this.addControls({
      barCode: [null, [Validators.required]],
      batch: [null, [Validators.required]],
      numberOfSplits: [1, [Validators.required, Validators.pattern('^[0-9]*$'), Validators.min(1)]],
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

  //#region Number of Splits Reqeust
  requestNumberOfSplitsDataSuccess = () => {
    this.descriptions.set(`numberOfSplits`, this.getSplitInfo());
    this.storedData = deepExtend(this.storedData, {
      materialSplits: {
        [this.form.controls.batchData.value.material]: this.form.value.numberOfSplits
      }
    });
  }

  requestNumberOfSplitsDataFailed = () => {
  }

  requestNumberOfSplitsData = () => {
    if (!/^[0-9]*$/.test(this.form.value.numberOfSplits)) {
      return throwError('Incorrect Child Count');
    }

    if (!this.form.value.batchData) {
      return throwError('Input Batch First');
    }

    if ((this.form.value.batchData.quantity % this.form.value.numberOfSplits) > 0) {
      return throwError('Incorrect Child Count');
    }

    return of(null);
  }

  //#endregion

  //#endregion

  //#endregion

  //#region Protected methods

  //#endregion

  //#region Event Handler

  //#endregion

  //#region Exeuction
  splitBatchSuccess = (ret: IActionResult) => {
    this.showSuccess(ret.description);
  }

  splitBatchFailed = () => {
  }

  splitBatch = () => {
    // Split Batch
    const children = toNumber(this.form.value.numberOfSplits, 1);
    return this._bapiService.splitBatch(this.form.value.batchData, toNumber(children, 0),
      this.form.value.batchData.quantity / children, this.form.value.badge).pipe(
        switchMap(ret => {
          const print$: Observable<IActionResult>[] = [];
          ret.context.forEach((childBatch) => {
            print$.push(this._printService.printMaterialBatchLabel(childBatch, `Machine`, 9999));
          });
          return forkJoin(print$).pipe(
            map((_) => {
              return {
                isSuccess: true,
                error: ``,
                content: ``,
                description: `Batch ${this.form.value.batchData.name} Split to ${ret.context.join(`,`)} And Label Printed!`,
                context: ret.context
              };
            })
          );
        })
      );
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

    this.form.controls.numberOfSplits.setValue(1);
  }

  //#endregion


  //#region Private methods
  private getSplitInfo() {
    return `Child Qty: ${this.form.value.batchData.quantity / this.form.value.numberOfSplits}`;
  }
  //#endregion
}
