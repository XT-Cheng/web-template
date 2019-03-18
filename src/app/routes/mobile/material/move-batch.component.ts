import { Component, Injector, ViewChild } from '@angular/core';
import { BatchService } from '@core/hydra/service/batch.service';
import { Validators } from '@angular/forms';
import { MaterialBatch } from '@core/hydra/entity/batch';
import { requestBatchData } from './request.common';
import { tap, map } from 'rxjs/operators';
import { MPLBapiService } from '@core/hydra/bapi/mpl/bapi.service';
import { BaseExtendForm } from '../base.form.extend';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { PopupComponent } from 'ngx-weui';

@Component({
  selector: 'fw-batch-move',
  templateUrl: 'move-batch.component.html',
  styleUrls: ['./move-batch.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class MoveBatchComponent extends BaseExtendForm {
  //#region View Children
  @ViewChild(`batchList`) batchListPopup: PopupComponent;
  //#endregion

  //#region Protected member
  protected key = `app.mobile.material.move`;
  //#endregion

  //#region Public member
  batches$: BehaviorSubject<MaterialBatch[]> = new BehaviorSubject<[]>([]);

  requestBatchData = requestBatchData(this.form, this._batchService);

  //#endregion

  //#region Constructor

  constructor(
    injector: Injector,
    private _batchService: BatchService,
    private _bapiService: MPLBapiService,
  ) {
    super(injector);
    this.addControls({
      batch: [null, []],
      materialBuffer: [null, [Validators.required], 'materialBufferData'],
    });
  }

  //#endregion

  //#region Public methods
  showBatchList() {
    if (this.batchListPopup) {
      this.batchListPopup.config = Object.assign({}, this.batchListPopup.config, {
        cancel: this.i18n.fanyi(`app.common.cancel`),
        confirm: this.i18n.fanyi(`app.common.confirm`),
      });
      this.batchListPopup.show();
    }
  }

  getBatchsDisplay(batches: MaterialBatch[]) {
    if (batches.length === 0) return null;
    return {
      total: batches.length,
    };
  }

  //#endregion

  //#region Data Request

  //#region Batch Reqeust
  requestBatchDataSuccess = (batch: MaterialBatch) => {
    this.batches$.next([...this.batches$.value, batch]);
    this.form.controls.batch.setValue(``);
    this.document.getElementById(`batch`).focus();
  }

  requestBatchDataFailed = () => {
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
      })
    );
  }

  //#endregion

  //#endregion

  //#endregion

  //#region Protected methods

  //#endregion

  //#region Event Handler
  batchSelected(selected: MaterialBatch) {
    this.batchListPopup.close();

    this.batches$.next(this.batches$.value.filter(batch => batch.name !== selected.name));

    this.document.getElementById(`materialBuffer`).focus();
  }

  //#endregion

  //#region Exeuction
  moveBatchSuccess = () => {
    this.batches$.next([]);
  }

  moveBatchFailed = () => {
  }

  moveBatch = () => {
    // Move Batch
    const batchMove$ = [];
    this.batches$.value.forEach(batch => {
      batchMove$.push(this._bapiService.moveBatch(batch, this.form.value.materialBufferData, this.operatorData));
    });

    return forkJoin(batchMove$).pipe(
      map(_ => {
        return {
          isSuccess: true,
          description: `Batch Moved to ${this.form.value.materialBufferData.name}!`,
        };
      })
    );
  }

  //#endregion

  //#region Override methods
  protected isValid() {
    return this.batches$.value.length > 0;
  }

  protected afterReset() {
    this.batches$.next([]);
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
