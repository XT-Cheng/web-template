import { ViewChild, ElementRef } from '@angular/core';
import { FormGroup, AbstractControl, FormBuilder, Validators, FormControl, ValidatorFn } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { TitleService, SettingsService } from '@delon/theme';
import { NzMessageService, NzSpinComponent } from 'ng-zorro-antd';
import { MaskComponent, ToastService, ToptipsService } from 'ngx-weui';
import { I18NService } from '@core/i18n/i18n.service';
import { IActionResult } from '@core/utils/helpers';
import { OperatorService } from '@core/hydra/service/operator.service';
import { Operator } from '@core/hydra/entity/operator';

interface ITranError {
  context: any;
  error: string;
}

interface ITranSuccess {
  context: any;
}

export abstract class BaseForm {
  static SETUP_OPERATOR: string;

  //#region Abstract member
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
  showBadgeButton = true;
  badgeButtonText: string;
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
    protected _titleService: TitleService, private i18n: I18NService, protected _operatorService: OperatorService,
    protected _resetFormAfterSuccessExecution = true) {
    BaseForm.SETUP_OPERATOR = i18n.fanyi(`app.mobile.common.setupOperator`);
    this.badgeButtonText = BaseForm.SETUP_OPERATOR;
    this.form = fb.group({
      badge: [null, [Validators.required]],
      badgeData: [null, [Validators.required]],
    });
    this.descriptions.set(`badge`, ``);
    this._routeService.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this._titleService.setTitle(this.title);

        let operator = null;
        if (this.storedData && this.storedData.badgeData) {
          operator = new Operator();
          operator.badge = this.storedData.badgeData.badge;
          operator.firstName = this.storedData.badgeData.firstName;
          operator.lastName = this.storedData.badgeData.lastName;
        }

        this.form.setValue(Object.assign(this.form.value, {
          badge: operator ? operator.badge : ``,
          badgeData: operator,
        }));

        this.badgeButtonText = operator ? operator.display : BaseForm.SETUP_OPERATOR;
        this.descriptions.set(`badge`, operator ? operator.display : ``);
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
      return (value[0] !== `badgeData` && !value[1]);
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
    this.descriptions.forEach((value, key, map) => {
      if (key !== `badge`) {
        map.set(key, ``);
      }
    });

    let operator = null;
    if (this.storedData && this.storedData.badgeData) {
      operator = new Operator();
      operator.badge = this.storedData.badgeData.badge;
      operator.firstName = this.storedData.badgeData.firstName;
      operator.lastName = this.storedData.badgeData.lastName;
    }

    this.form.setValue(Object.assign(this.form.value, {
      badge: operator ? operator.badge : ``,
      badgeData: operator,
    }));
    this.afterReset();
  }

  //#region Badge related
  getBadgeButtonType() {
    if (this.form.controls.badge.value) {
      return `primary`;
    }

    return `warn`;
  }

  setupOperator() {
    this.showBadgeButton = false;
  }

  requestBadgeDataSuccess = (ret: Operator) => {
    this.showBadgeButton = true;
    if (ret) {
      this.form.controls.badge.setValue(ret.badge);
      this.form.controls.badgeData.setValue(ret);
      this.badgeButtonText = ret.display;
    } else {
      this.form.controls.badge.setValue(``);
      this.form.controls.badgeData.setValue(null);
      this.badgeButtonText = BaseForm.SETUP_OPERATOR;
    }
  }

  requestBadgeDataFailed = () => {
  }

  requestBadgeData = () => {
    if (!this.form.value.badge) {
      return of(null);
    }

    return this._operatorService.getOperatorByBadge(this.form.value.badge).pipe(
      tap(operator => {
        if (!operator) {
          throw Error(`${this.form.value.badge} not exist!`);
        }
      }));
  }

  //#endregion

  //#endregion

  //#region Protected methods
  protected addControls(controlsToAdd: { [key: string]: Array<any> }) {
    Object.keys(controlsToAdd).forEach(controlName => {
      const value = controlsToAdd[controlName][0];
      const validator: ValidatorFn = controlsToAdd[controlName].length > 1 ? controlsToAdd[controlName][1] : null;
      const control = new FormControl(value, validator);
      this.form.addControl(controlName, control);

      this.descriptions.set(controlName, ``);
      if (controlsToAdd[controlName].length > 2 && controlsToAdd[controlName][2]) {
        this.descriptions.delete(controlName);
      }
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
