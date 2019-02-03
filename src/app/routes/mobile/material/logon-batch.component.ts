import { BaseForm } from '../base.form';
import { Component, Inject } from '@angular/core';
import { ToastService, ToptipsService } from 'ngx-weui';
import { Router } from '@angular/router';
import { TitleService, SettingsService, ALAIN_I18N_TOKEN } from '@delon/theme';
import { BatchService } from '@core/hydra/service/batch.service';
import { OperatorService } from '@core/hydra/service/operator.service';
import { BapiService } from '@core/hydra/service/bapi.service';
import { FormBuilder, Validators } from '@angular/forms';
import { MaterialBatch } from '@core/hydra/entity/batch';
import { DOCUMENT } from '@angular/common';
import { I18NService } from '@core/i18n/i18n.service';
import { IActionResult } from '@core/utils/helpers';
import { requestBatchData, requestMaterialBufferData } from './request.common';
import { requestBadgeData } from '../request.common';
import { of, Observable, BehaviorSubject, throwError } from 'rxjs';
import { Machine } from '@core/hydra/entity/machine';
import { MachineService } from '@core/hydra/service/machine.service';
import { Operation, ComponentLoggedOn } from '@core/hydra/entity/operation';
import { OperationService } from '@core/hydra/service/operation.service';
import { map, tap, switchMap } from 'rxjs/operators';
import { BaseExtendForm } from '../base.form.extend';
import { getComponentStatus } from '@core/hydra/utils/operationHelper';

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

  componentStatus$: BehaviorSubject<[]> = new BehaviorSubject<[]>([]);

  //#endregion

  //#region Public member

  operations: Operation[] = [];

  //#endregion

  //#region Constructor

  constructor(
    fb: FormBuilder,
    _toastService: ToastService,
    _routeService: Router,
    _tipService: ToptipsService,
    _titleService: TitleService,
    _settingService: SettingsService,
    private _batchService: BatchService,
    private _machineService: MachineService,
    private _operationService: OperationService,
    _operatorService: OperatorService,
    private _bapiService: BapiService,
    @Inject(DOCUMENT) private _document: Document,
    @Inject(ALAIN_I18N_TOKEN) _i18n: I18NService,
  ) {
    super(fb, _settingService, _toastService, _routeService, _tipService, _titleService, _i18n, _operatorService);
    this.addControls({
      barCode: [null, [Validators.required], true],
      machine: [null, [Validators.required], 'machineData'],
      operation: [null, [Validators.required], 'operationData'],
      batch: [null, [Validators.required], 'batchData'],
      componentStatus: [null, [Validators.required], true],
      actionData: [null, [Validators.required], true],
    });
  }

  //#endregion

  //#region Public methods
  componentStatusDisplay(componentStatus: any[]) {
    const request = componentStatus.length;
    let ready = 0;
    let missed = 0;
    componentStatus.map(status => {
      if (status.isReady) {
        ready++;
      } else {
        missed++;
      }
    });

    return `${this.i18n.fanyi('')}`;
  }
  //#endregion

  //#region Data Request

  //#region Machine Reqeust

  requestMachineDataSuccess = (machine: Machine) => {
    this.operations = machine.nextOperations;
    if (this.operations.length > 0) {
      this.form.controls.operation.setValue(this.operations[0].name);
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

  //#region Batch Reqeust
  requestBatchDataSuccess = (batch) => {
    this.form.controls.batch.setValue(batch.name);
    this.form.controls.barCode.setValue(batch.barCode);
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
        const found = this.form.value.componentStatus.find(cs => cs.material === batch.material);
        if (!found) {
          return throwError(`${batch.material} in-correct!`);
        } else {
          this.form.controls.actionData.setValue(found);
          return of(batch);
        }
      }
      ));
  }


  //#endregion

  //#region Operation Reqeust
  requestOperationDataSuccess = (_) => {
    this.componentStatus$.next(this.form.value.componentStatus);
  }

  requestOperationDataFailed = () => {
  }

  requestOperationData = (): Observable<any> => {
    return this._operationService.getOperation(this.form.value.operation).pipe(
      map(operation => {
        this.form.controls.componentStatus.setValue(getComponentStatus(operation, this.form.value.machineData));
        return operation;
      }));
  }

  //#endregion

  //#endregion

  //#region Protected methods

  //#endregion

  //#region Event Handler
  operationSelected($event) {
    if (this.form.controls.operation.value) {
      this.request(this.requestOperationData, this.requestOperationDataSuccess, this.requestOperationDataFailed)
        (null, null, `operation`);
    }
  }
  //#endregion

  //#region Exeuction
  logonBatchSuccess = (ret: IActionResult) => {
    this.showSuccess(ret.description);
  }

  logonBatchFailed = () => {
  }

  logonBatch = () => {
    // LogOn Batch
    const found = this.form.value.actionData;
    return this._bapiService.logonInputBatch(this.form.value.operationData.name,
      this.form.value.machineData.machineName, this.form.value.badge,
      this.form.value.batchData.name, this.form.value.batchData.material, found.pos);
  }

  //#endregion

  //#region Override methods

  protected afterReset() {
    this._document.getElementById(`batch`).focus();
  }

  //#endregion

  //#region Private methods

  //#endregion
}
