import { Component, Injector } from '@angular/core';
import { BatchService } from '@core/hydra/service/batch.service';
import { Validators } from '@angular/forms';
import { IActionResult } from '@core/utils/helpers';
import { of, Observable, BehaviorSubject, throwError } from 'rxjs';
import { MachineService } from '@core/hydra/service/machine.service';
import { map, switchMap, tap } from 'rxjs/operators';
import { BaseExtendForm } from '../base.form.extend';
import { ComponentToBeReplenish, getComponentToBeReplenish } from '@core/hydra/utils/operationHelper';
import { MPLBapiService } from '@core/hydra/bapi/mpl/bapi.service';
import { requestBatchData } from '../material/request.common';
import { MaterialBatch } from '@core/hydra/entity/batch';
import { MachineWebApi } from '@core/webapi/machine.webapi';
import { BatchWebApi } from '@core/webapi/batch.webapi';
import { ComponentLoggedOn } from '@core/hydra/entity/operation';

@Component({
  selector: 'fw-batch-replenish',
  templateUrl: 'replenish-batch.component.html',
  styleUrls: ['./replenish-batch.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class ReplenishBatchComponent extends BaseExtendForm {
  //#region View Children

  //#endregion

  //#region Protected member

  protected key = `app.mobile.material.replenish`;

  //#endregion

  //#region Public member

  componentsToBeReplenish$: BehaviorSubject<ComponentLoggedOn[]> = new BehaviorSubject<[]>([]);

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
      batch: [null, [Validators.required], 'batchData'],
      componentToBeReplenishData: [null, [Validators.required]],
    });
  }

  //#endregion

  //#region Public methods

  getMachineComponentLoggedOnDisplay() {
    if (!this.batchData || !this.machineData) return null;

    const componentToBeReplenishData = this.form.value.componentToBeReplenishData as ComponentLoggedOn;
    if (componentToBeReplenishData) {
      return {
        material: componentToBeReplenishData.material,
        batchName: componentToBeReplenishData.batchName,
        quantity: componentToBeReplenishData.batchQty,
      };
    }

    return null;
  }
  //#endregion

  //#region Data Request

  //#region Machine Reqeust

  requestMachineDataSuccess = (_) => {
    this.form.controls.batch.setValue(``);
    this.form.controls.batchData.setValue(null);
    this.form.controls.componentToBeReplenishData.setValue(null);

    if (this.componentsToBeReplenish$.value.length > 0) {
      setTimeout(() => this.document.getElementById(`batch`).focus(), 0);
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
        this.componentsToBeReplenish$.next(machine.componentsLoggedOn);
        return machine;
      }));
  }

  //#endregion

  //#region Batch Reqeust
  requestBatchDataSuccess = (batch) => {
    this.form.controls.batch.setValue(batch.name);

    this.form.controls.componentToBeReplenishData.setValue(
      this.componentsToBeReplenish$.value.find(comp => comp.material === batch.material));
  }

  requestBatchDataFailed = () => {
    this.form.controls.componentToBeReplenishData.setValue(null);
  }

  requestBatchData = () => {
    return requestBatchData(this.form, this._batchWebApi)().pipe(
      tap((batch: MaterialBatch) => {
        if (batch.status !== 'Free') {
          throw Error(`Batch ${batch.name} status in-correct!`);
        }

        if (!this.componentsToBeReplenish$.value.find(comp => comp.material === batch.material)) {
          throw Error(`Material ${batch.material} in-correct!`);
        }
      }
      ));
  }

  //#endregion

  //#endregion

  //#endregion

  //#region Protected methods

  protected beforeRequestCheck(srcElement): Observable<boolean> {
    if (!srcElement) return of(true);

    switch (srcElement.id) {
      case 'batch':
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

  //#endregion

  //#region Exeuction
  replenishBatchSuccess = () => {
    this.form.controls.batch.setValue(null);
    this.form.controls.batchData.setValue(null);
    this.form.controls.componentToBeReplenishData.setValue(null);

    this.request(this.requestMachineData, this.requestMachineDataSuccess, this.requestMachineDataFailed)
      (null, null, `machine`);
  }

  replenishBatchFailed = () => {
  }

  replenishBatch = (): Observable<IActionResult> => {
    return this._batchWebApi.replenishInputBatch(this.form.value.machineData, this.form.value.batchData,
      this.operatorData).pipe(
        map(_ => {
          return {
            isSuccess: true,
            description: `Batch ${this.batchData.name} Replenished!`,
          }
        }));
  }

  //#endregion

  //#region Override methods

  protected afterReset() {
    this.document.getElementById(`machine`).focus();

    this.componentsToBeReplenish$.next([]);
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
