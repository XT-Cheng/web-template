import { Component, Injector, ViewChild, ElementRef } from '@angular/core';
import { Validators } from '@angular/forms';
import { MaterialBatch } from '@core/hydra/entity/batch';
import { requestBatchData } from './request.common';
import { BehaviorSubject, of } from 'rxjs';
import { tap, distinctUntilChanged, takeUntil, switchMap } from 'rxjs/operators';
import { BaseExtendForm } from '../base.form.extend';
import { PopupComponent } from 'ngx-weui';
import { BatchWebApi } from '@core/webapi/batch.webapi';
import { PrintLabelWebApi } from '@core/webapi/printLabel.webapi';
import { MaterialMasterWebApi } from '@core/webapi/materialMaster.webapi';

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

  //#region Private member

  //#endregion

  //#region Public member

  materialBatches$: BehaviorSubject<MaterialBatch[]> = new BehaviorSubject<[]>([]);

  //#endregion

  //#region Constructor

  constructor(
    injector: Injector,
    private _printLabelWebApi: PrintLabelWebApi,
    private _batchWebApi: BatchWebApi,
    private _materialMasterWebApi: MaterialMasterWebApi,
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
        this.storedData = this.form.value;
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

    return {
      title: this.i18n.fanyi(`app.common.component.selectBatch`),
      description: ``
    };
  }

  //#endregion

  //#region Data Request

  //#region Batch Reqeust
  requestBatchDataSuccess = () => {
  }

  requestBatchDataFailed = () => {
  }

  requestBatchData = () => {
    return requestBatchData(this.form, this._batchWebApi)().pipe(
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
    this.storedData = this.form.value;
    this.init();
  }

  reprintBatchFailed = () => {
  }

  reprintBatch = () => {
    // Reprint Batch
    return this._materialMasterWebApi.getPartMaster(this.batchData.material).pipe(
      switchMap(materialMaster => {
        return this._printLabelWebApi.printLabel([this.batchData.name], materialMaster.tagTypeName, this.batchData.SAPBatch, this.batchData.dateCode);
      }),
      switchMap(_ => {
        return of({
          isSuccess: true,
          description: `Batch ${this.batchData.name} Re-Printed!`,
        });
      })
    )
  }

  //#endregion

  //#region Override methods
  protected init() {
    if (this.storedData && this.storedData.onlyComp)
      this.form.controls.onlyComp.setValue(this.storedData.onlyComp);
    else
      this.form.controls.onlyComp.setValue(false);
    this._batchWebApi.getRecentlyUpdatedBatch(this.form.value.onlyComp).subscribe(batches => {
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
