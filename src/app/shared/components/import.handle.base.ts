import { ViewChild } from '@angular/core';
import { STComponent, STColumn, STColumnBadge, XlsxService } from '@delon/abc';
import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject, BehaviorSubject } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

const STATUS: STColumnBadge = {
  0: { text: '待处理', color: 'default' },
  1: { text: '成功', color: 'success' },
  2: { text: '错误', color: 'error' },
};

export abstract class ImportHandleBase {
  //#region fields

  @ViewChild('st') comp: STComponent;

  _tableRecords: any[] = [];
  allRecords: any[] = [];

  statusCol: STColumn = { title: '状态', index: 'status', type: 'badge', badge: STATUS };
  errorCol: STColumn = { title: '错误', index: 'error' };

  columns: STColumn[] = [this.statusCol];

  showOnlyToBeProcessOrFailed = false;
  showProgress = false;

  _toBeProcess = 0;
  _processSucceed = 0;
  _processFailed = 0;

  loading = false;

  obs$: Observable<any> = of('start');

  //#endregion

  //#region constructor

  constructor(protected xlsx: XlsxService) { }

  //#endregion

  //#region protected properties
  protected get tableRecords(): any[] {
    return this._tableRecords;
  }

  protected get toBeProcess() {
    return this._toBeProcess;
  }

  protected get processSucceed() {
    return this._processSucceed;
  }

  protected get processFailed() {
    return this._processFailed;
  }

  //#endregion

  //#region protected methods

  protected loadFile(file) {
    this.xlsx.import(file).then((res) => {
      this.prepareRecords(res);
    });
  }

  protected execute(processor: (records) => Observable<any>) {
    this.start();

    this.allRecords.forEach((rec) => {
      if (rec.status === 0 || rec.status === 2) {
        this.obs$ = this.obs$.pipe(
          map(() => [rec]),
          switchMap((records) => processor(records)),
          map(() => {
            rec.status = 1;
            this._processSucceed++;
            this._toBeProcess--;
          }),
          catchError((err) => {
            rec.error = err.message;
            this._processFailed++;
            this._toBeProcess--;
            return of('next');
          })
        );
      }
    });

    this.obs$.subscribe(() => {
      this.end();
    });
  }

  //#endregion

  //#region privated methods
  private start() {
    this.loading = true;
    this.showProgress = true;

    this._toBeProcess = this.allRecords.length;
    this._processFailed = this._processSucceed = 0;
  }

  protected end(err: any = null) {
    this.loading = false;
    this.showProgress = false;

    this._tableRecords = this.allRecords.filter((rec) => {
      return rec.status === 0 || rec.status === 2;
    });
  }

  private prepareRecords(res) {
    // Only care first Sheet
    const sheetName = Object.keys(res)[0];

    const output = <Array<any>>res[sheetName];
    const fields = output[0];
    const values = output.slice(1);

    // Generate Columns
    this.columns = [this.statusCol];

    fields.forEach(field => {
      this.columns.push({ title: field, index: field });
    });

    this.columns.push(this.errorCol);

    // Generate records
    this.allRecords = [];

    values.forEach(value => {
      const element = {};
      element['status'] = 0;
      element['error'] = '';

      for (let index = 0; index < fields.length; index++) {
        element[fields[index]] = value[index];
      }
      this.allRecords.push(element);
    });

    this._tableRecords = this.allRecords.filter((rec) => {
      return rec.status === 0 || rec.status === 2;
    });
  }

  //#endregion
}
