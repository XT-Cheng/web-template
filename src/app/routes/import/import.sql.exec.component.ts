import { Component, ViewChild, ElementRef } from '@angular/core';
import { XlsxService, STColumn } from '@delon/abc';
import { ImportHandleBase } from '@shared/components/import.handle.base';
import { FetchService } from '@core/hydra/service/fetch.service';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-import-sql',
  templateUrl: './import.sql.exec.component.html',
  styleUrls: [`./import.sql.exec.component.less`]
})
export class ImportSqlComponent extends ImportHandleBase {
  //#region Private fields

  @ViewChild(`uploader`) uploaderElem: ElementRef;

  //#endregion

  //#region Constructor

  constructor(_xlsx: XlsxService, private _fetchService: FetchService) {
    super(_xlsx);
  }

  //#endregion

  //#region Public methods

  change(e: Event) {
    const file = (e.target as HTMLInputElement).files[0];
    if (file) {
      this.loadFile(file).then(() => {
        // this.clearSheetNames();
      });
    }
  }

  import() {
    this.execute((records) => {
      const rec = records[0];

      return this._fetchService.query(rec.delete).pipe(
        switchMap(() => {
          return this._fetchService.query(rec.insert);
        })
      );
    });
  }

  resetAll() {
    this.uploaderElem.nativeElement.value = '';

    this.clear();
  }

  deleteData() {
    // Nothing to do
  }

  stop() {
    this.stopExecuting();
  }

  //#endregion

  //#region Implmented Interface

  protected get key(): string {
    return `seq`;
  }

  protected get dataFields(): STColumn[] {
    return [
      { title: 'Seq', index: 'seq' },
      { title: 'Delete', index: 'delete' },
      { title: 'Insert', index: 'insert' },
    ];
  }
  //#endregion
}
