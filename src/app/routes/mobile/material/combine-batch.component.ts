import { Component, Injector } from '@angular/core';
import { toNumber } from 'ng-zorro-antd';
import { BatchService } from '@core/hydra/service/batch.service';
import { Validators } from '@angular/forms';
import { of, throwError, Observable, forkJoin } from 'rxjs';
import { switchMap, map, tap } from 'rxjs/operators';
import { deepExtend, IActionResult } from '@core/utils/helpers';
import { PrintService } from '@core/hydra/service/print.service';
import { requestBatchData } from './request.common';
import { MPLBapiService } from '@core/hydra/bapi/mpl/bapi.service';
import { BaseExtendForm } from '../base.form.extend';
import { MaterialBatch } from '@core/hydra/entity/batch';

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
  //#endregion

  //#region Public member

  //#endregion

  //#region Constructor

  constructor(
    injector: Injector,
    private _batchService: BatchService,
    private _bapiService: MPLBapiService,
    private _printService: PrintService,
  ) {
    super(injector);
    this.addControls({
      batch1: [null, [Validators.required], 'batch1Data'],
      batch2: [null, [Validators.required], 'batch2Data'],
      quantity1: [null, [Validators.required], 'quantity1Data'],
      quantity2: [null, [Validators.required], 'quantity2Data'],
    });
  }

  //#endregion

  //#region Public methods

  //#region Data Request

  //#region Batch 1 Reqeust
  requestBatch1DataSuccess = (batch) => {
    this.form.controls.batch1.setValue(batch.name);

    if (this.storedData && this.storedData.materialCombine && this.storedData.materialCombine[`${batch.material}.1`]) {
      this.form.controls.quantity1.setValue(this.storedData.materialCombine[`${batch.material}.1`]);
    }
  }

  requestBatch1DataFailed = () => {
  }

  requestBatch1Data = () => {
    let barCodeInfo: MaterialBatch;
    return this._batchService.getBatchInfoFrom2DBarCode(this.form.value.batch1).pipe(
      switchMap((barCodeData: MaterialBatch) => {
        barCodeInfo = barCodeData;
        return this._batchService.getBatchInformation(barCodeData.name).pipe(
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
      }));
  }

  //#endregion

  //#region Batch 2 Reqeust
  requestBatch2DataSuccess = (batch) => {
    this.form.controls.batch2.setValue(batch.name);

    if (this.storedData && this.storedData.materialCombine && this.storedData.materialCombine[`${batch.material}.2`]) {
      this.form.controls.quantity2.setValue(this.storedData.materialCombine[`${batch.material}.2`]);
    }
  }

  requestBatch2DataFailed = () => {
  }

  requestBatch2Data = () => {
    let barCodeInfo: MaterialBatch;
    return this._batchService.getBatchInfoFrom2DBarCode(this.form.value.batch2).pipe(
      switchMap((barCodeData: MaterialBatch) => {
        barCodeInfo = barCodeData;
        return this._batchService.getBatchInformation(barCodeData.name).pipe(
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
      }));
  }

  //#endregion

  //#region Quantity 1 Reqeust
  requestQuantity1DataSuccess = () => {
    this.storedData = deepExtend(this.storedData, {
      materialCombine: {
        [`${this.form.value.batch1Data.material}.1`]: this.form.value.quantity1Data
      }
    });
  }

  requestQuantity1DataFailed = () => {
  }

  requestQuantity1Data = () => {
    if (!/^[0-9]*$/.test(this.form.value.quantity1)) {
      return throwError('Incorrect Qty');
    }

    if (!this.form.value.batch1Data) {
      return throwError('Input Batch First');
    }

    const quantity = toNumber(this.form.value.quantity1, 0);

    if (quantity < 1) {
      return throwError('Incorrect Quantity');
    }

    if (quantity > this.form.value.batch1Data.quantity) {
      return throwError(`Incorrect Quantity!`);
    }

    return of(quantity);
  }

  //#endregion

  //#region Quantity 2 Reqeust
  requestQuantity2DataSuccess = () => {
    this.storedData = deepExtend(this.storedData, {
      materialCombine: {
        [`${this.form.value.batch2Data.material}.2`]: this.form.value.quantity2Data
      }
    });
  }

  requestQuantity2DataFailed = () => {
  }

  requestQuantity2Data = () => {
    if (!/^[0-9]*$/.test(this.form.value.quantity2)) {
      return throwError('Incorrect Qty');
    }

    if (!this.form.value.batch2Data) {
      return throwError('Input Batch First');
    }

    const quantity = toNumber(this.form.value.quantity2, 0);

    if (quantity < 1) {
      return throwError('Incorrect Quantity');
    }

    if (quantity > this.form.value.batch2Data.quantity) {
      return throwError(`Incorrect Quantity!`);
    }

    return of(quantity);
  }

  //#endregion

  //#endregion

  //#endregion

  //#region Protected methods

  protected beforeRequestCheck(srcElement): Observable<boolean> {
    if (!srcElement) return of(true);

    switch (srcElement.id) {
      case 'quantity1':
        if (!this.form.value.batch1Data) {
          return throwError(`Input Batch 1 First`);
        }
        break;
      case 'quantity2':
        if (!this.form.value.batch2Data) {
          return throwError(`Input Batch 2 First`);
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
    return forkJoin(
      this._bapiService.splitBatch(this.form.value.batch1Data, 1, this.form.value.quantity1, this.operatorData),
      this._bapiService.splitBatch(this.form.value.batch2Data, 1, this.form.value.quantity2, this.operatorData)
    ).pipe(
      switchMap(ret => {
        return this._printService.printoutBatchLabel(ret[0].context.concat(ret[1].context)).pipe(
          map((_) => {
            return {
              isSuccess: true,
              description: `Batch ${this.form.value.batch1Data.name},  ${this.form.value.batch2Data.name} Split And Label Printed!`,
            };
          }));
      }));
  }

  //#endregion

  //#region Override methods

  protected afterReset() {
    this.document.getElementById(`batch1`).focus();

    this.form.controls.numberOfSplits.setValue(2);
  }

  //#endregion

  //#region Override properties

  get upperLevel(): string {
    return `/operation/list`;
  }

  //#endregion

  //#region Private methods

  //#endregion
}
