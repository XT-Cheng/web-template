import { Component, Injector } from '@angular/core';
import { toNumber } from 'ng-zorro-antd';
import { BatchService } from '@core/hydra/service/batch.service';
import { Validators } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { PrintService } from '@core/hydra/service/print.service';
import { requestBatchData } from './request.common';
import { MPLBapiService } from '@core/hydra/bapi/mpl/bapi.service';
import { BaseExtendForm } from '../base.form.extend';

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

  //#region Public member

  requestBatchData = requestBatchData(this.form, this._batchService);

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

    if (!this.batchData) {
      return throwError('Input Batch First');
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
    return this._bapiService.changeBatchQuantity(this.batchData, newQty, this.operatorData).pipe(
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

  protected afterReset() {
    this.document.getElementById(`batch`).focus();
  }

  //#endregion


  //#region Private methods

  //#endregion
}
