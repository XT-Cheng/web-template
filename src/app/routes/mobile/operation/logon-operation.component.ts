import { Component, Inject, ViewChild, Injector } from '@angular/core';
import { ToastService, ToptipsService, PopupComponent } from 'ngx-weui';
import { Router } from '@angular/router';
import { TitleService, SettingsService, ALAIN_I18N_TOKEN } from '@delon/theme';
import { OperatorService } from '@core/hydra/service/operator.service';
import { BapiService } from '@core/hydra/service/bapi.service';
import { FormBuilder, Validators } from '@angular/forms';
import { DOCUMENT } from '@angular/common';
import { I18NService } from '@core/i18n/i18n.service';
import { IActionResult } from '@core/utils/helpers';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { Machine } from '@core/hydra/entity/machine';
import { MachineService } from '@core/hydra/service/machine.service';
import { Operation, ComponentStatus } from '@core/hydra/entity/operation';
import { OperationService } from '@core/hydra/service/operation.service';
import { map, switchMap } from 'rxjs/operators';
import { BaseExtendForm } from '../base.form.extend';
import { getComponentStatus } from '@core/hydra/utils/operationHelper';

@Component({
  selector: 'fw-operation-logon',
  templateUrl: 'logon-operation.component.html',
  styleUrls: ['./logon-operation.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class LogonOperationComponent extends BaseExtendForm {
  //#region View Children

  @ViewChild(`componentStatus`) componentStatusPopup: PopupComponent;

  //#endregion

  //#region Protected member
  protected key = `app.mobile.operation.logon`;
  //#endregion

  //#region Public member

  componentStatus$: BehaviorSubject<ComponentStatus[]> = new BehaviorSubject<[]>([]);
  operations$: BehaviorSubject<Operation[]> = new BehaviorSubject<[]>([]);

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
    return this._machineService.getMachine(this.form.value.machine);
  }

  //#endregion

  //#region Operation Reqeust
  requestOperationDataSuccess = (_) => {
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
  logonOperationSuccess = (ret: IActionResult) => {
    this.showSuccess(ret.description);
  }

  logonOperationFailed = () => {
  }

  logonOperation = () => {
    let batchLogon$ = of(null);

    // LogOn Batch if required
    this.componentStatus$.value.forEach((status: ComponentStatus) => {
      if (status.isReady && status.operation !== this.form.value.operationData.name) {
        batchLogon$ = batchLogon$.pipe(
          switchMap(() => {
            return this._bapiService.logonInputBatch(this.form.value.operationData.name,
              this.form.value.machineData.machineName, this.form.value.badge,
              status.batchName, status.material, status.pos);
          })
        );
      }
    });
    // LogOn Operation
    return batchLogon$.pipe(
      switchMap(() => {
        return this._bapiService.logonOperation(this.form.value.operationData.name,
          this.form.value.machineData.machineName, this.form.value.badge);
      })
    );
  }

  //#endregion

  //#region Override methods

  protected afterReset() {
    this.document.getElementById(`machine`).focus();

    this.componentStatus$.next([]);
  }

  protected isValid() {
    return this.componentStatus$.value.every((status: ComponentStatus) => status.isReady);
  }

  //#endregion

  //#region Private methods

  //#endregion
}
