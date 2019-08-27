import { Component, Injector } from '@angular/core';
import { toNumber } from 'ng-zorro-antd';
import { BatchService } from '@core/hydra/service/batch.service';
import { Validators } from '@angular/forms';
import { of, throwError, Observable, forkJoin } from 'rxjs';
import { switchMap, tap, map } from 'rxjs/operators';
import { MaterialBatch, BatchBuffer } from '@core/hydra/entity/batch';
import { deepExtend, IActionResult } from '@core/utils/helpers';
import { PrintService } from '@core/hydra/service/print.service';
import { MPLBapiService } from '@core/hydra/bapi/mpl/bapi.service';
import { BaseExtendForm } from '../base.form.extend';
import { BUFFER_SAP, BUFFER_914 } from './constants';
import { BatchWebApi } from '@core/webapi/batch.webapi';
import { MaterialMasterWebApi } from '@core/webapi/materialMaster.webapi';
import { PrinterWebApi } from '@core/webapi/printer.webapi';
import { Printer } from '@core/hydra/entity/printer';

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

  //#region Public member

  //#endregion

  //#region Constructor

  constructor(
    injector: Injector,
    private _batchService: BatchService,
    private _bapiService: MPLBapiService,
    private _printService: PrintService,
    private _batchWebApi: BatchWebApi,
    private _materialMasterWebApi: MaterialMasterWebApi,

  ) {
    super(injector);
    this.addControls({
      batch: [null, [Validators.required], 'batchData'],
      materialBuffer: [null, [Validators.required], 'materialBufferData'],
      numberOfSplits: [1, [Validators.required, Validators.pattern('^[0-9]*$'), Validators.min(1)], 'numberOfSplitsData'],
      isReturnedFromSAP: [false]
    });
  }

  //#endregion

  //#region Public methods
  getSplitInfo() {
    if (!this.batchData) return ` `;

    if (this.form.value.numberOfSplits === '') return ` `;

    return `${this.i18n.fanyi('app.common.childQty')}: ${this.batchData.quantity / this.form.value.numberOfSplits}`;
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
        return this._batchWebApi.isBatchNameExist(barCodeData.name);
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
        if (batchInSAP) {
          return of(batchInSAP);
        } else {
          batch.materialType = materialMaster.materialType;
          batch.unit = materialMaster.unit;
          return of(batch);
        }
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

    if ((this.batchData.quantity % numberOfSplits) > 0) {
      return throwError('Incorrect Child Count');
    }

    if (this.form.value.isReturnedFromSAP && numberOfSplits > 1) {
      return throwError('Incorrect Child Count');
    }

    return of(numberOfSplits);
  }

  //#endregion

  //#endregion

  //#region Protected methods

  protected beforeRequestCheck(srcElement): Observable<boolean> {
    if (!srcElement) return of(true);

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

  protected init() {
    let printer: Printer = null;
    if (this.storedData && this.storedData.printerData) {
      printer = new Printer();

      printer.name = this.storedData.printerData.badge;
      printer.description = this.storedData.printerData.description;
    }

    this.form.patchValue(Object.assign(this.form.value, {
      printer: printer ? printer.name : ``,
      printerData: printer,
    }));
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
      this.form.value.isReturnedFromSAP, this.operatorData).pipe(
        switchMap((_) => {
          return of({
            isSuccess: true,
            error: ``,
            content: ``,
            description: `Batch ${this.batchData.name} Created and Label Printed!`,
          });
        })
      );
  }

  //#endregion

  //#region Override methods

  protected afterReset() {
    this.document.getElementById(`batch`).focus();

    this.form.controls.numberOfSplits.setValue(1);
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
