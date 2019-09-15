import { Component, Injector } from '@angular/core';
import { toNumber } from 'ng-zorro-antd';
import { Validators } from '@angular/forms';
import { of, throwError, Observable, forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { deepExtend } from '@core/utils/helpers';
import { requestBatchData } from './request.common';
import { BaseExtendForm } from '../base.form.extend';
import { BatchWebApi } from '@core/webapi/batch.webapi';
import { PrintLabelWebApi } from '@core/webapi/printLabel.webapi';
import { MaterialMasterWebApi } from '@core/webapi/materialMaster.webapi';

@Component({
  selector: 'fw-batch-split',
  templateUrl: 'split-batch.component.html',
  styleUrls: ['./split-batch.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class SplitBatchComponent extends BaseExtendForm {
  //#region View Children

  //#endregion

  //#region Protected member
  protected key = `app.mobile.material.split`;
  //#endregion

  //#region Public member

  requestBatchData = requestBatchData(this.form, this._batchWebApi);

  //#endregion

  //#region Constructor

  constructor(
    injector: Injector,
    private _batchWebApi: BatchWebApi,
  ) {
    super(injector);
    this.addControls({
      batch: [null, [Validators.required], 'batchData'],
      numberOfSplits: [2, [Validators.required, Validators.pattern('^[0-9]*$'), Validators.min(1)], 'numberOfSplitsData'],
      childQty: [``, [Validators.required, Validators.pattern('^[0-9]*$'), Validators.min(1)], 'childQtyData'],
    });
  }

  //#endregion

  //#region Public methods
  hasNumberOfSplitsData() {
    if (!this.batchData) return false;

    if (!this.form.value.numberOfSplitsData) return false;

    return true;
  }

  getSplitInfo() {
    if (!this.batchData) return ` `;

    if (!this.form.value.numberOfSplitsData) return ` `;

    if (!this.form.value.childQtyData) return ` `;

    let ret = `${this.i18n.fanyi('app.common.childQty')}: ${this.form.value.childQtyData}`;

    if (this.batchData.quantity > (this.form.value.numberOfSplitsData * this.form.value.childQtyData)) {
      const remainQty = this.batchData.quantity - (this.form.value.numberOfSplitsData * this.form.value.childQtyData);
      ret += `, ${this.i18n.fanyi('app.common.remainQty')}: ${remainQty}`;
    }

    return ret;
  }
  //#endregion

  //#region Data Request

  //#region Batch Reqeust
  requestBatchDataSuccess = (batch) => {
    this.form.controls.batch.setValue(batch.name);

    if (this.storedData && this.storedData.materialSplits && this.storedData.materialSplits[batch.material]) {
      this.form.controls.numberOfSplits.setValue(this.storedData.materialSplits[batch.material]);
    }
  }

  requestBatchDataFailed = () => {
  }

  //#endregion

  //#region Number of Splits Reqeust
  requestNumberOfSplitsDataSuccess = () => {
    this.storedData = deepExtend(this.storedData, {
      materialSplits: {
        [this.batchData.material]: this.form.value.numberOfSplitsData
      }
    });

    const remainQty = this.batchData.quantity % this.form.value.numberOfSplitsData;
    const childQty = (this.batchData.quantity - remainQty) / this.form.value.numberOfSplitsData;

    this.form.controls.childQty.setValue(childQty);
    this.form.controls.childQtyData.setValue(childQty);
  }

  requestNumberOfSplitsDataFailed = () => {
  }

  requestNumberOfSplitsData = () => {
    if (!/^[0-9]*$/.test(this.form.value.numberOfSplits)) {
      return throwError('Incorrect Child Count');
    }

    const numberOfSplits = toNumber(this.form.value.numberOfSplits, 1);

    if ((this.batchData.quantity % numberOfSplits) > 0) {
      return throwError('Incorrect Child Count');
    }

    return of(numberOfSplits);
  }

  //#endregion

  //#region Child Qty Reqeust
  requestChildQtyDataSuccess = () => {
    this.storedData = deepExtend(this.storedData, {
      materialSplits: {
        [this.batchData.material]: this.form.value.numberOfSplitsData
      }
    });
  }

  requestChildQtyDataFailed = () => {
  }

  requestChildQtyData = () => {
    if (!/^[0-9]*$/.test(this.form.value.childQty)) {
      return throwError('Incorrect Child Qty');
    }

    const childQty = toNumber(this.form.value.childQty, 1);

    if (this.batchData.quantity < (this.form.value.numberOfSplitsData * childQty)) {
      return throwError('Not Enough Qty');
    }

    return of(childQty);
  }

  //#endregion

  //#endregion

  //#endregion

  //#region Protected methods

  protected beforeRequestCheck(srcElement): Observable<boolean> {
    if (!srcElement) return of(true);

    if (!this.printer)
      return throwError(`Setup Printer first`);

    if (srcElement.id === 'numberOfSplits' && !this.batchData) {
      return throwError(`Input Batch First`);
    }
    return of(true);
  }

  //#endregion

  //#region Event Handler

  //#endregion

  //#region Exeuction
  splitBatchSuccess = () => {
  }

  splitBatchFailed = () => {
  }

  splitBatch = () => {
    return this._batchWebApi.splitBatch(this.batchData, this.form.value.numberOfSplitsData,
      this.form.value.childQtyData, this.operatorData).pipe(
        switchMap((ltsToPrint: string[]) => {
          return of({
            isSuccess: true,
            error: ``,
            content: ``,
            description: `Batch ${this.batchData.name} Split to ${ltsToPrint.join(`,`)} and Label Printed!`,
          });
        })
      );
  }

  //#endregion

  //#region Override methods

  protected afterReset() {
    this.document.getElementById(`batch`).focus();

    this.form.controls.numberOfSplits.setValue(2);
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
