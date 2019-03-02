import { Component, Injector } from '@angular/core';
import { BaseExtendForm } from '../base.form.extend';

@Component({
  selector: 'fw-material-functions',
  templateUrl: 'material-functions.component.html',
  styleUrls: ['./material-functions.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class MaterialFunctionsComponent extends BaseExtendForm {
  //#region View Children

  //#endregion

  //#region Protected member

  protected key = `app.mobile.material.functions`;

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
