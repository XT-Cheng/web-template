import { ViewChild, ElementRef } from '@angular/core';
import { NgForm } from '@angular/forms';
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

export abstract class BaseForm {

  //#endregion

  //#region Constructor

  constructor(private _settingService: SettingsService, protected _toastService: ToastService,
    private _routeService: Router, private _messageService: NzMessageService,
    protected _titleService: TitleService, protected _resetFormAfterSuccessExecution = true) {
    this._routeService.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this._titleService.setTitle(this.title);
      });
  }

  //#region Abstract property

  protected abstract title: string;

  //#endregion

  //#region View Children

  @ViewChild('f') form: NgForm;
  @ViewChild('execute', { read: ElementRef }) buttonElem: ElementRef;
  @ViewChild(MaskComponent) mask: MaskComponent;

  //#endregion

  //#region Protected member
  protected modelData: any;
  protected errors: ITranError[] = [];
  protected success: ITranSuccess[] = [];
  protected executionContext: any;
  protected isInputing = false;
  protected Inputing = () => {
    this.isInputing = true;
  }

  //#endregion

  //#region Abstrace methods

  protected abstract resetForm();
  protected abstract isValid();

  //#endregion

  //#region Protected methods
  protected get storedModel(): any {
    return this._settingService.app[this.title];
  }
  //#endregion

  //#region Protected methods

  protected stopEvent(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }

  protected start() {
    this.form.form.disable();
    this.isInputing = true;
    this.mask.show();
    this._toastService.loading();
  }

  protected end(err: any = null) {
    if (err) {
      this._messageService.error(err);
    }

    this._settingService.setApp(Object.assign(this._settingService.app, {
      [this.title]: this.modelData
    }));

    this.isInputing = false;
    setTimeout(_ => this.mask.hide());
    this._toastService.hide();
    this.form.form.enable();
  }

  protected request(handler: () => Observable<any>, success: (ret: any) => void, failed: (err: any) => void) {
    return () => {
      this.start();

      handler().subscribe((ret) => {
        this.end();
        success(ret);
      },
        (err) => {
          this.end(err);
          failed(err);
        });
    };
  }

  protected doAction(handler: () => Observable<IBapiResult>, success: (ret: any) => void, failed: (err: any) => void) {
    if (this.isInputing) {
      return;
    }

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
    return !this.form.valid || this.isInputing || !this.isValid();
  }

  //#endregion

  //#region Private methods

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

    this._settingService.setApp(Object.assign(this._settingService.app, {
      [this.title]: this.modelData
    }));
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
