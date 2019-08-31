import { Component, Injector, ViewChild, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { of, BehaviorSubject } from 'rxjs';
import { BaseExtendForm } from '../base.form.extend';
import { PopupComponent } from 'ngx-weui';
import { PrinterWebApi } from '@core/webapi/printer.webapi';
import { Printer } from '@core/hydra/entity/printer';

@Component({
  selector: 'fw-setup-printer',
  templateUrl: 'setup-printer.component.html',
  styleUrls: ['./setup-printer.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class SetupPrinterComponent extends BaseExtendForm implements OnInit {
  //#region View Children

  @ViewChild(`printerList`) printerListPopup: PopupComponent;

  //#endregion

  //#region Protected member

  protected key = `app.mobile.setup.printer`;

  //#endregion

  //#region Public member

  printers$: BehaviorSubject<Printer[]> = new BehaviorSubject<[]>([]);

  //#endregion

  //#region Constructor

  constructor(
    injector: Injector,
    private _printerWebApi: PrinterWebApi
  ) {
    super(injector, false, false);
    this.addControls({
      printerSelected: [null, [Validators.required]],
    });
  }

  //#endregion

  //#region Public properties

  get selected() {
    if (this.form.value.printerSelected) {
      return this.form.value.printerSelected;
    } else if (this.printers$.value.length > 0) {
      return this.printers$.value[0].name;
    } else {
      return ``;
    }
  }

  //#endregion

  //#region Data Request

  //#endregion

  //#region Protected methods

  //#endregion

  //#region Event Handler

  showPrinterList() {
    this.printerListPopup.config = Object.assign({}, this.printerListPopup.config, {
      cancel: this.i18n.fanyi(`app.common.cancel`),
      confirm: this.i18n.fanyi(`app.common.confirm`),
    });
    this.printerListPopup.show();
  }

  printerSelected(printerName) {
    this.printerListPopup.close();

    this.form.controls.printerSelected.setValue(printerName);
  }

  //#endregion

  //#region Exeuction
  setupPrinterSuccess = () => {
  }

  setupPrinterFailed = () => {
  }

  setupPrinter = () => {
    this.printer = this.form.value.printerSelected;

    return of({
      isSuccess: true,
      description: `Printer ${this.printer} has been setup!`,
    });
  }

  //#endregion

  //#region Implement interface

  ngOnInit(): void {
    this.form.controls.printerSelected.setValue(this.printer);

    this._printerWebApi.getPrinters().subscribe(printers => this.printers$.next(printers));
  }

  //#endregion

  //#region Override methods

  //#endregion

  //#region Override properties

  get upperLevel(): string {
    return `/setup/list`;
  }

  //#endregion

  //#region Private methods

  //#endregion
}
