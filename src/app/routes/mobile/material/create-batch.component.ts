import { Component, ViewChild, ElementRef } from '@angular/core';
import { switchMap, catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { BaseForm } from '../base.form';
import { NzMessageService } from 'ng-zorro-antd';
import { TitleService, SettingsService } from '@delon/theme';
import { BapiService } from '@core/hydra/service/bapi.service';
import { FetchService } from '@core/hydra/service/fetch.service';
import { MaterialBuffer, MaterialBatch } from '@core/hydra/entity/batch';
import { Operator } from '@core/hydra/entity/operator';
import { ToastService } from 'ngx-weui';
import { BatchService } from '@core/hydra/service/batch.service';
import { OperatorService } from '@core/hydra/service/operator.service';

class ModelData {
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

  protected title = `Batch Create`;

  //#endregion

  //#region Constructor

  constructor(
    _toastService: ToastService,
    _routeService: Router,
    _message: NzMessageService,
    _titleService: TitleService,
    _settingService: SettingsService,
    private _batchService: BatchService,
    private _operatorService: OperatorService,
    private _bapiService: BapiService,
  ) {
    super(_settingService, _toastService, _routeService, _message, _titleService);

    this.modelData = Object.assign(new ModelData(), {
      badge: this.storedModel.badge
    });
  }

  //#endregion

  //#region Data Request

  //#region Batch Reqeust

  requestBatchDataSuccess = (_) => {
    this.modelData.barCode = this.modelData.batchName = this.batchInfo.name;
    this.materialBufferElem.nativeElement.focus();
  }

  requestBatchDataFailed = () => {
    this.batchElem.nativeElement.select();
    this.resetForm();
  }

  requestBatchData = () => {
    if (!this.modelData.barCode) {
      return of(null);
    }

    if (this.modelData.barCode === this.batchInfo.barCode || this.modelData.barCode === this.batchInfo.name) {
      return of(null);
    }

    return this._batchService.getBatchInfoFrom2DBarCode(this.modelData.barCode).pipe(
      switchMap((batchInfo: MaterialBatch) => {
        this.batchInfo = batchInfo;
        return this._batchService.getBatchInformation(batchInfo.name);
      }),
      switchMap((batchInfo: MaterialBatch) => {
        if (!!batchInfo) {
          return throwError(`Batch ${this.batchInfo.name} exist！`);
        }
        return of(null);
      }
      ),
      catchError(err => {
        if (typeof (err) === `string` && err.includes('not exist')) {
          return of(null);
        }
        return throwError(err);
      }));
  }

  //#endregion

  //#region Buffer Reqeust
  requestMaterialBufferDataSuccess = (_) => {
    this.numberOfSplitsElem.nativeElement.focus();
  }

  requestMaterialBufferDataFailed = () => {
    this.bufferInfo = new MaterialBuffer();
    this.materialBufferElem.nativeElement.select();
  }

  requestMaterialBufferData = () => {
    if (!this.modelData.materialBuffer) {
      return of(null);
    }

    if (this.modelData.materialBuffer === this.bufferInfo.name) {
      return of(null);
    }

    return this._batchService.getMaterialBuffer(this.modelData.materialBuffer).pipe(
      map((buffer: MaterialBuffer) => this.bufferInfo = buffer
      ));
  }

  //#endregion

  //#region Number of Splits Reqeust
  requestNumberOfSplitsDataSuccess = () => {
    this.operatorElem.nativeElement.focus();
  }

  requestNumberOfSplitsDataFailed = () => {
    this.numberOfSplitsElem.nativeElement.focus();
  }

  requestNumberOfSplitsData = () => {
    if (this.modelData.numberOfSplits) {
      if (parseInt(this.modelData.numberOfSplits, 10) > 1) {
        if ((this.batchInfo.quantity % parseInt(this.modelData.numberOfSplits, 10)) > 0) {
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
    if (!this.modelData.badge) {
      return of(null);
    }

    if (this.modelData.badge === this.operatorInfo.badge) {
      return of(null);
    }

    return this._operatorService.getOperatorByBadge(this.modelData.badge).pipe(
      map((operator: Operator) => this.operatorInfo = operator
      ));
  }
  //#endregion

  //#endregion

  //#region Protected methods
  protected getSplitInfo() {
    if (!this.batchInfo) {
      return ``;
    }

    const child = parseInt(this.modelData.numberOfSplits, 10);

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

    this.batchElem.nativeElement.blur();
  }

  materialBufferEntered(event) {
    this.stopEvent(event);

    if (this.form.controls['materialBuffer'].invalid) {
      this.materialBufferElem.nativeElement.select();
      return;
    }

    this.materialBufferElem.nativeElement.blur();
  }

  numberOfSplitsEntered(event) {
    this.stopEvent(event);

    if (this.form.controls['numberOfSplits'].invalid) {
      this.numberOfSplitsElem.nativeElement.select();
      return;
    }

    this.numberOfSplitsElem.nativeElement.blur();
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
          const numberOfSplits = parseInt(this.modelData.numberOfSplits, 10);
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

    this.batchElem.nativeElement.focus();
  }

  isValid() {
    return this.bufferInfo.name && this.batchInfo.name && this.operatorInfo.badge;
  }

  //#endregion
}
