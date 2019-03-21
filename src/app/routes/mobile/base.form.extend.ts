import { ViewChild, Injector, OnDestroy, HostListener } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter, tap, map } from 'rxjs/operators';
import { Observable, of, Subscription } from 'rxjs';
import { TitleService, SettingsService } from '@delon/theme';
import { MaskComponent, ToastService, ToptipsService, PopupComponent, DialogComponent, DialogConfig } from 'ngx-weui';
import { I18NService } from '@core/i18n/i18n.service';
import { IActionResult } from '@core/utils/helpers';
import { OperatorService } from '@core/hydra/service/operator.service';
import { Operator } from '@core/hydra/entity/operator';
import { Operation, ComponentLoggedOn, ToolStatus, ComponentStatus } from '@core/hydra/entity/operation';
import { DOCUMENT } from '@angular/common';
import { Machine } from '@core/hydra/entity/machine';
import { MaterialBatch } from '@core/hydra/entity/batch';
import { Tool } from '@core/hydra/entity/tool';
import { toNumber } from '@delon/util';
import { MachineService } from '@core/hydra/service/machine.service';


interface ITranError {
  context: any;
  error: string;
}

interface ITranSuccess {
  context: any;
}

export abstract class BaseExtendForm implements OnDestroy {
  static SETUP_OPERATOR: string;
  static DIALOG_CONFIG = <DialogConfig>{
    title: '弹窗标题',
    cancel: '辅助操作',
    confirm: '主操作',
  };

  //#region Abstract member
  protected abstract key: string;

  //#endregion

  //#region View Children

  @ViewChild(MaskComponent) mask: MaskComponent;

  @ViewChild(`componentStatus`) componentStatusPopup: PopupComponent;
  @ViewChild(`toolStatus`) toolStatusPopup: PopupComponent;
  @ViewChild(`operationList`) operationListPopup: PopupComponent;
  @ViewChild('dialog') dialog: DialogComponent;

  //#endregion

  //#region Protected member

  protected associatedControl: Map<string, string> = new Map<string, string>();

  protected fb: FormBuilder;
  protected settingService: SettingsService;
  protected toastService: ToastService;
  protected routeService: Router;
  protected tipService: ToptipsService;
  protected titleService: TitleService;
  protected i18n: I18NService;
  protected operatorService: OperatorService;
  protected document: Document;

  protected errors: ITranError[] = [];
  protected success: ITranSuccess[] = [];
  protected executionContext: any;

  protected machineService: MachineService;

  //#endregion

  //#region Private member

  private routerSubcription: Subscription;

  //#endregion

  //#region Public members
  form: FormGroup;
  dialogConfig: DialogConfig = new DialogConfig();
  showBadgeButton = true;
  badgeButtonText: string;

  Inputing = (srcElement, controlName) => {
    if (controlName && this.associatedControl.has(controlName)) {
      this.form.controls[this.associatedControl.get(controlName)].setValue(null);
    }
  }

  //#endregion


  //#region Constructor

