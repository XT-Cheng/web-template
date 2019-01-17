import { BaseForm } from '../base.form';
import { Component, Inject } from '@angular/core';
import { ToastService, ToptipsService } from 'ngx-weui';
import { Router } from '@angular/router';
import { toNumber } from 'ng-zorro-antd';
import { TitleService, SettingsService, ALAIN_I18N_TOKEN } from '@delon/theme';
import { BatchService } from '@core/hydra/service/batch.service';
import { OperatorService } from '@core/hydra/service/operator.service';
import { BapiService } from '@core/hydra/service/bapi.service';
import { FormBuilder, Validators } from '@angular/forms';
import { of, throwError, Observable, forkJoin } from 'rxjs';
import { switchMap, tap, map } from 'rxjs/operators';
import { MaterialBatch } from '@core/hydra/entity/batch';
import { DOCUMENT } from '@angular/common';
import { I18NService } from '@core/i18n/i18n.service';
import { deepExtend, IActionResult } from '@core/utils/helpers';
import { PrintService } from '@core/hydra/service/print.service';
import { requestBadgeData } from '../request.common';

@Component({
  selector: 'fw-batch-create',
  templateUrl: 'create-batch.component.html',
  styleUrls: ['./create-batch.component.scss']
})
export class CreateBatchComponent extends BaseForm {
  //#region View Children

  //#endregion

  //#region Protected member
  protected key = `app.mobile.material.create`;
  //#endregion

  //#region Public member

  requestBadgeData = requestBadgeData(this.form, this._operatorService);

  //#endregion

  //#region Constructor

  constructor(
    fb: FormBuilder,
    _toastService: ToastService,
    _routeService: Router,
    _tipService: ToptipsService,
    _titleService: TitleService,
    _settingService: SettingsService,
    private _batchService: BatchService,
    private _operatorService: OperatorService,
    private _bapiService: BapiService,
    private _printService: PrintService,
    @Inject(DOCUMENT) private _document: Document,
    @Inject(ALAIN_I18N_TOKEN) _i18n: I18NService,
  ) {
    super(fb, _settingService, _toastService, _routeService, _tipService, _titleService, _i18n);
    this.addControls({
      barCode: [null, [Validators.required]],
      batch: [null, [Validators.required]],
      materialBuffer: [null, [Validators.required]],
      numberOfSplits: [1, [Validators.required, Validators.pattern('^[0-9]*$'), Validators.min(1)]],
      badge: [null, [Validators.required]],
      batchData: [null],
      isReturnedFromSAP: [null]
    });

    this.form.setValue(Object.assign(this.form.value, {
      badge: this.storedData ? this.storedData.badge : ``,
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

    if (this.storedData && this.storedData.materialSplits && this.storedData.materialSplits[barCodeInfor.material]) {
      this.form.controls.numberOfSplits.setValue(this.storedData.materialSplits[barCodeInfor.material]);
    }
  }

  requestBatchDataFailed = () => {
  }

  requestBatchData = () => {
    if (!this.form.value.batch) {
      return of(null);
    }

    let barCodeInfor: MaterialBatch;

    return this._batchService.getBatchInfoFrom2DBarCode(this.form.value.batch).pipe(
      switchMap((barCodeData: MaterialBatch) => {
        barCodeInfor = barCodeData;
        return this._batchService.isBatchNameExist(barCodeData.name);
      }),
      switchMap((exist: boolean) => {
        if (exist) {
          return throwError(`Batch ${barCodeInfor.name} exist！`);
        }
        return forkJoin(this._batchService.getMaterialType(barCodeInfor.material),
          this._batchService.getMaterialUnit(barCodeInfor.material), this._batchService.isBatchInSAP(barCodeInfor.name));
      }),
      switchMap((array: Array<any>) => {
        let [
          matType,
          unit,
          // tslint:disable-next-line:prefer-const
          isInSAP] = array;

        if (!matType) {
          matType = 'Comp';
        }

        if (!unit) {
          unit = 'PC';
        }

        this.form.controls.isReturnedFromSAP.setValue(isInSAP);

        barCodeInfor.materialType = matType;
        barCodeInfor.unit = unit;
        return of(barCodeInfor);
      }));
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
    this.storedData = deepExtend(this.storedData, {
      materialSplits: {
        [this.form.controls.batchData.value.material]: this.form.value.numberOfSplits
      }
    });
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

  //#endregion

  //#endregion

  //#region Protected methods

  //#endregion

  //#region Event Handler

  //#endregion

  //#region Exeuction
  createBatchSuccess = (ret: IActionResult) => {
    this.showSuccess(ret.description);
  }

  createBatchFailed = () => {
  }

  createBatch = () => {
    let firstAction$: Observable<IActionResult>;
    if (this.form.value.isReturnedFromSAP) {
      firstAction$ = this._bapiService
        .moveBatch(this.form.value.batchData, this.form.value.materialBuffer, this.form.value.badge).pipe(
          switchMap(_ => {
            return this._bapiService.changeBatchQuantity(this.form.value.batchData,
              this.form.value.batchData.quantity, this.form.value.badge);
          }),
          map((_) => {
            return {
              isSuccess: true,
              description: `Batch ${this.form.value.batchData.name} Moved to ${this.form.value.materialBuffer}!`,
            };
          })
        );
    } else {
      firstAction$ = this._bapiService
        .createBatch(
          this.form.value.batchData.name,
          this.form.value.batchData.material,
          this.form.value.batchData.materialType,
          this.form.value.batchData.unit,
          this.form.value.batchData.quantity,
          this.form.value.materialBuffer,
          this.form.value.badge,
          this.form.value.batchData.SAPBatch,
          this.form.value.batchData.dateCode
        );
    }
    return firstAction$.pipe(
      switchMap(ret => {
        const children = toNumber(this.form.value.numberOfSplits, 1);
        if (children > 1) {
          return this._bapiService.splitBatch(this.form.value.batchData,
            toNumber(children, 0), this.form.value.batchData.quantity / children,
            this.form.value.badge);
        }
        return of(ret);
      }),
      switchMap(ret => {
        if (ret.context) {
          const print$: Observable<IActionResult>[] = [];
          ret.context.forEach((childBatch) => {
            print$.push(this._printService.printMaterialBatchLabel(childBatch, `Machine`, 9999));
          });
          return forkJoin(print$).pipe(
            map((_) => {
              return {
                isSuccess: true,
                error: ``,
                content: ``,
                description: `Batch ${this.form.value.batchData.name} Split to ${ret.context.join(`,`)} And Label Printed!`,
                context: ret.context
              };
            })
          );
        }
        return of(ret);
      })
    );
  }

  //#endregion

  //#region Override methods
  protected isValid() {
    return !Array.from(this.descriptions.entries()).some(value => {
      return (value[0] !== `batchData` && value[0] !== 'isReturnedFromSAP' && value[0] !== `barCode` && !value[1]);
    });
  }

  protected afterReset() {
    this._document.getElementById(`batch`).focus();

    this.form.controls.badge.setValue(this.storedData.badge);
    this.form.controls.numberOfSplits.setValue(1);
  }

  //#endregion


  //#region Private methods
  private getSplitInfo() {
    return `Child Qty: ${this.form.value.batchData.quantity / this.form.value.numberOfSplits}`;
  }
  //#endregion
}
