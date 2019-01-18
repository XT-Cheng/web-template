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
import { of, Observable } from 'rxjs';
import { Machine } from '@core/hydra/entity/machine';
import { MachineService } from '@core/hydra/service/machine.service';
import { Operation } from '@core/hydra/entity/operation';

@Component({
  selector: 'fw-batch-logon',
  templateUrl: 'logon-batch.component.html',
  styleUrls: ['./logon-batch.component.scss']
})
export class LogonBatchComponent extends BaseForm {
  //#region View Children

  //#endregion

  //#region Protected member
  protected key = `app.mobile.material.logon`;
  //#endregion

  //#region Public member
  componentsInfo = [];

  requestBatchData = requestBatchData(this.form, this._batchService);

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
    _operatorService: OperatorService,
    private _bapiService: BapiService,
    @Inject(DOCUMENT) private _document: Document,
    @Inject(ALAIN_I18N_TOKEN) _i18n: I18NService,
  ) {
    super(fb, _settingService, _toastService, _routeService, _tipService, _titleService, _i18n, _operatorService);
    this.addControls({
      barCode: [null, [Validators.required]],
      machine: [null, [Validators.required]],
      operation: [null, [Validators.required]],
      batch: [null, [Validators.required]],
      badge: [null, [Validators.required]],
      batchData: [null],
      machineData: [null],
      opeartionData: [null]
    });

    this.form.setValue(Object.assign(this.form.value, {
      badge: this.storedData ? this.storedData.badge : ``,
    }));
  }

  //#endregion

  //#region Public methods
  getResultClass(comp) {
    return {
      'weui-icon-success': true,
      'weui-icon-warn': false
    };
  }
  //#endregion

  //#region Data Request

  //#region Machine Reqeust

  requestMachineDataSuccess = (machine: Machine) => {
    this.form.controls.machineData.setValue(machine);
    this.descriptions.set(`machine`, machine.display);
    this.operations = machine.nextOperations;
    if (this.operations.length > 0) {
      this.form.controls.operation.setValue(this.operations[0]);
    }
  }

  requestMachineDataFailed = () => {
  }

  requestMachineData = () => {
    return this._machineService.getMachine(this.form.value.machine);
  }

  //#endregion

  //#region Batch Reqeust
  requestBatchDataSuccess = (batch: MaterialBatch) => {
    this.form.controls.batch.setValue(batch.name);
    this.form.controls.barCode.setValue(batch.barCode);
    this.form.controls.batchData.setValue(batch);
  }

  requestBatchDataFailed = () => {
  }

  //#endregion

  //#region Operation Reqeust
  requestOperationDataSuccess = () => {
    console.log(`aaaa`);
    // this.componentsInfo = this.form.controls.operation.value.componentStatus.values();
  }

  requestOperationDataFailed = () => {
  }

  requestOperationData = (): Observable<any> => {
    return of(null);
  }

  //#endregion

  //#endregion

  //#region Protected methods

  //#endregion

  //#region Event Handler
  operationSelected() {
    this.request(this.requestOperationData, this.requestOperationDataSuccess, this.requestOperationDataFailed)
      (null, null, `operation`);
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
    return of(null);
    // return this._bapiService.logonBatch(this.form.value.batchData, this.form.value.materialBuffer, this.form.value.badge);
  }

  //#endregion

  //#region Override methods
  protected isValid() {
    return !Array.from(this.descriptions.entries()).some(value => {
      return (value[0] !== `batchData` && value[0] !== `barCode` && !value[1]);
    });
  }

  protected afterReset() {
    this._document.getElementById(`batch`).focus();
  }

  //#endregion

  //#region Private methods

  //#endregion
}
