import { Component, Injector, ViewChild } from '@angular/core';
import { BatchService } from '@core/hydra/service/batch.service';
import { Validators } from '@angular/forms';
import { MaterialBatch } from '@core/hydra/entity/batch';
import { IActionResult } from '@core/utils/helpers';
import { BUFFER_SAP } from './constants';
import { requestBatchData } from './request.common';
import { MPLBapiService } from '@core/hydra/bapi/mpl/bapi.service';
import { BaseExtendForm } from '../base.form.extend';
import { forkJoin, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { PopupComponent } from 'ngx-weui';

@Component({
  selector: 'fw-batch-move-sap',
  templateUrl: 'move-batch-sap.component.html',
  styleUrls: ['./move-batch-sap.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class MoveBatchToSAPComponent extends BaseExtendForm {
  //#region View Children
  @ViewChild(`batchList`) batchListPopup: PopupComponent;
  //#endregion

  //#region Protected member
  protected key = `app.mobile.material.moveToSAP`;
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
      materialBuffer: [BUFFER_SAP, [Validators.required]],
    });

    this.form.controls.materialBuffer.setValue(BUFFER_SAP);
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

  //#endregion

  //#endregion

  //#region Protected methods

  //#endregion

  //#region Event Handler
  batchSelected(selected: MaterialBatch) {
    this.batchListPopup.close();

    this.batches$.next(this.batches$.value.filter(batch => batch.name !== selected.name));
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
      batchMove$.push(this._bapiService.moveBatch(batch, { name: this.form.value.materialBuffer }, this.operatorData));
    });

    return forkJoin(batchMove$).pipe(
      map(_ => {
        return {
          isSuccess: true,
          description: `Batch Moved to SAP!`,
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

    this.form.controls.materialBuffer.setValue(BUFFER_SAP);
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
