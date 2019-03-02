import { Component, Injector } from '@angular/core';
import { BaseExtendForm } from '../base.form.extend';

@Component({
  selector: 'fw-operation-functions',
  templateUrl: 'operation-functions.component.html',
  styleUrls: ['./operation-functions.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class OperationFunctionsComponent extends BaseExtendForm {
  //#region View Children

  //#endregion

  //#region Protected member

  protected key = `app.mobile.operation.functions`;

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
