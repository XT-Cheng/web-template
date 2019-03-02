import { Component, Injector } from '@angular/core';
import { BaseExtendForm } from '../base.form.extend';

@Component({
  selector: 'fw-machine-functions',
  templateUrl: 'machine-functions.component.html',
  styleUrls: ['./machine-functions.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class MachineFunctionsComponent extends BaseExtendForm {
  //#region View Children

  //#endregion

  //#region Protected member

  protected key = `app.mobile.machine.functions`;

  //#endregion

  //#region Public member

  //#endregion

  //#region Public member

  //#endregion

  //#region Constructor

  constructor(
    injector: Injector,
  ) {
    super(injector);
  }

  //#endregion

  //#region Public methods

  //#endregion

  //#region Protected methods

  //#endregion

  //#region Event Handler

  //#endregion

  //#region Exeuction

  //#endregion

  //#region Override methods

  //#endregion

  //#region Private methods

  //#endregion
}
