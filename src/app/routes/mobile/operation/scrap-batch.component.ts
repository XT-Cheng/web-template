import { Component, Injector } from '@angular/core';
import { Validators } from '@angular/forms';
import { IActionResult } from '@core/utils/helpers';
import { of, Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { BaseExtendForm } from '../base.form.extend';
import { ComponentToBeLoggedOff } from '@core/hydra/utils/operationHelper';
import { toNumber } from 'ng-zorro-antd';
import { MachineWebApi } from '@core/webapi/machine.webapi';
import { BatchWebApi } from '@core/webapi/batch.webapi';
import { PrintLabelWebApi } from '@core/webapi/printLabel.webapi';
import { ComponentLoggedOn } from '@core/hydra/entity/operation';
import { MaterialMasterWebApi } from '@core/webapi/materialMaster.webapi';

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

  //#endregion

  //#region Protected member

  protected key = `app.mobile.material.scrap`;

  //#endregion

  //#region Public member

  componentsToBeScrapped$: BehaviorSubject<ComponentToBeLoggedOff[]> = new BehaviorSubject<[]>([]);

  //#endregion

  //#region Public member

  //#endregion

  //#region Constructor

  constructor(
    injector: Injector,
    private _machineWebApi: MachineWebApi,
    private _batchWebApi: BatchWebApi,
    private _printLabelWebApi: PrintLabelWebApi,
    private _materialMasterWebApi: MaterialMasterWebApi,
  ) {
    super(injector, false);
    this.addControls({
      machine: [null, [Validators.required], 'machineData'],
      scrapQty: [null, [Validators.required], 'scrapQtyData'],
      componentToBeScrappedData: [null, [Validators.required]],
    });
  }

  //#endregion

  //#region Public methods

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
      map(machine => {
        this.componentsToBeScrapped$.next(machine.componentsLoggedOn);
        return machine;
      }));
  }

  //#endregion

  //#region New Qty Reqeust
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

    if (scrapQty > this.form.value.componentToBeScrappedData.batchQty) {
      return throwError('Incorrect Scrap Qty');
    }

    return of(scrapQty);
  }

  //#endregion

  //#endregion

  //#region Protected methods

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

    this.componentsToBeScrapped$.next([]);

    this.request(this.requestMachineData, this.requestMachineDataSuccess, this.requestMachineDataFailed)
      (null, null, `machine`);
  }

  scrapBatchFailed = () => {
  }

  scrapBatch = (): Observable<IActionResult> => {
    const scrapQty = toNumber(this.form.value.scrapQty, 0);
    const componentToBeScrappedData = this.form.value.componentToBeScrappedData as ComponentLoggedOn;

    return this._batchWebApi.scrapInputBatch(this.machineData,
      { name: componentToBeScrappedData.batchName, material: componentToBeScrappedData.material }, scrapQty, this.operatorData).pipe(
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
