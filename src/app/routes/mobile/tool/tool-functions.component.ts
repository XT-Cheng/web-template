import { Component, Injector } from '@angular/core';
import { BaseExtendForm } from '../base.form.extend';

@Component({
  selector: 'fw-tool-functions',
  templateUrl: 'tool-functions.component.html',
  styleUrls: ['./tool-functions.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class ToolFunctionsComponent extends BaseExtendForm {
  //#region View Children

  //#endregion

  //#region Protected member

  protected key = `app.mobile.tool.functions`;

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
