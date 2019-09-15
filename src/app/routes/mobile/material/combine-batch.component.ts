import { Component, Injector } from '@angular/core';
import { toNumber } from 'ng-zorro-antd';
import { of, throwError, Observable } from 'rxjs';
import { switchMap, map, tap } from 'rxjs/operators';
import { deepExtend } from '@core/utils/helpers';
import { BaseExtendForm } from '../base.form.extend';
import { MaterialBatch } from '@core/hydra/entity/batch';
import { BatchWebApi } from '@core/webapi/batch.webapi';

@Component({
  selector: 'fw-batch-combine',
  templateUrl: 'combine-batch.component.html',
  styleUrls: ['./combine-batch.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class CombineBatchComponent extends BaseExtendForm {
  //#region View Children

  //#endregion

  //#region Protected member

  protected key = `app.mobile.material.combine`;
  batches: MaterialBatch[] = [];
  protected quantitySplit: number[] = [];

  //#endregion

  //#region Public member

  //#endregion

  //#region Constructor

  constructor(
    injector: Injector,
    private _batchWebApi: BatchWebApi,
  ) {
    super(injector);
    this.addControls({
      batch: [null, [], 'batchData'],
      quantity: [null, [], 'quantityData'],
    }, true);
  }

  //#endregion

  //#region Public methods

  getDisplay(batch: MaterialBatch, index: number) {
    if (!this.quantitySplit[index])
      return `${batch.name},${batch.material},0`;

    return `${batch.name},${batch.material},${this.quantitySplit[index]}`;
  }

  //#region Data Request

  //#region Batch Reqeust
  requestBatchDataSuccess = (batch) => {
    this.batches.push(this.batchData);

    this.form.controls.batch.setValue(batch.name);
    this.form.controls.quantity.setValue(``);
    this.form.controls.quantityData.setValue(null);

    if (this.storedData && this.storedData.materialCombine && this.storedData.materialCombine[`${batch.material}`]) {
      this.form.controls.quantity.setValue(this.storedData.materialCombine[`${batch.material}`]);
    }
  }

  requestBatchDataFailed = () => {
  }

  requestBatchData = () => {
    let barCodeInfo: MaterialBatch;
    return this._batchWebApi.getBatchInfoFrom2DBarCode(this.form.value.batch).pipe(
      switchMap((barCodeData: MaterialBatch) => {
        barCodeInfo = barCodeData;
        return this._batchWebApi.getBatch(barCodeData.name).pipe(
          map((batch: MaterialBatch) => {
            if (batch) {
              batch.barCode = barCodeData.barCode;
            }
            return batch;
          })
        );
      }),
      tap((batch: MaterialBatch) => {
        if (!batch) {
          throw Error(`${barCodeInfo.name} not exist!`);
        }
        if (this.batches.find(x => x.name === batch.name)) {
          throw Error(`${barCodeInfo.name} exist already`);
        }
      }));
  }

  //#endregion

  //#region Quantity Reqeust
  requestQuantityDataSuccess = () => {
    this.storedData = deepExtend(this.storedData, {
      materialCombine: {
        [`${this.form.value.batchData.material}`]: this.form.value.quantityData
      }
    });
    this.quantitySplit.push(this.form.value.quantityData);

    this.form.controls.batch.setValue(``);
    this.form.controls.quantity.setValue(``);
    this.form.controls.batchData.setValue(null);
    this.form.controls.quantityData.setValue(null);
  }

  requestQuantityDataFailed = () => {
  }

  requestQuantityData = () => {
    if (!/^[0-9]*$/.test(this.form.value.quantity)) {
      return throwError('Incorrect Qty');
    }

    if (!this.form.value.batchData) {
      return throwError('Input Batch First');
    }

    const quantity = toNumber(this.form.value.quantity, 0);

    if (quantity < 1) {
      return throwError('Incorrect Quantity');
    }

    if (quantity > this.form.value.batchData.quantity) {
      return throwError(`Incorrect Quantity!`);
    }

    return of(quantity);
  }

  //#endregion

  //#endregion

  //#endregion

  //#region Protected methods
  protected isValid() {
    return this.batches.length > 0 && this.quantitySplit.length > 0 && this.batches.length === this.quantitySplit.length;
  }

  protected beforeRequestCheck(srcElement): Observable<boolean> {
    if (!srcElement) return of(true);

    if (!this.printer)
      return throwError(`Setup Printer first`);

    switch (srcElement.id) {
      case 'quantity':
        if (!this.form.value.batchData) {
          return throwError(`Input Batch First`);
        }
        break;
      default:
        return of(true);
    }
    return of(true);
  }

  //#endregion

  //#region Event Handler

  //#endregion

  //#region Exeuction
  combineBatchSuccess = () => {
  }

  combineBatchFailed = () => {
  }

  combineBatch = () => {
    // Split Batch And Print
    let batchNames = this.batches.map(b => b.name);
    return this._batchWebApi.combineBatch(batchNames, this.quantitySplit, this.operatorData).pipe(
      map(_ => {
        return {
          isSuccess: true,
          description: `Batch ${batchNames.join(`,`)} Split And Label Printed!`,
        };
      }));
  }

  //#endregion

  //#region Override methods

  protected afterReset() {
    this.batches = [];
    this.quantitySplit = [];

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
