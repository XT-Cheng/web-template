import { Component, ViewChild, Injector } from '@angular/core';
import { PopupComponent } from 'ngx-weui';
import { Validators, FormControl } from '@angular/forms';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { Machine } from '@core/hydra/entity/machine';
import { MachineService } from '@core/hydra/service/machine.service';
import { OperationService } from '@core/hydra/service/operation.service';
import { BaseExtendForm } from '../base.form.extend';
import { toNumber } from '@delon/util';
import { switchMap, map, tap } from 'rxjs/operators';
import { BDEBapiService } from '@core/hydra/bapi/bde/bapi.service';
import { MasterService } from '@core/hydra/service/master.service';
import { IActionResult } from '@core/utils/helpers';
import { MACHINE_STATUS_PRODUCTION } from '@core/hydra/bapi/constants';
import { ReasonCode } from '@core/hydra/entity/reasonCode';
import { MaterialMaster } from '@core/hydra/entity/materialMaster';

@Component({
  selector: 'fw-operation-generate-output-batch',
  templateUrl: 'generateOutputBatch-operation.component.html',
  styleUrls: ['./generateOutputBatch-operation.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class GenerateOutputBatchComponent extends BaseExtendForm {
  //#region View Children

  @ViewChild(`reasonCode`) reasonCodePopup: PopupComponent;

  //#endregion

  //#region Protected member
  protected key = `app.mobile.operation.generateOutputBatch`;
  //#endregion

  //#region Public member

  public reasonCodes$: BehaviorSubject<ReasonCode[]> = new BehaviorSubject<ReasonCode[]>([]);

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
      reasonCodeData: [null],
      scrap: [null],
      quantity: [null, [Validators.required, Validators.min(0),
      Validators.pattern(/^[0-9]*$/)], 'quantityData'],
    });
  }

  //#endregion

  //#region Public methods

  getReasonCodeStyle(reasonCodeDisplay) {
    return reasonCodeDisplay.selected ? {} : { 'color': 'red' };
  }

  getSelectedReasonCodeDisplay() {
    if (!this.operationData) return null;
    if (!this.form.value.quantityData) return null;
    if (!this.form.value.materialData) return null;
    if (!this.form.value.quantityData) return null;

    if (this.operationData.pendingYieldQty > this.form.value.quantityData
      && this.form.value.quantityData !== this.form.value.materialData.standardPackageQty) {

      this.form.controls.scrap.setValue(this.operationData.pendingYieldQty - this.form.value.quantityData);

      if (this.form.value.reasonCodeData) {
        return {
          description: this.form.value.reasonCodeData.description,
          selected: true
        };
      }

      return {
        description: `Please select Reason Code`,
        selected: false
      };
    }

    return null;
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
    if (machine.currentOperation) {
      this.form.controls.operation.setValue(machine.currentOperation.name);
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

        if (machine.currentStatusNr !== MACHINE_STATUS_PRODUCTION) {
          throw Error(`Machine Status is not Production!`);
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

  //#region Number of Quantity Reqeust
  requestQuantityDataSuccess = () => {
    this.form.controls.reasonCodeData.setValue(null);
  }

  requestQuantityDataFailed = () => {
    this.form.controls.reasonCodeData.setValue(null);
    if (this.form.value.materialData) {
      const material = this.form.value.materialData as MaterialMaster;
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
    }
  }

  requestQuantityData = () => {
    if (!/^[0-9]*$/.test(this.form.value.quantity)) {
      return throwError('Invalid Quantity');
    }

    const quantity = toNumber(this.form.value.quantity);

    if (this.form.value.materialData && quantity > this.form.value.materialData.standardPackageQty) {
      return throwError('Quantity larger than standard packing qty');
    }

    return of(quantity);
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
  generateOutputBatchSuccess = () => {
  }

  generateOutputBatchFailed = () => {
  }

  generateOutputBatch = () => {
    let outputBatchGeneration$ = of(null);
    const quantity = toNumber(this.form.value.quantityData, 0);
    const standardQty = this.form.value.materialData.standardPackageQty;

    if (this.operationData.pendingYieldQty >= standardQty && quantity === standardQty) {
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
                , 0, delta * -1, this.form.value.reasonCodeData.codeNbr);
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

  protected isValid() {
    if (!this.operationData) return false;
    if (!this.form.value.quantityData) return false;
    if (!this.form.value.materialData) return false;

    if (this.form.value.quantityData > this.form.value.materialData.standardPackageQty) {
      return false;
    }

    if (this.operationData.pendingYieldQty > this.form.value.quantityData
      && !this.form.value.reasonCodeData
      && this.form.value.quantityData !== this.form.value.materialData.standardPackageQty) {
      return false;
    }

    return true;
  }

  //#endregion

  //#region Private methods

  //#endregion

  //#region Override properties

  get upperLevel(): string {
    return `/operation/list`;
  }

  //#endregion
}
