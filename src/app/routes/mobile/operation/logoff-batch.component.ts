import { Component, Injector } from '@angular/core';
import { BatchService } from '@core/hydra/service/batch.service';
import { Validators } from '@angular/forms';
import { IActionResult } from '@core/utils/helpers';
import { of, Observable, BehaviorSubject, throwError } from 'rxjs';
import { MachineService } from '@core/hydra/service/machine.service';
import { map, switchMap, tap } from 'rxjs/operators';
import { BaseExtendForm } from '../base.form.extend';
import { ComponentToBeLoggedOff, getComponentToBeLoggedOff } from '@core/hydra/utils/operationHelper';
import { MPLBapiService } from '@core/hydra/bapi/mpl/bapi.service';
import { toNumber } from 'ng-zorro-antd';
import { PrintService } from '@core/hydra/service/print.service';
import { MaterialBatch } from '@core/hydra/entity/batch';

@Component({
  selector: 'fw-batch-logoff',
  templateUrl: 'logoff-batch.component.html',
  styleUrls: ['./logoff-batch.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class LogoffBatchComponent extends BaseExtendForm {
  //#region View Children

  //#endregion

  //#region Protected member

  protected key = `app.mobile.material.logoff`;

  //#endregion

  //#region Public member

  componentsToBeLoggedOff$: BehaviorSubject<ComponentToBeLoggedOff[]> = new BehaviorSubject<[]>([]);

  //#endregion

  //#region Public member

  //#endregion

  //#region Constructor

  constructor(
    injector: Injector,
    private _printService: PrintService,
    private _machineService: MachineService,
    private _bapiService: MPLBapiService,
    private _batchService: BatchService
  ) {
    super(injector, false);
    this.addControls({
      machine: [null, [Validators.required], 'machineData'],
      newQty: [null, [Validators.required], 'newQtyData'],
      componentToBeLoggedOffData: [null, [Validators.required]],
    });
  }

  //#endregion

  //#region Public methods

  hasComponentToBeLoggedOffData() {
    return (this.form.value.componentToBeLoggedOffData && this.machineData);
  }

  getMachineComponentLoggedOnDisplay() {
    if (!this.machineData) return null;

    const componentToBeLoggedOffData = this.form.value.componentToBeLoggedOffData as ComponentToBeLoggedOff;
    if (componentToBeLoggedOffData) {
      return {
        material: componentToBeLoggedOffData.material,
        batchName: componentToBeLoggedOffData.batchName,
        quantity: componentToBeLoggedOffData.batchQty,
      };
    }

    return null;
  }
  //#endregion

  //#region Data Request

  //#region Machine Reqeust

  requestMachineDataSuccess = (_) => {
    if (this.componentsToBeLoggedOff$.value.length > 0) {
      this.form.controls.componentToBeLoggedOffData.setValue(this.componentsToBeLoggedOff$.value[0]);
      // setTimeout(() => this.document.getElementById(`newQty`).focus(), 0);
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
      map(machine => {
        this.componentsToBeLoggedOff$.next(getComponentToBeLoggedOff(machine).filter(item => item.allowLogoff));
        return machine;
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

    if (newQty < 0) {
      return throwError('Incorrect New Qty');
    }

    return of(newQty);
  }

  //#endregion

  //#endregion

  //#region Protected methods

  protected beforeRequestCheck(srcElement): Observable<boolean> {
    if (!srcElement) return of(true);

    switch (srcElement.id) {
      case 'newQty':
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

  componentSelected(componentSelected: ComponentToBeLoggedOff) {
    this.componentStatusPopup.close();
    this.form.controls.componentToBeLoggedOffData.setValue(componentSelected);
    this.document.getElementById('newQty').focus();
  }

  //#endregion

  //#region Exeuction
  logoffBatchSuccess = () => {
    this.form.controls.newQty.setValue(null);
    this.form.controls.componentToBeLoggedOffData.setValue(null);

    this.componentsToBeLoggedOff$.next([]);

    this.request(this.requestMachineData, this.requestMachineDataSuccess, this.requestMachineDataFailed)
      (null, null, `machine`);
  }

  logoffBatchFailed = () => {
  }

  logoffBatch = (): Observable<IActionResult> => {
    // LogOff Batch
    const newQty = toNumber(this.form.value.newQtyData, 0);
    let logoffBatch$ = of(null);
    const componentToBeLoggedOff = this.form.value.componentToBeLoggedOffData as ComponentToBeLoggedOff;
    componentToBeLoggedOff.operations.forEach(op => {
      logoffBatch$ = logoffBatch$.pipe(
        switchMap(() => {
          return this._bapiService.logoffInputBatch({ name: op.name },
            this.machineData, this.operatorData, { name: componentToBeLoggedOff.batchName }, op.pos);
        })
      );
    });
    let batchData: MaterialBatch;
    return logoffBatch$.pipe(
      switchMap(_ => {
        return this._batchService.getBatchInformationAllowNegativeQuantity(componentToBeLoggedOff.batchName);
      }),
      switchMap(batch => {
        batchData = batch;
        return this._bapiService.changeBatchQuantityAndStatus(batch, newQty, newQty > 0 ? 'F' : 'A', this.operatorData);
      }),
      switchMap(ret => {
        if (newQty > 0) {
          return this._printService.printMaterialBatchLabel([componentToBeLoggedOff.batchName]);
        }
        return of(ret);
      }),
      map((ret: IActionResult) => {
        return Object.assign(ret, {
          description: `Batch ${componentToBeLoggedOff.batchName} Logged Off!`
        });
      }
      ));
  }

  //#endregion

  //#region Override methods

  protected afterReset() {
    this.document.getElementById(`machine`).focus();

    this.componentsToBeLoggedOff$.next([]);
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
