import { Component, Injector, ViewChild } from '@angular/core';
import { Validators } from '@angular/forms';
import { IActionResult } from '@core/utils/helpers';
import { of, Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { BaseExtendForm } from '../base.form.extend';
import { ComponentToBeLoggedOff } from '@core/hydra/utils/operationHelper';
import { toNumber } from 'ng-zorro-antd';
import { MachineWebApi } from '@core/webapi/machine.webapi';
import { BatchWebApi } from '@core/webapi/batch.webapi';
import { ComponentLoggedOn } from '@core/hydra/entity/operation';
import { PopupComponent } from 'ngx-weui';
import { ReasonCode } from '@core/hydra/entity/reasonCode';

@Component({
  selector: 'fw-batch-scrap',
  templateUrl: 'scrap-batch.component.html',
  styleUrls: ['./scrap-batch.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class ScrapBatchComponent extends BaseExtendForm {
  //#region View Children

  @ViewChild(`reasonCode`) reasonCodePopup: PopupComponent;

  //#endregion

  //#region Protected member

  protected key = `app.mobile.material.scrap`;

  //#endregion

  //#region Public member

  componentsToBeScrapped$: BehaviorSubject<ComponentToBeLoggedOff[]> = new BehaviorSubject<[]>([]);
  reasonCodes$: BehaviorSubject<ReasonCode[]> = new BehaviorSubject<ReasonCode[]>([]);

  //#endregion

  //#region Public member

  //#endregion

  //#region Constructor

  constructor(
    injector: Injector,
    private _machineWebApi: MachineWebApi,
    private _batchWebApi: BatchWebApi,
  ) {
    super(injector, false);
    this.addControls({
      machine: [null, [Validators.required], 'machineData'],
      scrapQty: [null, [Validators.required], 'scrapQtyData'],
      componentToBeScrappedData: [null, [Validators.required]],
      reasonCodeData: [null, [Validators.required]],
    });
  }

  //#endregion

  //#region Public methods
  getReasonCodeStyle(reasonCodeDisplay) {
    return reasonCodeDisplay.selected ? {} : { 'color': 'red' };
  }

  getSelectedReasonCodeDisplay() {
    if (!this.machineData) return null;
    if (!this.form.value.componentToBeScrappedData) return null;

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

  hasComponentToBeScrappedData() {
    return (this.form.value.componentToBeScrappedData && this.machineData);
  }

  getMachineComponentLoggedOnDisplay() {
    if (!this.machineData) return null;

    const componentToBeScrappedData = this.form.value.componentToBeScrappedData as ComponentToBeLoggedOff;
    if (componentToBeScrappedData) {
      return {
        material: componentToBeScrappedData.material,
        batchName: componentToBeScrappedData.batchName,
        quantity: componentToBeScrappedData.batchQty,
      };
    }

    return null;
  }
  //#endregion

  //#region Data Request

  //#region Machine Reqeust

  requestMachineDataSuccess = (_) => {
    if (this.componentsToBeScrapped$.value.length > 0) {
      this.form.controls.componentToBeScrappedData.setValue(this.componentsToBeScrapped$.value[0]);
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
      }),
      switchMap(machine => {
        return this._machineWebApi.getScrapReasonByMachine(machine.machineName).pipe(
          map(reasonCodes => {
            this.reasonCodes$.next(reasonCodes);
            return machine;
          })
        );
      }),
      map(machine => {
        this.componentsToBeScrapped$.next(machine.componentsLoggedOn);
        return machine;
      }));
  }

  //#endregion

  //#region Scrap Qty Reqeust
  requestScrapQtyDataSuccess = () => {
  }

  requestScrapQtyDataFailed = () => {
  }

  requestScrapQtyData = () => {
    if (!/^[0-9]*$/.test(this.form.value.scrapQty)) {
      return throwError('Incorrect Scrap Qty');
    }

    const scrapQty = toNumber(this.form.value.scrapQty, 0);

    if (scrapQty < 0) {
      return throwError('Incorrect Scrap Qty');
    }

    if (scrapQty >= this.form.value.componentToBeScrappedData.batchQty) {
      return throwError('Incorrect Scrap Qty');
    }

    return of(scrapQty);
  }

  //#endregion

  //#endregion

  //#region Protected methods
  protected isValid() {
    if (!this.machineData) return false;

    if (!this.machineData.currentOperation) return false;

    return true;
  }

  protected beforeRequestCheck(srcElement): Observable<boolean> {
    if (!srcElement) return of(true);

    switch (srcElement.id) {
      case 'scrapQty':
        if (!this.machineData) {
          return throwError(`Input Machine First`);
        }
        break;
      default:
        return of(true);
    }
    return of(true);
  }

  //#endregion

  //#region Event Handler
  reasonCodeSelected(reasonCode: ReasonCode) {
    this.reasonCodePopup.close();
    this.form.controls.reasonCodeData.setValue(reasonCode);
  }

  componentSelected(componentSelected: ComponentLoggedOn) {
    this.componentStatusPopup.close();
    this.form.controls.componentToBeScrappedData.setValue(componentSelected);
    this.document.getElementById('scrapQty').focus();
  }

  //#endregion

  //#region Exeuction
  scrapBatchSuccess = () => {
    this.form.controls.scrapQty.setValue(null);
    this.form.controls.componentToBeScrappedData.setValue(null);
    this.form.controls.reasonCodeData.setValue(null);

    this.componentsToBeScrapped$.next([]);
    this.reasonCodes$.next([]);

    this.request(this.requestMachineData, this.requestMachineDataSuccess, this.requestMachineDataFailed)
      (null, null, `machine`);
  }

  scrapBatchFailed = () => {
  }

  scrapBatch = (): Observable<IActionResult> => {
    const scrapQty = toNumber(this.form.value.scrapQty, 0);
    const componentToBeScrappedData = this.form.value.componentToBeScrappedData as ComponentLoggedOn;

    return this._batchWebApi.scrapInputBatch(this.machineData,
      { name: componentToBeScrappedData.batchName, material: componentToBeScrappedData.material }, scrapQty,
      this.form.value.reasonCodeData.codeNbr, this.operatorData).pipe(
        map(_ => {
          return {
            isSuccess: true,
            description: `Batch ${componentToBeScrappedData.batchName} Scrapped!`,
          };
        })
      )
  }

  //#endregion

  //#region Override methods

  protected afterReset() {
    this.document.getElementById(`machine`).focus();

    this.componentsToBeScrapped$.next([]);
    this.reasonCodes$.next([]);
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
