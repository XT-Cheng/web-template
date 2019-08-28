import { Component, ViewChild, OnInit, Injector } from '@angular/core';
import { SearchBarComponent } from 'ngx-weui';
import { BatchService } from '@core/hydra/service/batch.service';
import { of, BehaviorSubject, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { MaterialBatch } from '@core/hydra/entity/batch';
import { BaseExtendForm } from '../base.form.extend';
import { BatchWebApi } from '@core/webapi/batch.webapi';

@Component({
  selector: 'fw-batch-find',
  templateUrl: 'find-batch.component.html',
  styleUrls: ['./find-batch.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class FindBatchComponent extends BaseExtendForm implements OnInit {
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
      return this._batchWebApi.searchBatchMaterial(material);
    } else {
      return of([]);
    }
  }
  //#endregion

  //#region Constructor

  constructor(
    injector: Injector,
    private _batchWebApi: BatchWebApi,
  ) {
    super(injector, false, false);
  }

  //#endregion

  //#region Public methods
  caption(batch: MaterialBatch) {
    return batch.name;
  }

  description(batch: MaterialBatch) {
    return `${batch.material},${batch.quantity},${batch.bufferDescription}`;
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
    return this._batchWebApi.searchBatch(
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

  //#region Override properties

  get upperLevel(): string {
    return `/material/list`;
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
