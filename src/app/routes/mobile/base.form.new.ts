import { ViewChild, ElementRef } from '@angular/core';
import { FormGroup, AbstractControl, FormBuilder, Validators, FormControl, ValidatorFn } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { IBapiResult } from '@core/hydra/bapi/constants';
import { TitleService, SettingsService } from '@delon/theme';
import { NzMessageService, NzSpinComponent } from 'ng-zorro-antd';
import { MaskComponent, ToastService } from 'ngx-weui';

interface ITranError {
  context: any;
  error: string;
}

interface ITranSuccess {
  context: any;
  message: string;
}

export abstract class BaseNewForm {
  //#region Public members
  descriptions: Map<string, string> = new Map<string, string>();

  //#endregion

  //#region Constructor

  constructor(fb: FormBuilder, private _settingService: SettingsService, protected _toastService: ToastService,
    private _routeService: Router, private _messageService: NzMessageService,
    protected _titleService: TitleService, protected _resetFormAfterSuccessExecution = true) {
    this.form = fb.group({
      preModel: [null],
    });
    this._routeService.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this._titleService.setTitle(this.title);
      });
  }

  //#region Abstract property
  protected abstract key: string;
  protected abstract get title(): string;

  //#endregion

  //#region View Children

  @ViewChild(MaskComponent) mask: MaskComponent;

  //#endregion

  //#region Protected member

  protected form: FormGroup;
  protected errors: ITranError[] = [];
  protected success: ITranSuccess[] = [];
  protected executionContext: any;

  //#endregion

  //#region Protected properties
  set storedData(data: any) {
    this._settingService.setApp(Object.assign(this._settingService.app, {
      [this.key]: data
    }));
  }

  get storedData(): any {
    return this._settingService.app[this.key];
  }

  //#endregion

  //#region Abstract methods

  //#endregion

  //#region Protected methods
  protected afterReset() {

  }

  protected resetForm() {
    this.form.reset();
    this.descriptions.clear();

    this.afterReset();
  }

  protected isValid() {
    return !Array.from(this.descriptions.entries()).some(value => {
      return (!value);
    });
  }
  //#endregion

  //#region Public methods

  getDescription(controlName: string) {
    return this.descriptions.get(controlName);
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

  protected Inputing = (srcElement, controlName) => {
    if (controlName) {
      this.descriptions.set(controlName, '');
    }
  }

  protected request(handler: () => Observable<any>, success: (ret: any) => void, failed: (err: any) => void) {
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

  protected doAction(handler: () => Observable<IBapiResult>, success: (ret: any) => void, failed: (err: any) => void) {
    this.start();

    handler().pipe(
      tap((ret: IBapiResult) => {
        if (!ret.isSuccess) {
          throw Error(ret.description);
        }
      }
      )).subscribe((ret) => {
        success(ret);
        this.end();
        if (this._resetFormAfterSuccessExecution) {
          this.resetForm();
        }
        this.genSuccess(`success`);
      }, (err) => {
        failed(err);
        this.end(err);
        this.genErrors(err);
      });
  }

  protected isDisable() {
    this.form.updateValueAndValidity();
    return !this.form.valid || !this.isValid();
  }

  //#endregion

  //#region Private methods
  private start() {
    this.form.disable();
    if (this.mask) {
      this.mask.show();
    }
    this._toastService.loading();
  }

  private end(err: any = null) {
    if (err) {
      this._messageService.error(err);
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

    this.storedData = Object.assign(this.form.value, { preModel: null });
    this.form.controls.preModel.setValue(this.storedData);
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

  private genSuccess(success) {
    if (this.executionContext) {
      if (this.success.length > 10) {
        this.success.pop();
      }

      this.success.unshift({
        context: this.executionContext,
        message: success
      });
    }
  }

  private genErrors(err) {
    if (this.executionContext) {
      if (this.errors.length > 10) {
        this.errors.pop();
      }

      this.errors.push({
        context: this.executionContext,
        error: err
      });
    }
  }

  //#endregion
}
