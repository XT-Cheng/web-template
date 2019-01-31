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
      machine: [null, [Validators.required]],
      operation: [null, [Validators.required]],
      batch: [null, [Validators.required]],
      batchData: [null, [Validators.required], true],
      machineData: [null, [Validators.required], true],
      operationData: [null, [Validators.required], true],
      componentStatus: [null, [Validators.required], true],
      actionData: [null, [Validators.required], true],
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
      this.form.controls.operation.setValue(this.operations[0].name);
    }
  }

  requestMachineDataFailed = () => {
  }

  requestMachineData = () => {
    return this._machineService.getMachine(this.form.value.machine);
  }

  //#endregion

  //#region Batch Reqeust
  requestBatchDataSuccess = (array: any[]) => {
    const [found, batch] = array;
    this.form.controls.batch.setValue(batch.name);
    this.form.controls.barCode.setValue(batch.barCode);
    this.form.controls.batchData.setValue(batch);

    this.descriptions.set(`batch`, batch.display);
    this.form.controls.actionData.setValue(found);

    if (!this.isDisable()) {
      this.doAction(this.logonBatch, this.logonBatchSuccess, this.logonBatchFailed);
    }
    // this.form.controls.componentStatus.setValue((this.form.value.componentStatus as Array<any>).map(cs => {
    //   if (cs.material === found.material) return {
    //     material: found.material,
    //     pos: found.pos,
    //     isReady: true
    //   };
    //   return cs;
    // }));
    // this.componentStatus$.next(this.form.value.componentStatus);
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
          return of([found, batch]);
        }
      }
      ));
  }


  //#endregion

  //#region Operation Reqeust
  requestOperationDataSuccess = (array: any[]) => {
    const [operation, componentStatus] = array;
    this.form.controls.operationData.setValue(operation);
    this.form.controls.componentStatus.setValue(componentStatus);
    this.componentStatus$.next(componentStatus);
  }

  requestOperationDataFailed = () => {
  }

  requestOperationData = (): Observable<any> => {
    return this._operationService.getOperation(this.form.value.operation).pipe(
      map(operation => {
        const componentStatus = [];
        operation.bomItems.forEach(item => {
          const machine = this.form.value.machineData as Machine;
          if (machine.componentsLoggedOn.find(c => c.material === item.material)) {
            // Material Find
            componentStatus.push({
              material: item.material,
              pos: item.pos,
              isReady: true
            });
          } else {
            componentStatus.push({
              material: item.material,
              pos: item.pos,
              isReady: false
            });
          }
        });
        this.descriptions.set(`operation`, operation.display);
        return [operation, componentStatus];
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
  protected isValid() {
    return !Array.from(this.descriptions.entries()).some(value => {
      return (value[0] !== `barCode` && !value[1]);
    });
  }

  protected afterReset() {
    this._document.getElementById(`batch`).focus();
  }

  //#endregion

  //#region Private methods

  //#endregion
}
