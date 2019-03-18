import { Component, Injector } from '@angular/core';
import { BatchService } from '@core/hydra/service/batch.service';
import { Validators } from '@angular/forms';
import { IActionResult } from '@core/utils/helpers';
import { of, Observable, BehaviorSubject, throwError } from 'rxjs';
import { MachineService } from '@core/hydra/service/machine.service';
import { map, switchMap } from 'rxjs/operators';
import { BaseExtendForm } from '../base.form.extend';
import { ComponentToBeReplenish, getComponentToBeReplenish } from '@core/hydra/utils/operationHelper';
import { MPLBapiService } from '@core/hydra/bapi/mpl/bapi.service';
import { requestBatchData } from './request.common';
import { MaterialBatch } from '@core/hydra/entity/batch';

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

  componentsToBeReplenish$: BehaviorSubject<ComponentToBeReplenish[]> = new BehaviorSubject<[]>([]);

  //#endregion

  //#region Public member

  //#endregion

  //#region Constructor

  constructor(
    injector: Injector,
    private _machineService: MachineService,
    private _bapiService: MPLBapiService,
    private _batchService: BatchService
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

  hasComponentToBeReplenishData() {
    return !!this.form.value.componentToBeReplenishData;
  }

  getMachineComponentLoggedOnDisplay() {
    const componentToBeReplenishData = this.form.value.componentToBeReplenishData as ComponentToBeReplenish;
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
    if (this.componentsToBeReplenish$.value.length > 0) {
      this.form.controls.componentToBeReplenishData.setValue(this.componentsToBeReplenish$.value[0]);
      setTimeout(() => this.document.getElementById(`batch`).focus(), 0);
    }
  }

  requestMachineDataFailed = () => {
  }

  requestMachineData = () => {
    return this._machineService.getMachine(this.form.value.machine).pipe(
      map(machine => {
        this.componentsToBeReplenish$.next(getComponentToBeReplenish(machine));
        return machine;
      }));
  }

  //#endregion

  //#region Batch Reqeust
  requestBatchDataSuccess = (batch) => {
    this.form.controls.batch.setValue(batch.name);

    if (!this.isDisable()) {
      this.doAction(this.replenishBatch, this.replenishBatchSuccess, this.replenishBatchFailed);
    }
  }

  requestBatchDataFailed = () => {
  }

  requestBatchData = () => {
    return requestBatchData(this.form, this._batchService)().pipe(
      switchMap((batch: MaterialBatch) => {
        if (batch.status !== 'F') {
          return throwError(`Batch ${batch.name} status in-correct!`);
        }

        if (this.form.value.componentToBeReplenishData.material !== batch.material) {
          return throwError(`Material ${batch.material} in-correct!`);
        }

        return of(batch);
      }
      ));
  }

  //#endregion

  //#endregion

  //#endregion

  //#region Protected methods

  //#endregion

  //#region Event Handler

  componentSelected(componentSelected: ComponentToBeReplenish) {
    this.componentStatusPopup.close();
    this.form.controls.componentToBeReplenishData.setValue(componentSelected);
    this.document.getElementById('batch').focus();
  }

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
    // Replenish Batch
    const newBatch = this.form.value.batchData as MaterialBatch;
    let replenishBatch$ = of(null);
    const componentToBeReplenish = this.form.value.componentToBeReplenishData as ComponentToBeReplenish;
    // 1. Logoff first
    componentToBeReplenish.operations.forEach(op => {
      replenishBatch$ = replenishBatch$.pipe(
        switchMap(() => {
          return this._bapiService.logoffInputBatch({ name: op.name },
            this.machineData, this.operatorData, { name: componentToBeReplenish.batchName }, op.pos);
        })
      );
    });
    // 2. Adjust Batch if quantity < 0
    if (componentToBeReplenish.batchQty < 0) {
      replenishBatch$ = replenishBatch$.pipe(
        switchMap(_ => {
          return this._batchService.getBatchInformationAllowNegativeQuantity(componentToBeReplenish.batchName);
        }),
        switchMap((batch) => {
          return this._bapiService.changeBatchQuantityAndStatus(batch, 0, 'F', this.operatorData);
        })
      );
    }
    // 3. Merge Batch
    replenishBatch$ = replenishBatch$.pipe(
      switchMap(_ => {
        return this._bapiService.mergeBatch({ name: componentToBeReplenish.batchName }, [newBatch.name], this.operatorData);
      })
    );

    // 4. Logon Again
    componentToBeReplenish.operations.forEach(op => {
      replenishBatch$ = replenishBatch$.pipe(
        switchMap(() => {
          return this._bapiService.logonInputBatch({ name: op.name },
            this.machineData, this.operatorData, { name: componentToBeReplenish.batchName, material: componentToBeReplenish.material },
            op.pos);
        })
      );
    });

    return replenishBatch$.pipe(
      map((ret: IActionResult) => {
        return Object.assign(ret, {
          description: `Batch ${componentToBeReplenish.batchName} Replenished!`
        });
      }
      ));
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
