import { Component, Injector } from '@angular/core';
import { BaseExtendForm } from '../base.form.extend';
import { Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { MachineWebApi } from '@core/webapi/machine.webapi';

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
    399, // 无工单
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

  constructor(injector: Injector, private _machineWebApi: MachineWebApi
  ) {
    super(injector, false);
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
    this._machineWebApi.getAvailableStatusToChange(this.form.value.machine).pipe(
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
    return this._machineWebApi.getMachineLightWeight(this.form.value.machine).pipe(
      tap(machine => {
        if (!machine) {
          throw Error('Machine invalid');
        }
      })
    );
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
    this.request(this.requestMachineData, this.requestMachineDataSuccess, this.requestMachineDataFailed)
      (null, null, `machine`);
  }

  changeStatusFailed = () => {
  }

  changeStatus = () => {
    return this._machineWebApi.changeMachineStatus({
      MachineName: this.machineData.machineName,
      NewStatus: this.form.value.statusNbr,
      Badge: this.operatorData.badge
    }).pipe(
      map(_ => {
        return {
          isSuccess: true,
          description: `Machine ${this.machineData.machineName} Status Changed!`,
        }
      })
    )
  }

  //#endregion

  //#region Override methods

  protected afterReset() {
    this.document.getElementById(`machine`).focus();

    this.availableStatus$.next([]);
  }

  //#endregion

  //#region Override properties

  get upperLevel(): string {
    return `/machine/list`;
  }

  //#endregion

  //#region Private methods

  //#endregion
}
