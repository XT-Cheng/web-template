import { Component, ViewChild, Injector } from '@angular/core';
import { PopupComponent } from 'ngx-weui';
import { Validators } from '@angular/forms';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { Machine } from '@core/hydra/entity/machine';
import { BaseExtendForm } from '../base.form.extend';
import { toNumber } from '@delon/util';
import { switchMap, map, tap } from 'rxjs/operators';
import { MACHINE_STATUS_PRODUCTION } from '@core/hydra/bapi/constants';
import { ReasonCode } from '@core/hydra/entity/reasonCode';
import { Operation } from '@core/hydra/entity/operation';
import { MachineWebApi } from '@core/webapi/machine.webapi';
import { OperationWebApi } from '@core/webapi/operation.webapi';
import { deepExtend } from '@core/utils/helpers';

@Component({
  selector: 'fw-operation-generate-output-batch',
  templateUrl: 'generateOutputBatch-operation.component.html',
  styleUrls: ['./generateOutputBatch-operation.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class GenerateOutputBatchComponent extends BaseExtendForm {
  //#region View Children

  @ViewChild(`reasonCode`) reasonCodePopup: PopupComponent;

  //#endregion

  //#region Protected member
  protected key = `app.mobile.operation.generateOutputBatch`;
  //#endregion

  //#region Public member

  public reasonCodes$: BehaviorSubject<ReasonCode[]> = new BehaviorSubject<ReasonCode[]>([]);

  //#endregion

  //#region Public member

  //#endregion

  //#region Constructor

  constructor(
    injector: Injector,
    private _machineWebApi: MachineWebApi,
    private _operationWebApi: OperationWebApi
  ) {
    super(injector);
    this.addControls({
      machine: [null, [Validators.required], 'machineData'],
      operation: [null, [Validators.required], 'operationData'],
      reasonCodeData: [null],
      scrap: [null],
      quantity: [null, [Validators.required, Validators.min(0),
      Validators.pattern(/^[0-9]*$/)], 'quantityData'],
    });
  }

  //#endregion

  //#region Public methods

  getReasonCodeStyle(reasonCodeDisplay) {
    return reasonCodeDisplay.selected ? {} : { 'color': 'red' };
  }

  getSelectedReasonCodeDisplay() {
    if (!this.machineData) return null;
    if (!this.operationData) return null;
    if (!this.form.value.quantityData) return null;

    if (this.operationData.pendingYieldQty > this.form.value.quantityData) {

      this.form.controls.scrap.setValue(this.operationData.pendingYieldQty - this.form.value.quantityData);

      if (this.form.value.reasonCodeData) {
        return {
          description: this.form.value.reasonCodeData.description,
          selected: true
        };
      }

      return {
        description: `Please select Reason Code`,
        selected: false
      };
    }

    return null;
  }

  showReasonCodes(focusId = ``) {
    if (this.reasonCodePopup) {
      this.reasonCodePopup.config = Object.assign({}, this.reasonCodePopup.config, {
        cancel: this.i18n.fanyi(`app.common.cancel`),
        confirm: this.i18n.fanyi(`app.common.confirm`),
      });
      this.reasonCodePopup.show().subscribe(() => {
        if (!focusId) return;
        const element = this.document.getElementById(focusId);
        if (element) {
          element.focus();
        }
      });
    }
  }

  //#endregion

  //#region Data Request

  //#region Machine Reqeust

  requestMachineDataSuccess = (machine: Machine) => {
    if (machine.currentOperation) {
      this.form.controls.operation.setValue(machine.currentOperation.name);
      this.request(this.requestOperationData, this.requestOperationDataSuccess, this.requestOperationDataFailed)
        (null, null, `operation`);
    }
  }

  requestMachineDataFailed = () => {
  }

  requestMachineData = () => {
    return this._machineWebApi.getMachine(this.form.value.machine).pipe(
      tap(machine => {
        if (!machine) {
          throw Error('Machine invalid');
        }

        if (machine.currentStatusNr !== MACHINE_STATUS_PRODUCTION) {
          throw Error(`Machine Status is not Production!`);
        }
      }),
      switchMap(machine => {
        return this._machineWebApi.getScrapReasonByMachine(machine.machineName).pipe(
          map(reasonCodes => {
            this.reasonCodes$.next(reasonCodes);
            return machine;
          })
        );
      }));
  }

  //#endregion

  //#region Operation Reqeust
  requestOperationDataSuccess = (operation: Operation) => {

    if (this.storedData && this.storedData.outputBatchQtys && this.storedData.outputBatchQtys[operation.article]) {
      this.form.controls.quantity.setValue(this.storedData.outputBatchQtys[operation.article]);
    }

    setTimeout(() => this.document.getElementById(`quantity`).focus(), 0);
  }

  requestOperationDataFailed = () => {
  }

  requestOperationData = (): Observable<any> => {
    return this._operationWebApi.getOperation(this.form.value.operation).pipe(
      tap((operation: Operation) => {
        if (operation.pendingProblemQty > 0) {
          throw Error('There are pending Problem Qty, call IT please!');
        }
      }),
      map((operation: Operation) => {
        if (operation.pendingYieldQty > 0) {
          this.form.controls.quantity.setValue(operation.pendingYieldQty);
        }
        else {
          this.form.controls.quantity.setValue(operation.outputBatchSize);
        }
        return operation;
      }));
  }

  //#endregion

  //#region Number of Quantity Reqeust
  requestQuantityDataSuccess = () => {
    this.storedData = deepExtend(this.storedData, {
      outputBatchQtys: {
        [this.operationData.article]: this.form.value.quantity
      }
    });
  }

  requestQuantityDataFailed = () => {
  }

  requestQuantityData = () => {
    this.form.controls.reasonCodeData.setValue(null);

    if (!/^[0-9]*$/.test(this.form.value.quantity)) {
      return throwError('Invalid Quantity');
    }

    const quantity = toNumber(this.form.value.quantity);

    return of(quantity);
  }

  //#endregion

  //#endregion

  //#region Protected methods
  protected beforeRequestCheck(srcElement): Observable<boolean> {
    if (!srcElement) return of(true);

    if (!this.printer)
      return throwError(`Setup Printer first`);

    return of(true);
  }

  //#endregion

  //#region Event Handler
  reasonCodeSelected(reasonCode: ReasonCode) {
    this.reasonCodePopup.close();
    this.form.controls.reasonCodeData.setValue(reasonCode);
  }
  //#endregion

  //#region Exeuction
  generateOutputBatchSuccess = () => {
  }

  generateOutputBatchFailed = () => {
  }

  generateOutputBatch = () => {
    const quantity = toNumber(this.form.value.quantityData, 0);

    return this._operationWebApi.changeOutputBatch(this.operationData, this.machineData,
      this.operatorData, quantity, (this.form.value.reasonCodeData ? this.form.value.reasonCodeData.codeNbr : 0)).pipe(
        map(outputBatch => {
          return {
            isSuccess: true,
            description: `Batch ${outputBatch} Generated and Printed`,
          }
        })
      );
  }

  //#endregion

  //#region Override methods

  protected afterReset() {
    this.document.getElementById(`machine`).focus();
  }

  protected isValid() {
    if (!this.operationData) return false;
    if (!this.form.value.quantityData) return false;

    if (this.operationData.pendingYieldQty > this.form.value.quantityData
      && !this.form.value.reasonCodeData) {
      return false;
    }

    return true;
  }

  //#endregion

  //#region Private methods

  //#endregion

  //#region Override properties

  get upperLevel(): string {
    return `/operation/list`;
  }

  //#endregion
}