  constructor(private injector: Injector, protected resetFormAfterSuccessExecution = true, protected isBadgeRequired = true) {

    // Setup Services
    this.fb = this.injector.get(FormBuilder);
    this.settingService = this.injector.get(SettingsService);
    this.toastService = this.injector.get(ToastService);
    this.routeService = this.injector.get(Router);
    this.tipService = this.injector.get(ToptipsService);
    this.titleService = this.injector.get(TitleService);
    this.i18n = this.injector.get(I18NService);
    this.operatorService = this.injector.get(OperatorService);
    this.document = this.injector.get(DOCUMENT);

    this.machineService = this.injector.get(MachineService);

    // Setup Dialog Config
    this.dialogConfig.title = this.i18n.fanyi(`app.mobile.dialog.title`);
    this.dialogConfig.cancel = this.i18n.fanyi(`app.mobile.dialog.no`);
    this.dialogConfig.confirm = this.i18n.fanyi(`app.mobile.dialog.yes`);
    this.dialogConfig.skin = 'auto';

    BaseExtendForm.SETUP_OPERATOR = this.i18n.fanyi(`app.mobile.common.setupOperator`);
    this.badgeButtonText = BaseExtendForm.SETUP_OPERATOR;
    if (isBadgeRequired) {
      this.form = this.fb.group({
        badge: [null, [Validators.required]],
        badgeData: [null, [Validators.required]],
      });
    } else {
      this.form = this.fb.group({
        badge: [null, []],
        badgeData: [null, []],
      });
    }
    this.associatedControl.set(`badge`, `badgeData`);
    this.routerSubcription = this.routeService.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.titleService.setTitle(this.title);

        let operator: Operator = null;
        if (this.storedData && this.storedData.badgeData) {
          operator = new Operator();
          operator.badge = this.storedData.badgeData.badge;
          operator.firstName = this.storedData.badgeData.firstName;
          operator.lastName = this.storedData.badgeData.lastName;
        }

        this.form.patchValue(Object.assign(this.form.value, {
          badge: operator ? operator.badge : ``,
          badgeData: operator,
        }));

        this.badgeButtonText = operator ? operator.display : BaseExtendForm.SETUP_OPERATOR;

        if (this.rememberMachine && this.form.controls.machine) {
          if (this.storedData
            && this.storedData.machineData
            && this['requestMachineData']
            && this['requestMachineDataSuccess']
            && this['requestMachineDataFailed']) {
            this.form.controls.machine.setValue(this.storedData.machineData.machineName);
            this.request(this['requestMachineData'], this['requestMachineDataSuccess'], this['requestMachineDataFailed'])
              (null, null, `machine`);
          }
        }

        this.init();
      });
  }

  //#region Public properties

  get upperLevel(): string {
    return ``;
  }

  //#endregion

  //#region Protected properties
  protected set storedData(data: any) {
    this.settingService.setApp(Object.assign(this.settingService.app, {
      [this.key]: data
    }));
  }

  protected get title(): string {
    return this.i18n.fanyi(this.key);
  }

  protected get storedData(): any {
    return this.settingService.app[this.key];
  }

  protected get machineData(): Machine {
    return this.form.value.machineData as Machine;
  }

  protected get toolData(): Tool {
    return this.form.value.toolData as Tool;
  }

  protected get operationData(): Operation {
    return this.form.value.operationData as Operation;
  }

  protected get batchData(): MaterialBatch {
    return this.form.value.batchData as MaterialBatch;
  }

  protected get operatorData(): Operator {
    return this.form.value.badgeData as Operator;
  }

  protected get rememberMachine(): boolean {
    return true;
  }

  //#endregion

  //#region Abstract methods

  //#endregion

  //#region Protected methods

  protected afterReset() {
  }

  protected isValid() {
    return true;
  }

  protected init() {
  }

  //#endregion

  //#region Public methods
  request(handler: () => Observable<any>, success: (ret: any) => void, failed: (err: any) => void) {
    return (srcElement, nextElement, controlName) => {
      this.start();

      handler().subscribe((ret) => {
        this.end();
        this.beforeReqDataSuccess(ret, controlName);
        success(ret);
        this.afterReqDataSuccess(nextElement);
      },
        (err) => {
          this.end(err);
          this.beforeReqDataFailed(controlName);
          failed(err);
          this.afterReqDataFailed(srcElement);
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
        if (this.resetFormAfterSuccessExecution) {
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

  getAssociateDataDisplay(controlName: string, propertyName: string = 'display') {
    if (!this.associatedControl.has(controlName)) return ' ';

    const data = this.form.value[this.associatedControl.get(controlName)];

    if (!data) return '';

    return data[propertyName];
  }

  isDisable() {
    this.form.updateValueAndValidity();
    return !this.form.valid || !this.isValid();
  }

  resetForm() {
    this.form.reset();

    let operator = null;
    if (this.storedData && this.storedData.badgeData) {
      operator = new Operator();
      operator.badge = this.storedData.badgeData.badge;
      operator.firstName = this.storedData.badgeData.firstName;
      operator.lastName = this.storedData.badgeData.lastName;
    }

    this.form.patchValue(Object.assign(this.form.value, {
      badge: operator ? operator.badge : ``,
      badgeData: operator,
    }));
    this.afterReset();
  }

  showComponentStatus(focusId = ``) {
    if (this.componentStatusPopup) {
      this.componentStatusPopup.config = Object.assign({}, this.componentStatusPopup.config, {
        cancel: this.i18n.fanyi(`app.common.cancel`),
        confirm: this.i18n.fanyi(`app.common.confirm`),
      });
      this.componentStatusPopup.show().subscribe(() => {
        if (!focusId) return;
        const element = this.document.getElementById(focusId);
        if (element) {
          element.focus();
        }
      });
    }
  }

  showToolStatus(focusId = ``) {
    if (this.toolStatusPopup) {
      this.toolStatusPopup.config = Object.assign({}, this.toolStatusPopup.config, {
        cancel: this.i18n.fanyi(`app.common.cancel`),
        confirm: this.i18n.fanyi(`app.common.confirm`),
      });
      this.toolStatusPopup.show().subscribe(() => {
        if (!focusId) return;
        const element = this.document.getElementById(focusId);
        if (element) {
          element.focus();
        }
      });
    }
  }

  showOperationList(focusId = ``) {
    if (this.operationListPopup) {
      this.operationListPopup.config = Object.assign({}, this.operationListPopup.config, {
        cancel: this.i18n.fanyi(`app.common.cancel`),
        confirm: this.i18n.fanyi(`app.common.confirm`),
      });
      this.operationListPopup.show().subscribe(() => {
        if (!focusId) return;
        const element = this.document.getElementById(focusId);
        if (element) {
          element.focus();
        }
      });
    }
  }

  showDialog(content: string): Observable<boolean> {
    if (this.dialog) {
      this.dialog.config = Object.assign({}, this.dialogConfig, {
        content: content
      });
      return this.dialog.show().pipe(
        map(ret => {
          return ret.value;
        }));
    }

    return of(false);
  }

  getOperationToolStatusDisplay(toolStatus: ToolStatus[]) {
    if (this.machineData && this.operationData && toolStatus.length > 0) {
      let ready = 0;
      let missed = 0;
      toolStatus.map(status => {
        if (status.isReady) {
          ready++;
        } else {
          missed++;
        }
      });

      return {
        total: ready + missed,
        ready: ready,
        missed: missed
      };
    }

    return null;
  }

  getOperationComponentStatusDisplay(componentStatus: ComponentStatus[]) {
    if (this.machineData && this.operationData && componentStatus.length > 0) {
      let ready = 0;
      let missed = 0;
      componentStatus.map(status => {
        if (status.isReady) {
          ready++;
        } else {
          missed++;
        }
      });

      return {
        total: ready + missed,
        ready: ready,
        missed: missed
      };
    }

    return null;
  }

  getCurrentOperationDisplay() {
    if (this.machineData && this.operationData) {
      const operation = this.form.value.operationData as Operation;
      let title = ``;
      if (operation.leadOrder) {
        title = `${operation.leadOrder} / ${operation.order}`;
        // title = `${operation.leadOrder}`;
      } else {
        title = `${operation.order}`;
      }

      return {
        title: title,
        description: `${operation.display}`
      };
    }

    return null;
  }

  getStyle(value) {
    const missed = toNumber(value, 0);
    return missed === 0 ? { 'color': 'green' } : { 'color': 'red' };
  }

  hasMachineData() {
    return (!!this.form.value.machineData);
  }

  hasOperationData() {
    return (!!this.form.value.operationData);
  }

  hasBatchData() {
    return (!!this.form.value.batchData);
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
      this.badgeButtonText = BaseExtendForm.SETUP_OPERATOR;
    }
  }

  requestBadgeDataFailed = () => {
  }

  requestBadgeData = () => {
    if (!this.form.value.badge) {
      return of(null);
    }

    return this.operatorService.getOperatorByBadge(this.form.value.badge).pipe(
      tap(operator => {
        if (!operator) {
          throw Error(`${this.form.value.badge} not exist!`);
        }
      }));
  }

  //#endregion

  //#endregion

  //#region Protected methods
  // controlsToAdd :
  // controlName: [initValue, [Validators], associatedDataControlName]
  // barCode: [null, [Validators.required], `batchData`]
  protected addControls(controlsToAdd: { [key: string]: Array<any> }) {
    Object.keys(controlsToAdd).forEach(controlName => {
      const value = controlsToAdd[controlName][0];
      const validator = controlsToAdd[controlName].length > 1 ? controlsToAdd[controlName][1] : null;
      const associatedDataControlName = controlsToAdd[controlName][2];
      this.form.addControl(controlName, new FormControl(value, validator));
      if (associatedDataControlName) {
        this.form.addControl(associatedDataControlName, new FormControl(null, [Validators.required]));
        this.associatedControl.set(controlName, associatedDataControlName);
      }
    });
  }

  protected stopEvent(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }

  protected showSuccess(message) {
    this.tipService.success(message, 2000);
  }

  protected showError(message) {
    this.tipService.warn(message, 5000);
  }

  //#endregion

  //#region Private methods
  private start() {
    this.tipService.destroyAll();
    this.form.disable({ emitEvent: false });
    if (this.mask) {
      this.mask.show();
    }
    this.toastService.loading();
  }

  private end(err: any = null) {
    if (err && err.message) {
      this.showError(err.message);
    } else if (typeof (err) === 'string') {
      this.showError(err);
    }

    setTimeout(_ => {
      if (this.mask) {
        this.mask.hide();
      }
    });
    this.toastService.hide();
    this.form.enable({ emitEvent: false });
  }

  private beforeReqDataSuccess(data, controlName) {
    if (controlName && this.associatedControl.has(controlName)) {
      this.form.controls[this.associatedControl.get(controlName)].setValue(data);
    }

    if (this.storedData) {
      this.storedData = Object.assign(this.storedData, this.form.value);
    } else {
      this.storedData = this.form.value;
    }
  }

  private afterReqDataSuccess(next) {
    if (next) {
      setTimeout(() => next.focus(), 0);
    }
  }

  private beforeReqDataFailed(controlName) {
    if (this.form.controls[controlName]) {
      this.form.controls[controlName].setValue(``);
      if (this.associatedControl.has(controlName)) {
        this.form.controls[this.associatedControl.get(controlName)].setValue(null);
      }
    }
  }

  private afterReqDataFailed(source) {
    if (source) {
      source.focus();
    }
  }

  private beforeActionSuccess(result: IActionResult) {
  }

  private afterActionSuccess(ret: IActionResult) {
    if (ret.description) {
      this.showSuccess(ret.description);
    }
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

  //#region Implemented Interface

  ngOnDestroy(): void {
    this.deleteMachineUsed();

    this.routerSubcription.unsubscribe();
  }

  @HostListener('window:beforeunload')
  deleteMachineUsed() {
    if (this.storedData
      && this.storedData.machine) {
      this.machineService.deleteMachineUsed(this.storedData.machine).subscribe();
    }
  }

  //#endregion
}
