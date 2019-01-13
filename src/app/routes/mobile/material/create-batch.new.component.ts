import { BaseForm } from '../base.form';
import { Component, ViewChild, ElementRef, Inject } from '@angular/core';
import { ToastService } from 'ngx-weui';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd';
import { TitleService, SettingsService, ALAIN_I18N_TOKEN } from '@delon/theme';
import { BatchService } from '@core/hydra/service/batch.service';
import { OperatorService } from '@core/hydra/service/operator.service';
import { BapiService } from '@core/hydra/service/bapi.service';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { BaseNewForm } from '../base.form.new';
import { of, throwError } from 'rxjs';
import { switchMap, catchError, map, tap } from 'rxjs/operators';
import { MaterialBatch } from '@core/hydra/entity/batch';
import { DOCUMENT } from '@angular/common';
import { I18NService } from '@core/i18n/i18n.service';

@Component({
  selector: 'fw-batch-create-new',
  templateUrl: 'create-batch.new.component.html',
  styleUrls: ['./create-batch.new.component.scss']
})
export class CreateBatchNewComponent extends BaseNewForm {
  //#region View Children

  //#endregion

  //#region Protected member
  protected key = `app.mobile.material.create`;
  //#endregion

  //#region Public member

  //#endregion

  //#region Constructor

  constructor(
    fb: FormBuilder,
    _toastService: ToastService,
    _routeService: Router,
    _message: NzMessageService,
    _titleService: TitleService,
    _settingService: SettingsService,
    private _batchService: BatchService,
    private _operatorService: OperatorService,
    private _bapiService: BapiService,
    @Inject(DOCUMENT) private _document: Document,
    @Inject(ALAIN_I18N_TOKEN) private i18n: I18NService,
  ) {
    super(fb, _settingService, _toastService, _routeService, _message, _titleService);
    this.addControls({
      barCode: [null, [Validators.required]],
      batch: [null, [Validators.required]],
      materialBuffer: [null, [Validators.required]],
      numberOfSplits: [1, [Validators.required, Validators.pattern('^[0-9]*$'), Validators.min(1)]],
      badge: [null, [Validators.required]],
      batchData: [null]
    });

    this.form.setValue(Object.assign(this.form.value, {
      badge: this.storedData ? this.storedData.badge : ``
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
  }

  requestBatchDataFailed = () => {
  }

  requestBatchData = () => {
    if (!this.form.value.batch) {
      return of(null);
    }

    let barCodeInfor;

    return this._batchService.getBatchInfoFrom2DBarCode(this.form.value.batch).pipe(
      switchMap((barCodeData: MaterialBatch) => {
        barCodeInfor = barCodeData;
        return this._batchService.getBatchInformation(barCodeData.name);
      }),
      switchMap((batchData: MaterialBatch) => {
        if (batchData) {
          return throwError(`Batch ${batchData.name} exist！`);
        }
        return of(barCodeInfor);
      }
      ));
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
      })
    );
  }

  //#endregion

  //#region Number of Splits Reqeust
  requestNumberOfSplitsDataSuccess = () => {
    this.descriptions.set(`numberOfSplits`, this.getSplitInfo());
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

  //#region Badge Reqeust
  requestBadgeDataSuccess = () => {
  }

  requestBadgeDataFailed = () => {
  }

  requestBadgeData = () => {
    if (!this.form.value.badge) {
      return of(null);
    }

    return this._operatorService.getOperatorByBadge(this.form.value.badge).pipe(
      tap(operator => {
        if (!operator) {
          throw Error(`${this.form.value.badge} not exist!`);
        }
      }));
  }
  //#endregion

  //#endregion

  //#region Protected methods

  //#endregion

  //#region Event Handler

  //#endregion

  //#region Exeuction

  //#endregion

  //#region Override methods
  protected isValid() {
    return !Array.from(this.descriptions.entries()).some(value => {
      return (value[0] !== `batchData` && value[0] !== `barCode` && !value[1]);
    });
  }

  protected afterReset() {
    this._document.getElementById(`batch`).focus();
  }

  protected get title(): string {
    return this.i18n.fanyi(this.key);
  }

  //#endregion


  //#region Private methods
  private getSplitInfo() {
    return `Child Qty: ${this.form.value.batchData.quantity / this.form.value.numberOfSplits}`;
  }
  //#endregion
}
