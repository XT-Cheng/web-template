import { Component, Inject, AfterViewInit } from '@angular/core';
import { BaseForm } from '../base.form';
import { FormBuilder } from '@angular/forms';
import { ToastService, ToptipsService } from 'ngx-weui';
import { Router } from '@angular/router';
import { TitleService, SettingsService, ALAIN_I18N_TOKEN } from '@delon/theme';
import { BatchService } from '@core/hydra/service/batch.service';
import { OperatorService } from '@core/hydra/service/operator.service';
import { I18NService } from '@core/i18n/i18n.service';
import { of, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { MaterialBatch } from '@core/hydra/entity/batch';

@Component({
  selector: 'fw-batch-find',
  templateUrl: 'find-batch.component.html',
  styleUrls: ['./find-batch.component.scss']
})
export class FindBatchComponent extends BaseForm {
  //#region View Children

  //#endregion

  //#region Protected member

  protected key = `app.mobile.material.find`;

  //#endregion

  //#region Private member

  //#endregion

  //#region Public member
  batches$: BehaviorSubject<MaterialBatch[]> = new BehaviorSubject<MaterialBatch[]>([]);

  searchMaterial = (material: string) => {
    if (material) {
      return this._batchService.searchBatchMaterial(material);
    } else {
      return of([]);
    }
  }

  searchBuffer = (bufferName: string) => {
    if (bufferName) {
      return this._batchService.searchBatchBuffer(bufferName);
    } else {
      return of([]);
    }
  }

  //#endregion

  //#region Constructor

  constructor(
    fb: FormBuilder,
    _toastService: ToastService,
    _routeService: Router,
    _tipService: ToptipsService,
    _titleService: TitleService,
    _settingService: SettingsService,
    private _batchService: BatchService,
    _operatorService: OperatorService,
    @Inject(ALAIN_I18N_TOKEN) _i18n: I18NService,
  ) {
    super(fb, _settingService, _toastService, _routeService, _tipService, _titleService, _i18n, _operatorService);
    this.addControls({
      material: [null, []],
      materialBuffer: [null, []],
    });
  }

  //#endregion

  //#region Public methods

  //#endregion

  //#region Event Handler

  //#endregion

  //#region Data Request

  //#endregion

  //#region Exeuction
  searchBatch = () => {
    return this._batchService.searchBatch(
      this.form.value.material, this.form.value.materialBuffer
    ).pipe(
      map(ret => {
        this.batches$.next(ret);
        return {
          isSuccess: true,
        };
      })
    );
  }

  searchBatchSuccess = () => {
  }

  searchBatchFailed = () => {
  }

  //#endregion

  //#region Override methods
  protected isValid() {
    return (this.form.value.material || this.form.value.materialBuffer);
  }

  //#endregion

  //#region Portected methods

  //#endregion
}
