import { Component, Injector, ViewChild } from '@angular/core';
import { Validators } from '@angular/forms';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { Machine } from '@core/hydra/entity/machine';
import { MachineService } from '@core/hydra/service/machine.service';
import { Operation } from '@core/hydra/entity/operation';
import { OperationService } from '@core/hydra/service/operation.service';
import { map, tap, switchMap } from 'rxjs/operators';
import { BaseExtendForm } from '../base.form.extend';
import { BDEBapiService } from '@core/hydra/bapi/bde/bapi.service';
import { ReasonCode } from '@core/hydra/entity/reasonCode';
import { toNumber } from '@delon/util';
import { PopupComponent } from 'ngx-weui';

@Component({
  selector: 'fw-operation-partial-confirmation',
  templateUrl: 'partialConfirmation-operation.component.html',
  styleUrls: ['./partialConfirmation-operation.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class PartialConfirmationOperationComponent extends BaseExtendForm {
  //#region View Children

  @ViewChild(`reasonCode`) reasonCodePopup: PopupComponent;

  //#endregion

  //#region Protected member
  protected key = `app.mobile.operation.partialConfirm`;
  //#endregion

  //#region Public member

  operations$: BehaviorSubject<Operation[]> = new BehaviorSubject<[]>([]);
  reasonCodes$: BehaviorSubject<ReasonCode[]> = new BehaviorSubject<ReasonCode[]>([]);

  //#endregion

  //#region Public member

  //#endregion

  //#region Constructor

  constructor(
    injector: Injector,
    private _machineService: MachineService,
    private _operationService: OperationService,
    private _bapiService: BDEBapiService,
  ) {
    super(injector);
    this.addControls({
      machine: [null, [Validators.required], 'machineData'],
      reasonCodeData: [null, [Validators.required]],
      scrapQty: [null, [Validators.required], 'scrapQtyData'],
      operation: [null, [Validators.required], 'operationData'],
    });

    this.form.controls.scrapQty.setValue(0);
    this.form.controls.scrapQtyData.setValue(0);
  }

  //#endregion

  //#region Public methods

  getReasonCodeStyle(reasonCodeDisplay) {
    return reasonCodeDisplay.selected ? {} : { 'color': 'red' };
  }

  getSelectedReasonCodeDisplay() {
    if (!this.machineData) return null;
    if (!this.operationData) return null;
    if (!this.form.value.scrapQtyData) return null;
    if (this.form.value.scrapQtyData === 0) return null;

    if (this.form.value.reasonCodeData) {
      return {
        description: this.form.value.reasonCodeData.description,
        selected: true
      };
    } else {
      return {
        description: `Please select Reason Code`,
        selected: false
      };
    }
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
    this.operations$.next(machine.currentOperations);
    if (machine.currentOperations.length > 0) {
      this.form.controls.operation.setValue(machine.currentOperations[0].name);
      this.request(this.requestOperationData, this.requestOperationDataSuccess, this.requestOperationDataFailed)
        (null, null, `operation`);
    }
  }

  requestMachineDataFailed = () => {
  }

  requestMachineData = () => {
    return this._machineService.getMachine(this.form.value.machine).pipe(
      tap(machine => {
        if (!machine) {
          throw Error('Machine invalid');
        }
      }),
      switchMap(machine => {
        return this._machineService.getScrapReasonByMachine(machine.machineName).pipe(
          map(reasonCodes => {
            this.reasonCodes$.next(reasonCodes);
            return machine;
          })
        );
      }));
  }

  //#endregion

  //#region Scrap Qty Reqeust

  requestScrapQtyDataSuccess = (_) => {
  }

  requestScrapQtyDataFailed = () => {
  }

  requestScrapQtyData = () => {
    if (!/^[0-9]*$/.test(this.form.value.scrapQty)) {
      return throwError('Invalid Quantity');
    }

    return of(toNumber(this.form.value.scrapQty));
  }

  //#endregion

  //#region Operation Reqeust
  requestOperationDataSuccess = (_) => {
    this.form.controls.scrapQty.setValue('0');

    this.form.controls.scrapQtyData.setValue(0);
    this.form.controls.reasonCodeData.setValue(null);
  }

  requestOperationDataFailed = () => {
    this.document.getElementById('machine').focus();
  }

  requestOperationData = (): Observable<any> => {
    return this._operationService.getOperation(this.form.value.operation).pipe(
      map(operation => {
        if (operation.leadOrder && operation.pendingYieldQty !== 0) {
          throw Error(`Please Generate Output Batch first!`);
        }
        return operation;
      }));
  }

  //#endregion

  //#endregion

  //#region Protected methods

  //#endregion

  //#region Event Handler

  reasonCodeSelected(reasonCode: ReasonCode) {
    this.reasonCodePopup.close();
    this.form.controls.reasonCodeData.setValue(reasonCode);
  }

  //#endregion

  //#region Exeuction
  partialConfirmOperationSuccess = () => {
  }

  partialConfirmOperationFailed = () => {
  }

  partialConfirmOperation = () => {
    // Interrupt Operation
    return this._bapiService.partialConfirmOperation(this.operationData,
      this.machineData, this.operatorData, 0, this.form.value.scrapQtyData, this.form.value.reasonCodeData.codeNbr);
  }

  //#endregion

  //#region Override methods
  protected beforeRequestCheck(srcElement): Observable<boolean> {
    if (!srcElement) return of(true);

    if (srcElement.id === 'scrapQty' && !this.machineData) {
      return throwError(`Input Machine First`);
    }
    return of(true);
  }

  protected afterReset() {
    this.document.getElementById(`machine`).focus();
  }

  //#endregion

  //#region Override properties

  get upperLevel(): string {
    return `/operation/list`;
  }

  //#endregion

  //#region Private methods

  //#endregion
}
