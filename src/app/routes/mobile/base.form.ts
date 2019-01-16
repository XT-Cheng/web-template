import { ViewChild, ElementRef } from '@angular/core';
import { FormGroup, AbstractControl, FormBuilder, Validators, FormControl, ValidatorFn } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { TitleService, SettingsService } from '@delon/theme';
import { NzMessageService, NzSpinComponent } from 'ng-zorro-antd';
import { MaskComponent, ToastService, ToptipsService } from 'ngx-weui';
import { I18NService } from '@core/i18n/i18n.service';
import { IActionResult } from '@core/utils/helpers';

interface ITranError {
  context: any;
  error: string;
}

interface ITranSuccess {
  context: any;
}

export abstract class BaseForm {
  //#region Abstract property

  protected abstract key: string;

  //#endregion

  //#region View Children

  @ViewChild(MaskComponent) mask: MaskComponent;

  //#endregion

  //#region Protected member

  protected errors: ITranError[] = [];
  protected success: ITranSuccess[] = [];
  protected executionContext: any;

  //#endregion

  //#region Public members

  descriptions: Map<string, string> = new Map<string, string>();
  form: FormGroup;
  Inputing = (srcElement, controlName) => {
    if (controlName) {
      this.descriptions.set(controlName, '');
    }
  }

  //#endregion


  //#region Constructor

  constructor(fb: FormBuilder, private _settingService: SettingsService, protected _toastService: ToastService,
    private _routeService: Router, private _tipService: ToptipsService,
    protected _titleService: TitleService, private i18n: I18NService, protected _resetFormAfterSuccessExecution = true) {
    this.form = fb.group({});
    this._routeService.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this._titleService.setTitle(this.title);
      });
  }

  //#region Protected properties
  protected set storedData(data: any) {
    this._settingService.setApp(Object.assign(this._settingService.app, {
      [this.key]: data
    }));
  }

  protected get storedData(): any {
    return this._settingService.app[this.key];
  }

  //#endregion

  //#region Abstract methods

  //#endregion

  //#region Protected methods
  protected get title(): string {
    return this.i18n.fanyi(this.key);
  }

  protected afterReset() {
  }

  protected isValid() {
    return !Array.from(this.descriptions.entries()).some(value => {
      return (!value);
    });
  }
  //#endregion

  //#region Public methods
  request(handler: () => Observable<any>, success: (ret: any) => void, failed: (err: any) => void) {
    return (srcElement, nextElement, controlName) => {
      this.start();

      handler().subscribe((ret) => {
        this.end();
        this.beforeReqDataSuccess(ret, srcElement, nextElement, controlName);
        success(ret);
        this.afterReqDataSuccess(ret, srcElement, nextElement, controlName);
      },
        (err) => {
          this.end(err);
          this.beforeReqDataFailed(err, srcElement, nextElement, controlName);
          failed(err);
          this.afterReqDataFailed(err, srcElement, nextElement, controlName);
        });
    };
  }

  doAction(handler: () => Observable<IActionResult>, success: (ret: any) => void, failed: (err: any) => void) {
    this.start();

    handler().pipe(
      tap((ret: IActionResult) => {
        if (!ret.isSuccess) {
          throw Error(ret.description);
        }
      }
      )).subscribe((ret: IActionResult) => {
        this.end();
        this.genSuccess();
        this.beforeActionSuccess(ret);
        success(ret);
        this.afterActionSuccess(ret);
        if (this._resetFormAfterSuccessExecution) {
          this.resetForm();
        }
      }, (err) => {
        this.end(err);
        this.genErrors(err);
        this.beforeActionFailed(err);
        failed(err);
        this.afterActionFailed(err);
      });
  }

  getDescription(controlName: string) {
    return this.descriptions.get(controlName);
  }

  isDisable() {
    this.form.updateValueAndValidity();
    return !this.form.valid || !this.isValid();
  }

  resetForm() {
    this.form.reset();
    this.descriptions.forEach((value, key, map) => map.set(key, ``));

    this.afterReset();
  }

  //#endregion

  //#region Protected methods
  protected addControls(controlsToAdd: { [key: string]: Array<any> }) {
    Object.keys(controlsToAdd).forEach(controlName => {
      const value = controlsToAdd[controlName][0];
      const validator: ValidatorFn = controlsToAdd[controlName].length > 1 ? controlsToAdd[controlName][1] : null;
      const control = new FormControl(value, validator);
      this.form.addControl(controlName, control);
      this.descriptions.set(controlName, ``);
    });
  }

  protected stopEvent(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }

  protected showSuccess(message) {
    this._tipService.success(message, 2000);
  }

  protected showError(message) {
    this._tipService.warn(message, 5000);
  }

  //#endregion

  //#region Private methods
  private start() {
    this._tipService.destroyAll();
    this.form.disable();
    if (this.mask) {
      this.mask.show();
    }
    this._toastService.loading();
  }

  private end(err: any = null) {
    if (err) {
      this.showError(err);
    }

    setTimeout(_ => {
      if (this.mask) {
        this.mask.hide();
      }
    });
    this._toastService.hide();
    this.form.enable();
  }

  private beforeReqDataSuccess(data, source, next, controlName) {
  }

  private afterReqDataSuccess(data, source, next, controlName) {
    if (data && data.display && this.form.controls[controlName]) {
      this.descriptions.set(controlName, data.display);
    }
    if (next) {
      next.focus();
    }

    if (this.storedData) {
      this.storedData = Object.assign(this.storedData, this.form.value);
    } else {
      this.storedData = this.form.value;
    }
  }

  private beforeReqDataFailed(err, source, next, controlName) {

  }

  private afterReqDataFailed(err, source, next, controlName) {
    if (this.form.controls[controlName]) {
      this.form.controls[controlName].setValue(``);
      this.descriptions.set(controlName, ``);
    }
    if (source) {
      source.focus();
    }
  }

  private beforeActionSuccess(result: any) {
  }

  private afterActionSuccess(result: any) {
  }

  private beforeActionFailed(err) {
  }

  private afterActionFailed(err) {
  }

  private genSuccess() {
    if (this.success.length > 10) {
      this.success.pop();
    }

    this.success.unshift({
      context: this.form.value,
    });
  }

  private genErrors(err) {
    if (this.errors.length > 10) {
      this.errors.pop();
    }

    this.errors.push({
      context: this.form.value,
      error: err
    });
  }

  //#endregion
}
