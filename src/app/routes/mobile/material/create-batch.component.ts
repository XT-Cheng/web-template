import { Component, Injector } from '@angular/core';
import { toNumber } from 'ng-zorro-antd';
import { BatchService } from '@core/hydra/service/batch.service';
import { Validators } from '@angular/forms';
import { of, throwError, Observable, forkJoin } from 'rxjs';
import { switchMap, tap, map } from 'rxjs/operators';
import { MaterialBatch } from '@core/hydra/entity/batch';
import { deepExtend, IActionResult } from '@core/utils/helpers';
import { PrintService } from '@core/hydra/service/print.service';
import { MPLBapiService } from '@core/hydra/bapi/mpl/bapi.service';
import { BaseExtendForm } from '../base.form.extend';
import { BUFFER_SAP, BUFFER_914 } from './constants';

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

    return this._batchService.getBatchInfoFrom2DBarCode(this.form.value.batch, true).pipe(
      switchMap((barCodeData: MaterialBatch) => {
        batch = barCodeData;
        return this._batchService.isBatchNameExist(barCodeData.name);
      }),
      switchMap((exist: boolean) => {
        if (exist) {
          return throwError(`Batch ${batch.name} exist！`);
        }
        return forkJoin(this._batchService.getMaterialType(batch.material),
          this._batchService.getMaterialUnit(batch.material), this._batchService.getBatchInSAPformation(batch.name));
      }),
      switchMap((array: Array<any>) => {
        let [
          matType,
          unit,
          // tslint:disable-next-line:prefer-const
          batchInSAP] = array;
        this.form.controls.isReturnedFromSAP.setValue(!!batchInSAP);
        if (batchInSAP) {
          return of(batchInSAP);
        } else {
          if (!matType) {
            matType = 'Comp';
          }

          if (!unit) {
            unit = 'PC';
          }

          batch.materialType = matType;
          batch.unit = unit;
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
    return this._batchService.getMaterialBuffer(this.form.value.materialBuffer).pipe(
      tap(buffer => {
        if (!buffer) {
          throw Error(`${this.form.value.materialBuffer} not exist!`);
        }

        if (buffer.name.startsWith(BUFFER_SAP)) {
          throw Error(`SAP Buffer not allowed`);
        }

        if (!buffer.parentBuffers.some((bufferName) => bufferName === BUFFER_914)) {
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

  //#endregion

  //#region Event Handler

  //#endregion

  //#region Exeuction
  createBatchSuccess = () => {
  }

  createBatchFailed = () => {
  }

  createBatch = () => {
    let firstAction$: Observable<IActionResult>;
    if (this.form.value.isReturnedFromSAP) {
      firstAction$ = this._bapiService
        .moveBatch(this.batchData, this.form.value.materialBufferData, this.operatorData).pipe(
          switchMap(_ => {
            return this._bapiService.changeBatchQuantity(this.batchData,
              this.batchData.quantity, this.operatorData);
          }),
          map((_) => {
            return {
              isSuccess: true,
              description: `Batch ${this.batchData.name} Moved to ${this.form.value.materialBuffer}!`,
            };
          })
        );
    } else {
      firstAction$ = this._bapiService
        .createBatch(
          this.batchData.name,
          this.batchData.material,
          this.batchData.materialType,
          this.batchData.unit,
          this.batchData.quantity,
          this.form.value.materialBufferData,
          this.operatorData,
          this.batchData.SAPBatch,
          this.batchData.dateCode
        );
    }
    return firstAction$.pipe(
      switchMap(ret => {
        const children = toNumber(this.form.value.numberOfSplitsData, 1);
        if (children > 1) {
          return this._bapiService.splitBatch(this.batchData,
            children, this.batchData.quantity / children,
            this.operatorData);
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
                description: `Batch ${this.batchData.name} Split to ${ret.context.join(`,`)} and Label Printed!`,
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
