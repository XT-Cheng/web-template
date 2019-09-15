import { Component, Injector } from '@angular/core';
import { toNumber } from 'ng-zorro-antd';
import { Validators } from '@angular/forms';
import { of, throwError, Observable, forkJoin } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { MaterialBatch, BatchBuffer } from '@core/hydra/entity/batch';
import { deepExtend } from '@core/utils/helpers';
import { BaseExtendForm } from '../base.form.extend';
import { BUFFER_SAP, BUFFER_914 } from './constants';
import { BatchWebApi } from '@core/webapi/batch.webapi';
import { MaterialMasterWebApi } from '@core/webapi/materialMaster.webapi';
import { MaterialMaster } from '@core/hydra/entity/materialMaster';

@Component({
  selector: 'fw-batch-create',
  templateUrl: 'create-batch.component.html',
  styleUrls: ['./create-batch.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class CreateBatchComponent extends BaseExtendForm {
  //#region View Children

  //#endregion

  //#region Protected member
  protected key = `app.mobile.material.create`;

  //#endregion

  //#region Constructor

  constructor(
    injector: Injector,
    private _batchWebApi: BatchWebApi,
    private _materialMasterWebApi: MaterialMasterWebApi,

  ) {
    super(injector);
    this.addControls({
      batch: [null, [Validators.required], 'batchData'],
      materialBuffer: [null, [Validators.required], 'materialBufferData'],
      numberOfSplits: [1, [Validators.required, Validators.pattern('^[0-9]*$'), Validators.min(1)], 'numberOfSplitsData'],
      remainQty: [0, [Validators.required, Validators.pattern('^[0-9]*$'), Validators.min(0)], 'remainQtyData'],
      isReturnedFromSAP: [false]
    });
  }

  //#endregion

  //#region Public methods
  getSplitInfo() {
    if (!this.batchData) return ` `;

    if (this.form.value.numberOfSplits === '') return ` `;

    return `${this.i18n.fanyi('app.common.childQty')}: ${(this.batchData.quantity - this.form.value.remainQty) / this.form.value.numberOfSplits}`;
  }
  //#endregion

  //#region Data Request

  //#region Batch Reqeust
  requestBatchDataSuccess = (batch) => {
    this.form.controls.batch.setValue(batch.name);

    if (!this.form.value.isReturnedFromSAP
      && this.storedData && this.storedData.materialSplits && this.storedData.materialSplits[batch.material]) {
      this.form.controls.numberOfSplits.setValue(this.storedData.materialSplits[batch.material]);
    }
  }

  requestBatchDataFailed = () => {
  }

  requestBatchData = () => {
    let batch: MaterialBatch;

    return this._batchWebApi.getBatchInfoFrom2DBarCode(this.form.value.batch, true).pipe(
      switchMap((barCodeData: MaterialBatch) => {
        batch = barCodeData;
        return this._batchWebApi.isBatchNameExist(barCodeData.name, true);
      }),
      switchMap((exist: boolean) => {
        if (exist) {
          return throwError(`Batch ${batch.name} exist！`);
        }
        return forkJoin(this._materialMasterWebApi.getPartMaster(batch.material),
          this._batchWebApi.isBatchInSAP(batch.name));
      }),
      switchMap((array: Array<any>) => {
        let [
          materialMaster,
          // tslint:disable-next-line:prefer-const
          batchInSAP] = array;
        this.form.controls.isReturnedFromSAP.setValue(!!batchInSAP);

        batch.materialType = materialMaster.materialType;
        batch.unit = materialMaster.unit;
        return of(batch);
      }));
  }
  //#endregion

  //#region Buffer Reqeust
  requestMaterialBufferDataSuccess = () => {
  }

  requestMaterialBufferDataFailed = () => {
  }

  requestMaterialBufferData = () => {
    return this._batchWebApi.getMaterialBuffer(this.form.value.materialBuffer).pipe(
      tap(buffer => {
        if (!buffer) {
          throw Error(`${this.form.value.materialBuffer} not exist!`);
        }

        if (buffer.name.startsWith(BUFFER_SAP)) {
          throw Error(`SAP Buffer not allowed`);
        }

        if (buffer.parentBuffer !== BUFFER_914) {
          throw Error(`Must be 914 Buffer`);
        }
      })
    );
  }

  //#endregion

  //#region Number of Splits Reqeust
  requestNumberOfSplitsDataSuccess = () => {
    this.storedData = deepExtend(this.storedData, {
      materialSplits: {
        [this.batchData.material]: this.form.value.numberOfSplitsData
      }
    });

    this.form.value.remainQty = (this.batchData.quantity % this.form.value.numberOfSplits);
  }

  requestNumberOfSplitsDataFailed = () => {
  }

  requestNumberOfSplitsData = () => {
    if (!/^[0-9]*$/.test(this.form.value.numberOfSplits)) {
      return throwError('Incorrect Child Count');
    }

    if (!this.batchData) {
      return throwError('Input Batch First');
    }

    const numberOfSplits = toNumber(this.form.value.numberOfSplits, 1);

    if (this.form.value.isReturnedFromSAP && numberOfSplits > 1) {
      return throwError('Incorrect Child Count');
    }

    return of(numberOfSplits);
  }

  //#endregion

  //#region Number of Splits Reqeust
  requestRemainQtyDataSuccess = () => {
  }

  requestRemainQtyDataFailed = () => {
  }

  requestRemainQtyData = () => {
    if (!/^[0-9]*$/.test(this.form.value.remainQty)) {
      return throwError('Incorrect Remain Qty');
    }

    if (!this.batchData) {
      return throwError('Input Batch First');
    }

    if (!this.form.value.numberOfSplits) {
      return throwError('Input Batch First');
    }

    const remainQty = toNumber(this.form.value.remainQty, 1);

    const toBesplitQty = this.batchData.quantity - remainQty;

    if (toBesplitQty === 0) {
      return throwError('Incorrect Remain Qty');
    }

    if ((toBesplitQty % this.form.value.numberOfSplits) > 0) {
      return throwError('Incorrect Remain Qty');
    }

    if (this.form.value.isReturnedFromSAP && remainQty > 0) {
      return throwError('Incorrect Child Count');
    }

    return of(remainQty);
  }

  //#endregion


  //#endregion

  //#region Protected methods

  protected beforeRequestCheck(srcElement): Observable<boolean> {
    if (!srcElement) return of(true);

    if (!this.printer)
      return throwError(`Setup Printer first`);

    switch (srcElement.id) {
      case 'materialBuffer':
        if (!this.batchData) {
          return throwError(`Input Batch First`);
        }
        break;
      default:
        return of(true);
    }
    return of(true);
  }

  protected beforeStartCheck(): Observable<boolean> {
    const buffer = this.form.value.materialBufferData as BatchBuffer;
    if (buffer.allowedMaterials.length > 0 && !buffer.allowedMaterials.includes(this.batchData.material)) {
      return this.showDialog(`Buffer ${buffer.name} not allow material ${this.batchData.material}<br/>are you sure?`);
    } else {
      return of(true);
    }
  }

  //#endregion

  //#region Event Handler

  //#endregion

  //#region Exeuction
  createBatchSuccess = () => {
  }

  createBatchFailed = () => {
  }

  createBatch = () => {
    return this._batchWebApi.createBatch(this.batchData, this.form.value.materialBufferData, this.form.value.numberOfSplitsData,
      this.form.value.remainQtyData, this.form.value.isReturnedFromSAP, this.operatorData).pipe(
        switchMap((ltsToPrint: string[]) => {
          return of({
            isSuccess: true,
            description: `Batch ${this.batchData.name} Split to ${ltsToPrint.join(`,`)} and Label Printed!`,
          });
        })
      );
  }

  //#endregion

  //#region Override methods

  protected afterReset() {
    this.document.getElementById(`batch`).focus();

    this.form.controls.numberOfSplits.setValue(1);
    this.form.controls.remainQty.setValue(0);
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
