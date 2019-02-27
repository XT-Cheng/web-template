import { Component, ViewChild, Injector } from '@angular/core';
import { PopupComponent } from 'ngx-weui';
import { Validators, FormControl } from '@angular/forms';
import { Observable, of, throwError } from 'rxjs';
import { Machine } from '@core/hydra/entity/machine';
import { MachineService } from '@core/hydra/service/machine.service';
import { OperationService } from '@core/hydra/service/operation.service';
import { BaseExtendForm } from '../base.form.extend';
import { toNumber } from '@delon/util';
import { switchMap, map } from 'rxjs/operators';
import { BDEBapiService } from '@core/hydra/bapi/bde/bapi.service';
import { MasterService } from '@core/hydra/service/master.service';
import { IActionResult } from '@core/utils/helpers';

@Component({
  selector: 'fw-operation-generate-output-batch',
  templateUrl: 'generateOutputBatch-operation.component.html',
  styleUrls: ['./generateOutputBatch-operation.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class GenerateOutputBatchComponent extends BaseExtendForm {
  static REASON = 99;

  //#region View Children

  @ViewChild(`componentStatus`) componentStatusPopup: PopupComponent;

  //#endregion

  //#region Protected member
  protected key = `app.mobile.operation.generateOutputBatch`;
  //#endregion

  //#region Public member

  //#endregion

  //#region Public member

  //#endregion

  //#region Constructor

  constructor(
    injector: Injector,
    private _machineService: MachineService,
    private _operationService: OperationService,
    private _masterService: MasterService,
    private _bapiService: BDEBapiService
  ) {
    super(injector);
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
    if (machine.currentOperation) {
      this.form.controls.operation.setValue(machine.currentOperation.name);
      this.request(this.requestOperationData, this.requestOperationDataSuccess, this.requestOperationDataFailed)
        (null, null, `operation`);
    }
  }

  requestMachineDataFailed = () => {
  }

  requestMachineData = () => {
    return this._machineService.getMachine(this.form.value.machine);
  }

  //#endregion

  //#region Operation Reqeust
  requestOperationDataSuccess = (_) => {
    this._masterService.getMaterialMaster(this.operationData.article).subscribe(material => {
      this.form.controls.materialData.setValue(material);
      if (this.operationData.pendingYieldQty === 0) {
        this.form.controls.quantity.setValue(material.standardPackageQty);
      } else {
        if (material) {
          if (material.standardPackageQty > this.operationData.pendingYieldQty) {
            this.form.controls.quantity.setValue(this.operationData.pendingYieldQty);
          } else {
            this.form.controls.quantity.setValue(material.standardPackageQty);
          }
        }
      }
      this.document.getElementById(`quantity`).focus();
    });
  }

  requestOperationDataFailed = () => {
  }

  requestOperationData = (): Observable<any> => {
    return this._operationService.getOperation(this.form.value.operation);
  }

  //#endregion

  //#region Number of Splits Reqeust
  requestQuantityDataSuccess = () => {
  }

  requestQuantityDataDataFailed = () => {
    this.form.controls.quantity.setValue(this.operationData.pendingYieldQty);
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
  generateOutputBatchSuccess = () => {
  }

  generateOutputBatchFailed = () => {
  }

  generateOutputBatch = () => {
    let outputBatchGeneration$ = of(null);
    const quantity = toNumber(this.form.value.quantity, 0);
    const standardQty = this.form.value.materialData.standardPackageQty;

    if (this.operationData.pendingYieldQty >= standardQty) {
      // TODO: Request Web API to Change Output Batch
      return outputBatchGeneration$.pipe(
        map((ret: IActionResult) => {
          return Object.assign(ret, {
            description: `Batch Generated And Print!`
          });
        })
      );
    } else {
      // Partial Confirm if required
      if (this.operationData.pendingYieldQty !== quantity) {
        const delta = quantity - this.operationData.pendingYieldQty;

        if (delta > 0) {
          outputBatchGeneration$ = outputBatchGeneration$.pipe(
            switchMap(_ => {
              return this._bapiService.partialConfirmOperation(this.operationData, this.machineData, this.operatorData
                , delta);
            })
          );
        } else {
          outputBatchGeneration$ = outputBatchGeneration$.pipe(
            switchMap(_ => {
              return this._bapiService.partialConfirmOperation(this.operationData, this.machineData, this.operatorData
                , 0, delta * -1, GenerateOutputBatchComponent.REASON);
            })
          );
        }
      }
      // Change Output Batch
      return outputBatchGeneration$.pipe(
        switchMap(_ => {
          return this._bapiService.changeOutputBatch(this.operationData, this.machineData, this.operationData.currentOutputBatch,
            quantity, this.operatorData);
        })
      );
    }
  }

  //#endregion

  //#region Override methods

  protected afterReset() {
    this.document.getElementById(`machine`).focus();
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

  //#endregion
}
