import { Component, Injector } from '@angular/core';
import { toNumber } from 'ng-zorro-antd';
import { BatchService } from '@core/hydra/service/batch.service';
import { Validators } from '@angular/forms';
import { of, throwError, Observable } from 'rxjs';
import { switchMap, map, tap } from 'rxjs/operators';
import { PrintService } from '@core/hydra/service/print.service';
import { MPLBapiService } from '@core/hydra/bapi/mpl/bapi.service';
import { BaseExtendForm } from '../base.form.extend';
import { MaterialBatch } from '@core/hydra/entity/batch';
import { IActionResult } from '@core/utils/helpers';

@Component({
  selector: 'fw-batch-adjust-qty',
  templateUrl: 'adjust-batch-quantity.component.html',
  styleUrls: ['./adjust-batch-quantity.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class AdjustBatchQuantityComponent extends BaseExtendForm {
  //#region View Children

  //#endregion

  //#region Protected member
  protected key = `app.mobile.material.adjustQty`;
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
      newQty: [null, [Validators.required, Validators.pattern('^[0-9]*$'), Validators.min(1)], 'newQtyData'],
      componentToBeChangeData: [null, []],
    });
  }

  //#endregion

  //#region Public methods

  //#endregion

  //#region Data Request

  //#region Batch Reqeust
  requestBatchDataSuccess = (barCodeInfor) => {
    this.form.controls.batch.setValue(barCodeInfor.name);
  }

  requestBatchDataFailed = () => {
  }

  requestBatchData = () => {
    let barCodeInfo: MaterialBatch;
    return this._batchService.getBatchInfoFrom2DBarCode(this.form.value.batch).pipe(
      switchMap((barCodeData: MaterialBatch) => {
        barCodeInfo = barCodeData;
        return this._batchService.getBatchInformationWithRunning(barCodeData.name).pipe(
          tap((batch: MaterialBatch) => {
            if (!batch) {
              throw Error(`${barCodeInfo.name} not exist!`);
            }
          }),
          map((batch: MaterialBatch) => {
            if (batch) {
              batch.barCode = barCodeData.barCode;
            }
            return batch;
          }),
          switchMap((batch: MaterialBatch) => {
            return this._batchService.getBatchLoggedOnContext(batch).pipe(
              map(context => {
                this.form.controls.componentToBeChangeData.setValue(context);

                return batch;
              })
            );
          })
        );
      }));
  }

  //#endregion

  //#region New Qty Reqeust
  requestNewQtyDataSuccess = () => {
  }

  requestNewQtyDataFailed = () => {
  }

  requestNewQtyData = () => {
    if (!/^[0-9]*$/.test(this.form.value.newQty)) {
      return throwError('Incorrect New Qty');
    }

    const newQty = toNumber(this.form.value.newQty, 0);

    if (newQty < 1) {
      return throwError('Incorrect New Qty');
    }

    if (newQty === this.batchData.quantity) {
      return throwError(`Quantity must be changed!`);
    }

    return of(newQty);
  }

  //#endregion

  //#endregion

  //#region Protected methods

  protected beforeRequestCheck(srcElement): Observable<boolean> {
    if (!srcElement) return of(true);

    if (srcElement.id === 'newQty' && !this.batchData) {
      return throwError(`Input Batch First`);
    }
    return of(true);
  }

  //#endregion

  //#region Event Handler

  //#endregion

  //#region Exeuction
  adjustBatchQtySuccess = () => {
  }

  adjustBatchQtyFailed = () => {
  }

  adjustBatchQty = () => {
    // Adjust Batch Qty
    const newQty = toNumber(this.form.value.newQty, 0);
    let adjustBatchQty$ = of(null);

    // 1. Logoff first
    if (this.form.value.componentToBeChangeData) {
      this.form.value.componentToBeChangeData.operations.map((op) => {
        adjustBatchQty$ = adjustBatchQty$.pipe(
          switchMap(() => {
            return this._bapiService.logoffInputBatch({ name: op.name },
              { machineName: this.form.value.componentToBeChangeData.machine }, this.operatorData, { name: this.batchData.name }, op.pos);
          })
        );
      });
    }

    // 2. Change Quantity
    adjustBatchQty$ = adjustBatchQty$.pipe(
      switchMap(() => {
        return this._bapiService.changeBatchQuantity(this.batchData, newQty, this.operatorData).pipe(
          switchMap(() => {
            if (this.form.value.componentToBeChangeData) {
              // If Batch is logged on, will not print out Label
              return of(null);
            } else {
              return this._printService.printoutBatchLabel([this.batchData.name]);
            }
          }));
      }));

    // 3. Logon Again
    if (this.form.value.componentToBeChangeData) {
      this.form.value.componentToBeChangeData.operations.map((op) => {
        adjustBatchQty$ = adjustBatchQty$.pipe(
          switchMap(() => {
            return this._bapiService.logonInputBatch({ name: op.name },
              { machineName: this.form.value.componentToBeChangeData.machine },
              this.operatorData, { name: this.batchData.name, material: this.batchData.material },
              op.pos);
          })
        );
      });
    }

    return adjustBatchQty$.pipe(
      map((ret: IActionResult) => {
        return Object.assign(ret, {
          description: `Batch ${this.form.value.batchData.name} Quantity Changed And Label Printed!`,
        });
      }
      ));
  }

  //#endregion

  //#region Override methods

  protected afterReset() {
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
