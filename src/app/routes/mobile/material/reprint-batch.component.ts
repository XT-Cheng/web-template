import { Component, Injector, ViewChild, ElementRef } from '@angular/core';
import { BatchService } from '@core/hydra/service/batch.service';
import { Validators } from '@angular/forms';
import { MaterialBatch } from '@core/hydra/entity/batch';
import { requestBatchData } from './request.common';
import { BehaviorSubject } from 'rxjs';
import { tap, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { BaseExtendForm } from '../base.form.extend';
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
  @ViewChild(`batch`, { read: ElementRef }) batchElement: ElementRef;
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
      onlyComp: [false, []]
    });

    this.form.controls.onlyComp.valueChanges.pipe(
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      setTimeout(() => {
        this.storedData = Object.assign(this.storedData, this.form.value);
        this.init();
      }, 0);
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
    return requestBatchData(this.form, null)().pipe(
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
    this.init();
  }

  reprintBatchFailed = () => {
  }

  reprintBatch = () => {
    // Reprint Batch
    return this._printService.printoutBatchLabel([this.batchData.name]);
  }

  //#endregion

  //#region Override methods
  protected init() {
    this.form.controls.onlyComp.setValue(this.storedData.onlyComp);

    this._batchService.getRecentlyUpdatedBatch(this.form.value.onlyComp).subscribe(batches => {
      this.materialBatches$.next(batches);
      if (batches.length > 0) {
        this.form.controls.batch.setValue(batches[0].name);
        this.form.controls.batchData.setValue(batches[0]);
        if (this.batchElement) {
          this.batchElement.nativeElement.select();
        }
      }
    });
  }

  protected afterReset() {
    this.document.getElementById(`batch`).focus();

    this.init();
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
