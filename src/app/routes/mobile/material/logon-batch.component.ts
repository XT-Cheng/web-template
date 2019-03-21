import { Component, Injector } from '@angular/core';
import { BatchService } from '@core/hydra/service/batch.service';
import { Validators } from '@angular/forms';
import { MaterialBatch } from '@core/hydra/entity/batch';
import { requestBatchData } from './request.common';
import { of, Observable, BehaviorSubject, throwError } from 'rxjs';
import { Machine } from '@core/hydra/entity/machine';
import { MachineService } from '@core/hydra/service/machine.service';
import { Operation, ComponentStatus } from '@core/hydra/entity/operation';
import { OperationService } from '@core/hydra/service/operation.service';
import { map, switchMap, tap } from 'rxjs/operators';
import { BaseExtendForm } from '../base.form.extend';
import { getComponentStatus, getComponentToBeReplenish } from '@core/hydra/utils/operationHelper';
import { MPLBapiService } from '@core/hydra/bapi/mpl/bapi.service';
import { IActionResult } from '@core/utils/helpers';

@Component({
  selector: 'fw-batch-logon',
  templateUrl: 'logon-batch.component.html',
  styleUrls: ['./logon-batch.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class LogonBatchComponent extends BaseExtendForm {
  //#region View Children

  //#endregion

  //#region Protected member

  protected key = `app.mobile.material.logon`;

  //#endregion

  //#region Public member

  componentStatus$: BehaviorSubject<ComponentStatus[]> = new BehaviorSubject<[]>([]);
  operations$: BehaviorSubject<Operation[]> = new BehaviorSubject<[]>([]);

  //#endregion

  //#region Constructor

  constructor(
    injector: Injector,
    private _batchService: BatchService,
    private _machineService: MachineService,
    private _operationService: OperationService,
    private _bapiService: MPLBapiService,
  ) {
    super(injector, false);
    this.addControls({
      operation: [null, [Validators.required], 'operationData'],
      machine: [null, [Validators.required], 'machineData'],
      batch: [null, [Validators.required], 'batchData'],
      actionData: [null, [Validators.required]],
    });
  }

  //#endregion

  //#region Public methods

  //#endregion

  //#region Data Request

  //#region Machine Reqeust

  requestMachineDataSuccess = (machine: Machine) => {
    this.operations$.next(machine.nextOperations);
    if (machine.nextOperations.length > 0) {
      this.form.controls.operation.setValue(machine.nextOperations[0].name);
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
      })
    );
  }

  //#endregion

  //#region Batch Reqeust
  requestBatchDataSuccess = (batch) => {
    this.form.controls.batch.setValue(batch.name);
    this.form.controls.batchData.setValue(batch);

    if (!this.isDisable()) {
      this.doAction(this.logonBatch, this.logonBatchSuccess, this.logonBatchFailed);
    }
  }

  requestBatchDataFailed = () => {
  }

  requestBatchData = () => {
    return requestBatchData(this.form, this._batchService)().pipe(
      switchMap((batch: MaterialBatch) => {
        const found = this.componentStatus$.value.find(cs => cs.material === batch.material);
        if (!found) {
          return throwError(`Material ${batch.material} in-correct!`);
        }

        // if (found.isReady) {
        //   return throwError(`Material ${batch.material} already logged on!`);
        // }

        this.form.controls.actionData.setValue(found);
        return of(batch);
      }
      ));
  }

  //#endregion

  //#region Operation Reqeust
  requestOperationDataSuccess = (_) => {
    setTimeout(() => this.document.getElementById(`batch`).focus(), 0);
  }

  requestOperationDataFailed = () => {
  }

  requestOperationData = (): Observable<any> => {
    return this._operationService.getOperation(this.form.value.operation).pipe(
      map(operation => {
        this.componentStatus$.next(getComponentStatus(operation, this.form.value.machineData));
        return operation;
      }));
  }

  //#endregion

  //#endregion

  //#region Protected methods

  //#endregion

  //#region Event Handler

  operationSelected(operationName) {
    this.operationListPopup.close();
    this.form.controls.operation.setValue(operationName);
    if (operationName) {
      this.request(this.requestOperationData, this.requestOperationDataSuccess, this.requestOperationDataFailed)
        (null, null, `operation`);
    }
  }

  //#endregion

  //#region Exeuction
  logonBatchSuccess = () => {
    this.form.controls.batch.setValue(null);
    this.form.controls.operation.setValue(``);
    this.form.controls.batchData.setValue(null);
    this.form.controls.operationData.setValue(null);
    this.form.controls.actionData.setValue(null);

    this.componentStatus$.next([]);
    this.operations$.next([]);

    this.request(this.requestMachineData, this.requestMachineDataSuccess, this.requestMachineDataFailed)
      (null, null, `machine`);
  }

  logonBatchFailed = () => {
  }

  logonBatch = () => {
    // LogOn Batch
    const actionData = this.form.value.actionData as ComponentStatus;
    if (actionData.isReady) {
      // #region Replenish Mode
      const newBatch = this.form.value.batchData as MaterialBatch;
      const toBeReplenish = getComponentToBeReplenish(this.machineData)
        .filter(item => item.material === newBatch.material)[0];
      let replenishBatch$ = of(null);
      // 1. Logoff first
      toBeReplenish.operations.forEach(op => {
        replenishBatch$ = replenishBatch$.pipe(
          switchMap(() => {
            return this._bapiService.logoffInputBatch({ name: op.name },
              this.machineData, this.operatorData, { name: toBeReplenish.batchName }, op.pos);
          })
        );
      });
      // 2. Adjust Batch if quantity < 0
      if (toBeReplenish.batchQty < 0) {
        replenishBatch$ = replenishBatch$.pipe(
          switchMap(_ => {
            return this._batchService.getBatchInformationAllowNegativeQuantity(toBeReplenish.batchName);
          }),
          switchMap((batch) => {
            return this._bapiService.changeBatchQuantityAndStatus(batch, 0, 'F', this.operatorData);
          })
        );
      }
      // 3. Merge Batch
      replenishBatch$ = replenishBatch$.pipe(
        switchMap(_ => {
          return this._bapiService.mergeBatch({ name: toBeReplenish.batchName }, [newBatch.name], this.operatorData);
        })
      );
      // 4. Logon Again
      toBeReplenish.operations.forEach(op => {
        replenishBatch$ = replenishBatch$.pipe(
          switchMap(() => {
            return this._bapiService.logonInputBatch({ name: op.name },
              this.machineData, this.operatorData, { name: toBeReplenish.batchName, material: toBeReplenish.material },
              op.pos);
          })
        );
      });
      return replenishBatch$.pipe(
        map((ret: IActionResult) => {
          return Object.assign(ret, {
            description: `Batch ${newBatch.name} Logged On!`
          });
        }
        ));
      //#endregion
    } else {
      return this._bapiService.logonInputBatch(this.operationData,
        this.machineData, this.operatorData,
        this.batchData, actionData.pos);
    }
  }

  //#endregion

  //#region Override methods

  protected afterReset() {
    this.document.getElementById(`machine`).focus();

    this.componentStatus$.next([]);
    this.operations$.next([]);
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
