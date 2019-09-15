import { Component, Injector, ViewChild } from '@angular/core';
import { Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { Machine } from '@core/hydra/entity/machine';
import { OperatorLoggedOn } from '@core/hydra/entity/operation';
import { map, tap } from 'rxjs/operators';
import { BaseExtendForm } from '../base.form.extend';
import { PopupComponent } from 'ngx-weui';
import { MachineWebApi } from '@core/webapi/machine.webapi';
import { OperatorWebApi } from '@core/webapi/operator.webapi';

@Component({
  selector: 'fw-operator-logoff',
  templateUrl: 'logoff-operator.component.html',
  styleUrls: ['./logoff-operator.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class LogoffOperatorComponent extends BaseExtendForm {
  //#region View Children

  @ViewChild(`operatorList`) operatorListPopup: PopupComponent;

  //#endregion

  //#region Protected member
  protected key = `app.mobile.operator.logoff`;
  //#endregion

  //#region Public member

  operatorsLoggedOn$: BehaviorSubject<OperatorLoggedOn[]> = new BehaviorSubject<[]>([]);

  //#endregion

  //#region Public member

  //#endregion

  //#region Constructor

  constructor(
    injector: Injector,
    private _machineWebApi: MachineWebApi,
    private _operatorWebApi: OperatorWebApi,
  ) {
    super(injector, false, false);
    this.addControls({
      machine: [null, [Validators.required], 'machineData'],
      operator: [null, [Validators.required], 'operatorData'],
    });
  }

  //#endregion

  //#region Public methods
  getCurrentLoggedOnOperatorDisplay() {
    if (this.machineData) {
      return {
        total: this.machineData.operatorsLoggedOn.length,
      };
    }

    return null;
  }

  showOperatorList(focusId = ``) {
    if (this.operatorListPopup) {
      this.operatorListPopup.config = Object.assign({}, this.operatorListPopup.config, {
        cancel: this.i18n.fanyi(`app.common.cancel`),
        confirm: this.i18n.fanyi(`app.common.confirm`),
      });
      this.operatorListPopup.show().subscribe(() => {
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
    this.form.controls.operator.setValue(``);
    this.form.controls.operatorData.setValue(null);

    this.operatorsLoggedOn$.next(machine.operatorsLoggedOn);
    setTimeout(() => {
      this.document.getElementById('operator').focus();
    }, 0);
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

  //#region Operator Reqeust
  requestOperatorDataSuccess = (_) => {
    if (!this.isDisable()) {
      this.doAction(this.logoffOperator, this.logoffOperatorSuccess, this.logoffOperatorFailed);
    }
  }

  requestOperatorDataFailed = () => {
  }

  requestOperatorData = () => {
    return this._operatorWebApi.getOperatorByBadge(this.form.value.operator).pipe(
      map(operator => {
        if (!this.operatorsLoggedOn$.value.find(op => op.badge === operator.badge)) {
          throw Error(`Badge Id not logged on`);
        }

        return operator;
      }));
  }

  //#endregion

  //#endregion

  //#region Protected methods

  //#endregion

  //#region Event Handler

  //#endregion

  //#region Exeuction
  logoffOperatorSuccess = () => {
    this.form.controls.operator.setValue(``);
    this.form.controls.operatorData.setValue(null);

    this.request(this.requestMachineData, this.requestMachineDataSuccess, this.requestMachineDataFailed)
      (null, null, `machine`);
  }

  logoffOperatorFailed = () => {
  }

  logoffOperator = () => {
    // LogOff Operator
    return this._operatorWebApi.logoffOperator(this.machineData.machineName, this.form.value.operator).pipe(
      map((_) => {
        return {
          isSuccess: true,
          description: `Opeartor ${this.form.value.operator} Logged Off!`,
        };
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
    return `/operator/list`;
  }

  //#endregion

  //#region Private methods

  //#endregion
}
