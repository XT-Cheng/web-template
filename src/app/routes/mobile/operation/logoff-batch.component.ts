import { Component, Injector } from '@angular/core';
import { BatchService } from '@core/hydra/service/batch.service';
import { Validators } from '@angular/forms';
import { IActionResult } from '@core/utils/helpers';
import { of, Observable, BehaviorSubject, throwError, forkJoin } from 'rxjs';
import { MachineService } from '@core/hydra/service/machine.service';
import { map, switchMap, tap } from 'rxjs/operators';
import { BaseExtendForm } from '../base.form.extend';
import { ComponentToBeLoggedOff, getComponentToBeLoggedOff } from '@core/hydra/utils/operationHelper';
import { MPLBapiService } from '@core/hydra/bapi/mpl/bapi.service';
import { toNumber } from 'ng-zorro-antd';
import { PrintService } from '@core/hydra/service/print.service';
import { MaterialBatch } from '@core/hydra/entity/batch';
import { MachineWebApi } from '@core/webapi/machine.webapi';
import { BatchWebApi } from '@core/webapi/batch.webapi';
import { PrintLabelWebApi } from '@core/webapi/printLabel.webapi';
import { ComponentLoggedOn } from '@core/hydra/entity/operation';
import { MaterialMasterWebApi } from '@core/webapi/materialMaster.webapi';

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
    private _machineWebApi: MachineWebApi,
    private _batchWebApi: BatchWebApi,
    private _printLabelWebApi: PrintLabelWebApi,
    private _materialMasterWebApi: MaterialMasterWebApi,
    // private _printService: PrintService,
    // private _machineService: MachineService,
    // private _bapiService: MPLBapiService,
    // private _batchService: BatchService
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
        this.componentsToBeLoggedOff$.next(machine.componentsLoggedOn.filter(item => item.allowLogoff));
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

  componentSelected(componentSelected: ComponentLoggedOn) {
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
    const newQty = toNumber(this.form.value.newQtyData, 0);
    const componentToBeLoggedOff = this.form.value.componentToBeLoggedOffData as ComponentLoggedOn;

    return this._batchWebApi.logoffInputBatch(this.machineData, { name: componentToBeLoggedOff.batchName },
      newQty, this.operatorData).pipe(
        switchMap((batchLoggedOff: string) => {
          return this._batchWebApi.getBatch(componentToBeLoggedOff.batchName).pipe(
            switchMap(batch => {
              return this._materialMasterWebApi.getPartMaster(batch.material).pipe(
                switchMap(materialMaster => {
                  return this._printLabelWebApi.printLabel([batchLoggedOff], materialMaster.tagTypeName,
                    batch.SAPBatch, batch.dateCode);
                })
              )
            })
          )
        }),
        switchMap(_ => {
          return of({
            isSuccess: true,
            description: `Batch ${componentToBeLoggedOff.batchName} Logged Off And Label Printed!`,
          });
        })
      )
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
