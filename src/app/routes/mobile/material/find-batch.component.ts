import { Component, Inject, AfterViewInit, ViewChild, OnInit } from '@angular/core';
import { BaseForm } from '../base.form';
import { FormBuilder } from '@angular/forms';
import { ToastService, ToptipsService, SearchBarComponent } from 'ngx-weui';
import { Router } from '@angular/router';
import { TitleService, SettingsService, ALAIN_I18N_TOKEN } from '@delon/theme';
import { BatchService } from '@core/hydra/service/batch.service';
import { OperatorService } from '@core/hydra/service/operator.service';
import { I18NService } from '@core/i18n/i18n.service';
import { of, BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { map, switchMap, startWith, delay } from 'rxjs/operators';
import { MaterialBatch } from '@core/hydra/entity/batch';

@Component({
  selector: 'fw-batch-find',
  templateUrl: 'find-batch.component.html',
  styleUrls: ['./find-batch.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class FindBatchComponent extends BaseForm implements OnInit {
  //#region View Children

  @ViewChild('searchBar') searchBar: SearchBarComponent;

  //#endregion

  //#region Protected member

  protected key = `app.mobile.material.find`;

  //#endregion

  //#region Private member

  //#endregion

  //#region Public member
  isLoadingMaterial = false;
  isMaterialSelected = false;
  materialTerm = '';
  material$: Subject<string[]>;
  batches$: BehaviorSubject<MaterialBatch[]> = new BehaviorSubject<MaterialBatch[]>([]);

  onMaterialInput($event) {
    this.materialTerm = $event;
    this.isMaterialSelected = false;
    if (!this.materialTerm) return;

    this.isLoadingMaterial = true;
    this.material$ = new BehaviorSubject([]);
    this.searchMaterial(this.materialTerm).subscribe(ret => {
      this.isLoadingMaterial = false;
      this.material$.next(ret);
    });
  }

  selectMaterial(material: string) {
    this.searchBar.value = material;
    this.isMaterialSelected = true;
  }

  searchMaterial = (material: string) => {
    if (material) {
      return this._batchService.searchBatchMaterial(material);
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
    super(fb, _settingService, _toastService, _routeService, _tipService, _titleService, _i18n, _operatorService, false);
  }

  //#endregion

  //#region Public methods
  caption(batch) {
    return batch.name;
  }

  description(batch) {
    return `${batch.material},${batch.quantity}`;
  }
  //#endregion

  //#region Event Handler
  cancelSearch() {
    this.batches$.next([]);
  }

  clearSearch() {
    this.batches$.next([]);
  }
  //#endregion

  //#region Data Request

  //#endregion

  //#region Exeuction
  searchBatch = () => {
    return this._batchService.searchBatch(
      this.searchBar._q).pipe(
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
    return this.isMaterialSelected;
  }

  //#endregion

  //#region Portected methods

  protected afterReset() {
    this.searchBar._onCancel();
    this.searchBar._doFocus();
  }

  //#endregion

  //#region Implemented interface

  ngOnInit(): void {
    this.searchBar._doFocus();
  }

  //#endregion
}
