import { Component, Injector, ViewChild } from '@angular/core';
import { BatchService } from '@core/hydra/service/batch.service';
import { Validators } from '@angular/forms';
import { MaterialBatch } from '@core/hydra/entity/batch';
import { requestBatchData } from './request.common';
import { of, Observable, BehaviorSubject, throwError } from 'rxjs';
import { Machine } from '@core/hydra/entity/machine';
import { MachineService } from '@core/hydra/service/machine.service';
import { Operation, ComponentStatus } from '@core/hydra/entity/operation';
import { OperationService } from '@core/hydra/service/operation.service';
import { map, switchMap, tap } from 'rxjs/operators';
import { BaseExtendForm } from '../base.form.extend';
import { getComponentStatus } from '@core/hydra/utils/operationHelper';
import { MPLBapiService } from '@core/hydra/bapi/mpl/bapi.service';
import { PopupComponent } from 'ngx-weui';
import { PrintService } from '@core/hydra/service/print.service';

@Component({
  selector: 'fw-batch-reprint',
  templateUrl: 'reprint-batch.component.html',
  styleUrls: ['./reprint-batch.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class ReprintBatchComponent extends BaseExtendForm {
  //#region View Children

  @ViewChild(`batchList`) batchListPopup: PopupComponent;

  //#endregion

  //#region Protected member

  protected key = `app.mobile.material.reprint`;

  //#endregion

  //#region Public member

  materialBatches$: BehaviorSubject<MaterialBatch[]> = new BehaviorSubject<[]>([]);

  //#endregion

  //#region Constructor

  constructor(
    injector: Injector,
    private _batchService: BatchService,
    private _printService: PrintService,
  ) {
    super(injector);
    this.addControls({
      batch: [null, [Validators.required], 'batchData'],
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

  getCurrentBatchDisplay() {
    if (this.batchData) {
      return {
        title: this.batchData.name,
        description: `${this.batchData.material} ${this.batchData.quantity}`
      };
    }

    return null;
  }

  //#endregion

  //#region Data Request

  //#region Batch Reqeust
  requestBatchDataSuccess = () => {
  }

  requestBatchDataFailed = () => {
  }

  requestBatchData = () => {
    return requestBatchData(this.form, this._batchService)().pipe(
      tap((batch: MaterialBatch) => {
        if (!batch)
          throw Error(`Batch ${this.form.value.batch} not exist!`);
      }
      ));
  }

  //#endregion

  //#endregion

  //#region Protected methods

  //#endregion

  //#region Event Handler

  batchSelected(batch: MaterialBatch) {
    this.batchListPopup.close();
    this.form.controls.batch.setValue(batch.name);
    this.form.controls.batchData.setValue(batch);

    this.document.getElementById(`batch`).focus();
  }

  //#endregion

  //#region Exeuction
  reprintBatchSuccess = () => {
  }

  reprintBatchFailed = () => {
  }

  reprintBatch = () => {
    // Reprint Batch
    return this._printService.printMaterialBatchLabel([this.batchData.name]);
  }

  //#endregion

  //#region Override methods
  protected init() {
    this._batchService.getRecentlyCreatedMaterialBatch().subscribe(batches => {
      this.materialBatches$.next(batches);
      if (batches.length > 0) {
        this.form.controls.batch.setValue(batches[0].name);
        this.form.controls.batchData.setValue(batches[0]);
      }
    });
  }

  protected afterReset() {
    this.document.getElementById(`batch`).focus();

    this._batchService.getRecentlyCreatedMaterialBatch().subscribe(batches => {
      this.materialBatches$.next(batches);
    });
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
