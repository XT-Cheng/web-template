import { Component, ViewChild, ElementRef } from '@angular/core';
import { switchMap, catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { BaseForm } from '../base.form';
import { NzMessageService } from 'ng-zorro-antd';
import { TitleService } from '@delon/theme';
import { BapiService } from '@core/hydra/service/bapi.service';
import { FetchService } from '@core/hydra/service/fetch.service';
import { MaterialBuffer, MaterialBatch } from '@core/hydra/entity/batch';
import { Operator } from '@core/hydra/entity/operator';
import { ToastService } from 'ngx-weui';

interface InputData {
  barCode: string;
  batchName: string;
  material: string;
  materialBuffer: string;
  qty: number;
  badge: string;
  numberOfSplits: string;
  splittedQty: string;
}

class InputData implements InputData {
  barCode = '';
  badge = '';
  batchName = '';
  materialBuffer = '';
  material = '';
  qty = 0;
  numberOfSplits = '1';
  splittedQty = '';
}

@Component({
  selector: 'fw-batch-create',
  templateUrl: 'create-batch.component.html',
  styleUrls: ['./create-batch.component.scss']
})
export class CreateBatchComponent extends BaseForm {
  //#region View Children

  @ViewChild('batch') batchElem: ElementRef;
  @ViewChild('materialBuffer') materialBufferElem: ElementRef;
  @ViewChild('numberOfSplits') numberOfSplitsElem: ElementRef;
  @ViewChild('operator') operatorElem: ElementRef;

  //#endregion

  //#region Protected member

  protected bufferInfo: MaterialBuffer = new MaterialBuffer();
  protected batchInfo: MaterialBatch = new MaterialBatch();
  protected operatorInfo: Operator = new Operator();

  protected inputData: InputData = new InputData();

  protected title = `Batch Create`;

  //#endregion

  //#region Constructor

  constructor(
    _toastService: ToastService,
    _routeService: Router,
    _message: NzMessageService,
    _titleService: TitleService,
    private _fetchService: FetchService,
    private _bapiService: BapiService,
  ) {
    super(_toastService, _routeService, _message, _titleService);
  }

  //#endregion

  //#region Data Request

  //#region Batch Reqeust

  requestBatchDataSuccess = (_) => {
    this.inputData.barCode = this.inputData.batchName = this.batchInfo.name;
  }

  requestBatchDataFailed = () => {
    this.batchElem.nativeElement.select();
    this.resetForm();
  }

  requestBatchData = () => {
    if (!this.inputData.barCode) {
      return of(null);
    }

    if (this.inputData.barCode === this.batchInfo.barCode || this.inputData.barCode === this.batchInfo.name) {
      return of(null);
    }

    return this._fetchService.getBatchInfoFrom2DBarCode(this.inputData.barCode).pipe(
      switchMap((batchInfo: MaterialBatch) => {
        this.batchInfo = batchInfo;
        return this._fetchService.getBatchInformation(batchInfo.name);
      }),
      switchMap((batchInfo: MaterialBatch) => {
        if (!!batchInfo) {
          return throwError(`Batch ${this.batchInfo.name} exist！`);
        }
        return of(null);
      }
      ),
      catchError(err => {
        if (err.includes('not exist')) {
          return of(null);
        }
        return throwError(err);
      }));
  }

  //#endregion

  //#region Buffer Reqeust
  requestMaterialBufferDataSuccess = (_) => {
  }

  requestMaterialBufferDataFailed = () => {
    this.bufferInfo = new MaterialBuffer();
    this.materialBufferElem.nativeElement.select();
  }

  requestMaterialBufferData = () => {
    if (!this.inputData.materialBuffer) {
      return of(null);
    }

    if (this.inputData.materialBuffer === this.bufferInfo.name) {
      return of(null);
    }

    return this._fetchService.getMaterialBuffer(this.inputData.materialBuffer).pipe(
      map((buffer: MaterialBuffer) => this.bufferInfo = buffer
      ));
  }

  //#endregion

  //#region Number of Splits Reqeust
  requestNumberOfSplitsDataSuccess = () => {
  }

  requestNumberOfSplitsDataFailed = () => {
    this.numberOfSplitsElem.nativeElement.focus();
  }

  requestNumberOfSplitsData = () => {
    if (this.inputData.numberOfSplits) {
      if (parseInt(this.inputData.numberOfSplits, 10) > 1) {
        if ((this.batchInfo.quantity % parseInt(this.inputData.numberOfSplits, 10)) > 0) {
          return throwError('Incorrect Child Count');
        }
      }
    }

    return of(null);
  }

  //#endregion

  //#region Operator Reqeust
  requestOperatorDataSuccess = (_) => {
  }

  requestOperatorDataFailed = () => {
    this.operatorInfo = new Operator();
    this.operatorElem.nativeElement.select();
  }

  requestOperatorData = () => {
    if (!this.inputData.badge) {
      return of(null);
    }

    if (this.inputData.badge === this.operatorInfo.badge) {
      return of(null);
    }

    return this._fetchService.getOperatorByBadge(this.inputData.badge).pipe(
      map((operator: Operator) => this.operatorInfo = operator
      ));
  }
  //#endregion

  //#endregion

  //#region Protected methods
  protected getSplitInfo() {
    const child = parseInt(this.inputData.numberOfSplits, 10);

    if (this.batchInfo.quantity > 0 && !isNaN(child)) {
      if ((this.batchInfo.quantity % child) > 0) {
        return `Child Qty:`;
      }

      if (child > 1) {
        return `Child Qty: ${this.batchInfo.quantity / child}`;
      }
    }
  }
  //#endregion

  //#region Event Handler

  batchEntered(event) {
    this.stopEvent(event);

    if (this.form.controls['batch'].invalid) {
      this.batchElem.nativeElement.select();
      return;
    }

    this.materialBufferElem.nativeElement.focus();
  }

  materialBufferEntered(event) {
    this.stopEvent(event);

    if (this.form.controls['materialBuffer'].invalid) {
      this.materialBufferElem.nativeElement.select();
      return;
    }

    this.numberOfSplitsElem.nativeElement.focus();
  }

  numberOfSplitsEntered(event) {
    this.stopEvent(event);

    if (this.form.controls['numberOfSplits'].invalid) {
      this.numberOfSplitsElem.nativeElement.select();
      return;
    }

    this.operatorElem.nativeElement.focus();
  }

  operatorEntered(event) {
    this.stopEvent(event);

    if (this.form.controls['operator'].invalid) {
      this.operatorElem.nativeElement.select();
      return;
    }

    this.operatorElem.nativeElement.blur();
  }

  //#endregion

  //#region Exeuction
  createBatchSuccess = () => {
    // this._tipService['primary'](`Batch ${this.batchInfo.name} Created!`);
  }

  createBatchFailed = () => {
    this.batchElem.nativeElement.focus();
  }

  createBatch = () => {
    this.executionContext = {
      batchName: this.batchInfo.name,
      material: this.batchInfo.material,
      qty: this.batchInfo.quantity,
      bufferName: this.bufferInfo.name,
      SAPBatch: this.batchInfo.SAPBatch,
      dateCode: this.batchInfo.dateCode,
      operator: this.operatorInfo.badge
    };
    return this._bapiService
      .createBatch(
        this.batchInfo.name,
        this.batchInfo.material,
        this.batchInfo.quantity,
        this.bufferInfo.name,
        this.operatorInfo.badge,
        this.batchInfo.SAPBatch,
        this.batchInfo.dateCode
      ).pipe(
        switchMap(ret => {
          const numberOfSplits = parseInt(this.inputData.numberOfSplits, 10);
          if (numberOfSplits > 1) {
            return this._bapiService.splitBatch(this.batchInfo,
              numberOfSplits, this.batchInfo.quantity / numberOfSplits, this.operatorInfo.badge);
          }
          return of(ret);
        })
      );
  }

  //#endregion

  //#region Override methods

  resetForm() {
    this.bufferInfo = new MaterialBuffer();
    this.batchInfo = new MaterialBatch();
    this.operatorInfo = new Operator();

    this.inputData = new InputData();

    this.batchElem.nativeElement.focus();
  }

  isValid() {
    return this.bufferInfo.name && this.batchInfo.name && this.operatorInfo.badge;
  }

  //#endregion
}
