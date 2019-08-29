import { Component, Injector } from '@angular/core';
import { Validators, FormControl } from '@angular/forms';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { Machine } from '@core/hydra/entity/machine';
import { Operation } from '@core/hydra/entity/operation';
import { BaseExtendForm } from '../base.form.extend';
import { toNumber } from '@delon/util';
import { map, tap } from 'rxjs/operators';
import { MachineWebApi } from '@core/webapi/machine.webapi';
import { OperationWebApi } from '@core/webapi/operation.webapi';
import { MaterialMasterWebApi } from '@core/webapi/materialMaster.webapi';

@Component({
  selector: 'fw-packing',
  templateUrl: 'packing.component.html',
  styleUrls: ['./packing.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class PackingComponent extends BaseExtendForm {
  //#region View Children

  //#endregion

  //#region Protected member
  protected key = `app.mobile.packing`;
  //#endregion

  //#region Public member

  operations$: BehaviorSubject<Operation[]> = new BehaviorSubject<[]>([]);

  //#endregion

  //#region Public member

  //#endregion

  //#region Constructor

  constructor(
    injector: Injector,
    private _machineWebApi: MachineWebApi,
    private _operationWebApi: OperationWebApi,
    private _materialMasterWebApi: MaterialMasterWebApi
  ) {
    super(injector, false);
    this.addControls({
      machine: [null, [Validators.required], 'machineData'],
      operation: [null, [Validators.required], 'operationData'],
      materialData: [null, [Validators.required]],
      quantity: [null, [Validators.required, Validators.min(1), Validators.pattern(/^[0-9]*$/), this.validateQuantity.bind(this)]],
    });
  }

  //#endregion

  //#region Public methods

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
    return this._machineWebApi.getMachine(this.form.value.machine).pipe(
      tap(machine => {
        if (!machine) {
          throw Error('Machine invalid');
        }
      })
    );
  }

  //#endregion

  //#region Operation Reqeust
  requestOperationDataSuccess = (_) => {
    this._materialMasterWebApi.getPartMaster(this.operationData.article).subscribe(material => {
      if (material) {
        this.form.controls.materialData.setValue(material);
        this.form.controls.quantity.setValue(material.standardPackageQty);
      }
      this.document.getElementById(`quantity`).focus();
    });
  }

  requestOperationDataFailed = () => {
    this.document.getElementById('machine').focus();
  }

  requestOperationData = (): Observable<Operation> => {
    return this._operationWebApi.getOperation(this.form.value.operation).pipe(
      tap(operation => {
        if (operation.leadOrder) {
          throw Error("Only Lead Order can be Packed!");
        }
      })
    );
  }

  //#endregion

  //#region Number of Quantity Reqeust
  requestQuantityDataSuccess = () => {
  }

  requestQuantityDataDataFailed = () => {
  }

  requestQuantityData = () => {
    if (!/^[0-9]*$/.test(this.form.value.quantity)) {
      return throwError('Invalid Quantity');
    }

    return of(null);
  }

  //#endregion

  //#endregion

  //#region Protected methods

  //#endregion

  //#region Event Handler

  //#endregion

  //#region Exeuction
  packingSuccess = () => {
    this.form.controls.quantity.setValue(null);
    this.form.controls.operation.setValue(null);
    this.form.controls.operationData.setValue(null);
    this.form.controls.materialData.setValue(null);

    this.request(this.requestMachineData, this.requestMachineDataSuccess, this.requestMachineDataFailed)(null, null, 'machine');
  }

  packingFailed = () => {
  }

  packing = () => {
    // Packing
    return this._operationWebApi.partialConfirmOperation(this.operationData,
      this.machineData, this.operatorData, this.form.value.quantity).pipe(
        map(_ => {
          return {
            isSuccess: true,
            description: `Operation ${this.operationData.name} Packed`,
          }
        })
      );
  }

  //#endregion

  //#region Override methods

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

  //#region Validators

  validateQuantity(c: FormControl) {
    if (!this.operationData) return null;

    if (!this.form.value.materialData) return null;

    if (toNumber(c.value, 0) > this.form.value.materialData.standardPackageQty) {
      return {
        validateQuantity: {
          valid: false
        }
      };
    }
  }
}
