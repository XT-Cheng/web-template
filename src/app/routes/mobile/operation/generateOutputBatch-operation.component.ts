import { Component, Inject, ViewChild, Injector } from '@angular/core';
import { ToastService, ToptipsService, PopupComponent } from 'ngx-weui';
import { Router } from '@angular/router';
import { TitleService, SettingsService, ALAIN_I18N_TOKEN } from '@delon/theme';
import { OperatorService } from '@core/hydra/service/operator.service';
import { BapiService } from '@core/hydra/service/bapi.service';
import { FormBuilder, Validators, FormControl } from '@angular/forms';
import { DOCUMENT } from '@angular/common';
import { I18NService } from '@core/i18n/i18n.service';
import { IActionResult } from '@core/utils/helpers';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { Machine } from '@core/hydra/entity/machine';
import { MachineService } from '@core/hydra/service/machine.service';
import { Operation, ComponentStatus } from '@core/hydra/entity/operation';
import { OperationService } from '@core/hydra/service/operation.service';
import { map, switchMap } from 'rxjs/operators';
import { BaseExtendForm } from '../base.form.extend';
import { getComponentStatus } from '@core/hydra/utils/operationHelper';
import { toNumber } from '@delon/util';

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
    private _bapiService: BapiService,
  ) {
    super(injector);
    this.addControls({
      machine: [null, [Validators.required], 'machineData'],
      operation: [null, [Validators.required], 'operationData'],
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
    this.form.controls.quantity.setValue(this.form.controls.operationData.value.pendingYieldQty);
    this.document.getElementById(`quantity`).focus();
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
  generateOutputBatchSuccess = (ret: IActionResult) => {
    // this.showSuccess(ret.description);
  }

  generateOutputBatchFailed = () => {
  }

  generateOutputBatch = () => {
    // let batchLogon$ = of(null);

    // // LogOn Batch if required
    // this.componentStatus$.value.forEach((status: ComponentStatus) => {
    //   if (status.isReady && status.operation !== this.form.value.operationData.name) {
    //     batchLogon$ = batchLogon$.pipe(
    //       switchMap(() => {
    //         return this._bapiService.logonInputBatch(this.form.value.operationData.name,
    //           this.form.value.machineData.machineName, this.form.value.badge,
    //           status.batchName, status.material, status.pos);
    //       })
    //     );
    //   }
    // });
    // // LogOn Operation
    // return batchLogon$.pipe(
    //   switchMap(() => {
    //     return this._bapiService.logonOperation(this.form.value.operationData.name,
    //       this.form.value.machineData.machineName, this.form.value.badge);
    //   })
    // );
    return of(null);
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
    if (!this.form.value.operationData) return null;

    if (toNumber(c.value) < this.form.value.operationData.pendingYieldQty) {
      return {
        validateQuantity: {
          valid: false
        }
      };
    }
  }
  //#endregion
}
