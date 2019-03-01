import { Component, Injector } from '@angular/core';
import { BaseExtendForm } from '../base.form.extend';
import { Validators } from '@angular/forms';
import { MachineService } from '@core/hydra/service/machine.service';
import { MDEBapiService } from '@core/hydra/bapi/mde/bapi.service';
import { BehaviorSubject } from 'rxjs';
import { filter, map } from 'rxjs/operators';



@Component({
  selector: 'fw-machine-change-status',
  templateUrl: 'change-machine-status.component.html',
  styleUrls: ['./change-machine-status.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class ChangeMachineStatusComponent extends BaseExtendForm {
  private validStatus = [
    110, // Setup
    212, // 模具修理
    310, // 设备维修
    333, // 工艺调整
    335, // 设备保养
    340, // 品质异常
  ];

  //#region View Children

  //#endregion

  //#region Protected member
  protected key = `app.mobile.machine.changeStatus`;
  //#endregion

  //#region Public member

  availableStatus$: BehaviorSubject<{ status: number, text: string }[]> = new BehaviorSubject<[]>([]);

  //#endregion

  //#region Constructor

  constructor(injector: Injector, private _machineService: MachineService, private _bapiService: MDEBapiService,
  ) {
    super(injector);
    this.addControls({
      machine: [null, [Validators.required], 'machineData'],
      statusNbr: [null, [Validators.required]]
    });
  }

  //#endregion

  //#region Data Request

  //#region Machine Reqeust

  //#region Machine Reqeust

  requestMachineDataSuccess = (_) => {
    this._machineService.getAvailableStatusToChange(this.form.value.machine).pipe(
      map(allStatus => {
        return allStatus.filter(status => this.validStatus.includes(status.status) && this.machineData.currentStatusNr !== status.status);
      })
    ).subscribe(result => {
      this.availableStatus$.next(result);
    });
  }

  requestMachineDataFailed = () => {
  }

  requestMachineData = () => {
    return this._machineService.getMachine(this.form.value.machine);
  }

  //#endregion

  //#region Event Handler
  statusClicked(status) {
    if (!this.operatorData) {
      this.showError(`Please enter Badge`);
      return;
    }

    this.form.controls.statusNbr.setValue(status.status);
    this.doAction(this.changeStatus, this.changeStatusSuccess, this.changeStatusFailed);
  }
  //#endregion

  //#region Exeuction

  changeStatusSuccess = () => {
  }

  changeStatusFailed = () => {
  }

  changeStatus = () => {
    return this._bapiService.changeMachineStatus(this.machineData, this.form.value.statusNbr, this.operatorData);
  }

  //#endregion

  //#region Override methods

  protected afterReset() {
    this.document.getElementById(`machine`).focus();

    this.availableStatus$.next([]);
  }

  //#endregion

  //#region Private methods

  //#endregion
}
