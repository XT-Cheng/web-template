import { Component, Injector } from '@angular/core';
import { toNumber } from 'ng-zorro-antd';
import { BatchService } from '@core/hydra/service/batch.service';
import { Validators } from '@angular/forms';
import { of, throwError, Observable } from 'rxjs';
import { switchMap, map, tap } from 'rxjs/operators';
import { PrintService } from '@core/hydra/service/print.service';
import { MPLBapiService } from '@core/hydra/bapi/mpl/bapi.service';
import { BaseExtendForm } from '../base.form.extend';
import { MaterialBatch } from '@core/hydra/entity/batch';
import { IActionResult } from '@core/utils/helpers';
import { BatchWebApi } from '@core/webapi/batch.webapi';
import { PrintLabelWebApi } from '@core/webapi/printLabel.webapi';
import { MaterialMasterWebApi } from '@core/webapi/materialMaster.webapi';
import { MaterialMaster } from '@core/hydra/entity/materialMaster';

@Component({
  selector: 'fw-batch-adjust-qty',
  templateUrl: 'adjust-batch-quantity.component.html',
  styleUrls: ['./adjust-batch-quantity.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class AdjustBatchQuantityComponent extends BaseExtendForm {
  //#region View Children

  //#endregion

  //#region Protected member
  protected key = `app.mobile.material.adjustQty`;
  //#endregion

  //#region Private member

  private materialMaster: MaterialMaster;

  //#endregion

  //#region Public member

  //#endregion

  //#region Constructor

  constructor(
    injector: Injector,
    private _batchWebApi: BatchWebApi,
    private _printLabelWebApi: PrintLabelWebApi,
    private _materialMasterWebApi: MaterialMasterWebApi,
  ) {
    super(injector);
    this.addControls({
      batch: [null, [Validators.required], 'batchData'],
      newQty: [null, [Validators.required, Validators.pattern('^[0-9]*$'), Validators.min(1)], 'newQtyData'],
    });
  }

  //#endregion

  //#region Public methods

  //#endregion

  //#region Data Request

  //#region Batch Reqeust
  requestBatchDataSuccess = (barCodeInfor) => {
    this.form.controls.batch.setValue(barCodeInfor.name);
  }

  requestBatchDataFailed = () => {
  }

  requestBatchData = () => {
    let barCodeInfo: MaterialBatch;
    return this._batchWebApi.getBatchInfoFrom2DBarCode(this.form.value.batch).pipe(
      switchMap((barCodeData: MaterialBatch) => {
        barCodeInfo = barCodeData;
        return this._batchWebApi.getBatch(barCodeData.name).pipe(
          tap((batch: MaterialBatch) => {
            if (!batch) {
              throw Error(`${barCodeInfo.name} not exist!`);
            }
          }),
          map((batch: MaterialBatch) => {
            if (batch) {
              batch.barCode = barCodeData.barCode;
            }
            return batch;
          }),
          switchMap((batch: MaterialBatch) => {
            return this._materialMasterWebApi.getPartMaster(batch.material).pipe(
              map(materialMaster => {
                this.materialMaster = materialMaster;
                return batch;
              })
            );
          }),
        );
      }));
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

    const newQty = toNumber(this.form.value.newQty, 0);

    if (newQty < 1) {
      return throwError('Incorrect New Qty');
    }

    if (newQty === this.batchData.quantity) {
      return throwError(`Quantity must be changed!`);
    }

    return of(newQty);
  }

  //#endregion

  //#endregion

  //#region Protected methods

  protected beforeRequestCheck(srcElement): Observable<boolean> {
    if (!srcElement) return of(true);

    if (!this.printer)
      return throwError(`Setup Printer first`);

    if (srcElement.id === 'newQty' && !this.batchData) {
      return throwError(`Input Batch First`);
    }
    return of(true);
  }

  //#endregion

  //#region Event Handler

  //#endregion

  //#region Exeuction
  adjustBatchQtySuccess = () => {
  }

  adjustBatchQtyFailed = () => {
  }

  adjustBatchQty = () => {
    // Adjust Batch Qty
    const newQty = toNumber(this.form.value.newQty, 0);
    return this._batchWebApi.changeBatchQuantity(this.batchData, newQty, this.operatorData).pipe(
      switchMap((ltToPrint: string) => {
        if (!!ltToPrint)
          return this._printLabelWebApi.printLabel([ltToPrint], this.materialMaster.tagTypeName, this.batchData.SAPBatch, this.batchData.dateCode);
        else
          return of(null);
      }),
      switchMap(_ => {
        return of({
          isSuccess: true,
          description: `Batch ${this.form.value.batchData.name} Quantity Changed And Label Printed!`,
        });
      })
    );
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
