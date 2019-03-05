import { Component, Injector } from '@angular/core';
import { toNumber } from 'ng-zorro-antd';
import { BatchService } from '@core/hydra/service/batch.service';
import { Validators } from '@angular/forms';
import { of, throwError, Observable, forkJoin } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { deepExtend, IActionResult } from '@core/utils/helpers';
import { PrintService } from '@core/hydra/service/print.service';
import { requestBatchData } from './request.common';
import { MPLBapiService } from '@core/hydra/bapi/mpl/bapi.service';
import { BaseExtendForm } from '../base.form.extend';

@Component({
  selector: 'fw-batch-split',
  templateUrl: 'split-batch.component.html',
  styleUrls: ['./split-batch.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class SplitBatchComponent extends BaseExtendForm {
  //#region View Children

  //#endregion

  //#region Protected member
  protected key = `app.mobile.material.split`;
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
      numberOfSplits: [2, [Validators.required, Validators.pattern('^[0-9]*$'), Validators.min(2)], 'numberOfSplitsData'],
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

    if (this.storedData && this.storedData.materialSplits && this.storedData.materialSplits[batch.material]) {
      this.form.controls.numberOfSplits.setValue(this.storedData.materialSplits[batch.material]);
    }
  }

  requestBatchDataFailed = () => {
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

    return of(numberOfSplits);
  }

  //#endregion

  //#endregion

  //#endregion

  //#region Protected methods

  //#endregion

  //#region Event Handler

  //#endregion

  //#region Exeuction
  splitBatchSuccess = () => {
  }

  splitBatchFailed = () => {
  }

  splitBatch = () => {
    // Split Batch
    const children = toNumber(this.form.value.numberOfSplitsData, 1);
    return this._bapiService.splitBatch(this.batchData, children,
      this.batchData.quantity / children, this.operatorData).pipe(
        switchMap(ret => {
          const print$: Observable<IActionResult>[] = [];
          ret.context.forEach((childBatch) => {
            print$.push(this._printService.printMaterialBatchLabel(childBatch));
          });
          return forkJoin(print$).pipe(
            map((_) => {
              return {
                isSuccess: true,
                error: ``,
                content: ``,
                description: `Batch ${this.batchData.name} Split to ${ret.context.join(`,`)} And Label Printed!`,
                context: ret.context
              };
            })
          );
        })
      );
  }

  //#endregion

  //#region Override methods

  protected afterReset() {
    this.document.getElementById(`batch`).focus();

    this.form.controls.numberOfSplits.setValue(2);
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
