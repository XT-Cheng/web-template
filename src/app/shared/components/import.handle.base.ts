import { ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { STComponent, STColumn, STColumnBadge, XlsxService } from '@delon/abc';
import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject, BehaviorSubject } from 'rxjs';
import { map, catchError, switchMap, takeUntil, takeWhile, finalize } from 'rxjs/operators';
import { isNullOrUndefined, isUndefined } from 'util';

const STATUS: STColumnBadge = {
  0: { text: '待处理', color: 'default' },
  1: { text: '成功', color: 'success' },
  2: { text: '错误', color: 'error' },
};

export abstract class ImportHandleBase implements OnInit {
  //#region Private fields

  @ViewChild('st') comp: STComponent;

  _recordPerTurn = 50;

  _fileContent: { [key: string]: any[][] } = null;
  _sheets: string[] = [];
  _selectedSheet: string;
  _tableRecords: any[] = [];
  _allRecords: any[] = [];

  _statusCol: STColumn = { title: '状态', index: 'status', type: 'badge', badge: STATUS };
  _errorCol: STColumn = { title: '错误', index: 'error' };

  _showProgress = false;

  _columns: STColumn[] = [this._statusCol];

  _toBeProcess = 0;
  _processSucceed = 0;
  _processFailed = 0;
  _currentPosition = 0;

  _executing = false;
  _stopExecuting = false;

  _obs$: Observable<any> = of('start');

  //#endregion

  //#region Constructor

  constructor(protected xlsx: XlsxService) { }

  //#endregion

  //#region Public properties
  public get sheets(): string[] {
    return this._sheets;
  }

  public get selectedSheet(): string {
    return this._selectedSheet;
  }

  public set selectedSheet(value: string) {
    this._selectedSheet = value;
  }

  public get showProgress(): boolean {
    return this._showProgress;
  }

  public get columns(): STColumn[] {
    return this._columns;
  }

  public get executing(): boolean {
    return this._executing;
  }

  public get tableRecords(): any[] {
    return this._tableRecords;
  }

  public get toBeProcess() {
    return this._toBeProcess;
  }

  protected get processSucceed() {
    return this._processSucceed;
  }

  protected get processFailed() {
    return this._processFailed;
  }

  //#endregion

  //#region Protected properties

  protected abstract get dataFields(): STColumn[];

  protected abstract get key(): string;

  //#endregion

  //#region Implmented Interface

  ngOnInit() {
    // Generate Columns
    this._columns = [this._statusCol];

    this._columns.push(...this.dataFields);

    this._columns.push(this._errorCol);
  }

  //#endregion

  //#region Protected methods

  protected sheetSelected(sheetName) {
    const output = <Array<any>>this._fileContent[sheetName];
    const fields = output[0];
    const values = output.slice(1);

    this._allRecords = [];
    this._tableRecords = [];

    // Generate records


    values.forEach(value => {
      const element = {};
      element['status'] = 0;
      element['error'] = '';

      for (let index = 0; index < fields.length; index++) {
        element[fields[index]] = isUndefined(value[index]) ? `` : value[index];
      }

      if (element[this.key]) {
        this._allRecords.push(element);
      }
    });

    this._tableRecords = this._allRecords.filter((rec) => {
      return rec.status === 0 || rec.status === 2;
    });
  }

  protected stopExecuting() {
    this._stopExecuting = true;
  }

  protected loadFile(file) {
    return this.xlsx.import(file).then((res) => {
      this.prepareRecords(res);
    });
  }

  protected clear() {
    this._obs$ = of('start');

    this._executing = false;
    this._showProgress = false;

    this._allRecords = [];
    this._tableRecords = [];
  }

  protected execute(processor: (records) => Observable<any>) {
    this.start();

    this._toBeProcess = this._tableRecords.length;

    this.executePerRound(processor);
  }

  protected executePerRound(processor: (records) => Observable<any>) {
    this._obs$ = of('start');

    const stopAt = (this._currentPosition + this._recordPerTurn > this._tableRecords.length) ?
      this._tableRecords.length : this._currentPosition + this._recordPerTurn;

    let i = this._currentPosition;
    for (; i < stopAt; i++) {
      const rec = this._tableRecords[i];

      if (rec.status === 0 || rec.status === 2) {
        this._obs$ = this._obs$.pipe(
          map(() => {
            return [rec];
          }),
          switchMap((records) => processor(records)),
          takeWhile(() => {
            return !this._stopExecuting;
          }),
          map(() => {
            rec.status = 1;
            this._processSucceed++;
            this._toBeProcess--;
            this._currentPosition++;
          }),
          catchError((err) => {
            rec.status = 2;
            rec.error = err;
            this._processFailed++;
            this._toBeProcess--;
            this._currentPosition++;
            return of('next');
          })
        );
      }
    }

    this._obs$.pipe(
      finalize(() => {
        // this.end();
      })
    ).subscribe(() => {
      if (this._currentPosition < this._tableRecords.length) {
        setTimeout(() => this.executePerRound(processor), 0);
      } else {
        this.end();
      }
    }, () => this.end());
  }

  //#endregion

  //#region Private methods
  private chunkArray(source: Array<any>, chunkSize) {
    return source.reduce((resultArray, item, index) => {
      const chunkIndex = Math.floor(index / chunkSize);

      if (!resultArray[chunkIndex]) {
        resultArray[chunkIndex] = [];  // start a new chunk
      }

      resultArray[chunkIndex].push(item);

      return resultArray;
    }, []);
  }

  private start() {
    this._stopExecuting = false;
    this._executing = true;
    this._showProgress = true;

    this._toBeProcess = this._tableRecords.length;
    this._processFailed = this._processSucceed = 0;
    this._currentPosition = 0;
  }

  protected end(err: any = null) {
    this._executing = false;
    this._showProgress = false;
    this._stopExecuting = false;

    this._tableRecords = this._allRecords.filter((rec) => {
      return rec.status === 0 || rec.status === 2;
    });
  }

  private prepareRecords(res) {
    this._allRecords = [];
    this._tableRecords = [];

    this._selectedSheet = null;

    this._sheets = Object.keys(res);
    this._fileContent = res;
  }

  //#endregion
}
