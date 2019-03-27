import { Component, Injector, ViewChild } from '@angular/core';
import { BatchService } from '@core/hydra/service/batch.service';
import { Validators } from '@angular/forms';
import { tap, map, switchMap, filter, delay } from 'rxjs/operators';
import { MaterialBatch, MaterialBuffer } from '@core/hydra/entity/batch';
import { BUFFER_914 } from './constants';
import { requestBatchData } from './request.common';
import { MPLBapiService } from '@core/hydra/bapi/mpl/bapi.service';
import { BaseExtendForm } from '../base.form.extend';
import { forkJoin, BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { PopupComponent } from 'ngx-weui';

@Component({
  selector: 'fw-batch-move-914',
  templateUrl: 'move-batch-914.component.html',
  styleUrls: ['./move-batch-914.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class MoveBatchTo914Component extends BaseExtendForm {
  //#region View Children
  @ViewChild(`batchList`) batchListPopup: PopupComponent;
  //#endregion

  //#region Protected member
  protected key = `app.mobile.material.moveTo914`;
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
        if (!buffer.parentBuffers.some((bufferName) => bufferName === BUFFER_914)) {
          throw Error(`Must be 914 Buffer`);
        }
      })
    );
  }

  //#endregion

  //#endregion

  //#region Protected methods

  protected beforeRequestCheck(srcElement): Observable<boolean> {
    if (!srcElement) return of(true);

    if (srcElement.id === 'materialBuffer' && this.batches$.value.length === 0) {
      return throwError(`Input Batch First`);
    }
    return of(true);
  }

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
    this.batches$.next([]);
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

  protected beforeStartCheck(): Observable<boolean> {
    const buffer = this.form.value.materialBufferData as MaterialBuffer;
    const materials = this.batches$.value.map(batch => batch.material).filter((value, index, self) => self.indexOf(value) === index);
    let check$ = of(true);
    materials.forEach(mat => {
      check$ = check$.pipe(
        filter(passed => {
          return passed;
        }),
        switchMap(_ => {
          if (buffer.allowedMaterials.length > 0 && !buffer.allowedMaterials.includes(mat)) {
            return this.showDialog(`Buffer ${buffer.name} not allow material ${mat}<br/>are you sure?`).pipe(delay(100));
          } else {
            return of(true);
          }
        })
      );
    });
    return check$;
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
