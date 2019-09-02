import { Component, ViewChild, ElementRef } from '@angular/core';
import { XlsxService, STColumn } from '@delon/abc';
import { ImportHandleBase } from '@shared/components/import.handle.base';
import { BapiService } from '@core/hydra/bapi/bapi.service';
import { BapiWebApi } from '@core/webapi/bapi.webapi';

@Component({
  selector: 'app-import-bapi',
  templateUrl: './import.bapi.exec.component.html',
  styleUrls: [`./import.bapi.exec.component.less`]
})
export class ImportBapiComponent extends ImportHandleBase {
  //#region Private fields

  @ViewChild(`uploader`) uploaderElem: ElementRef;

  //#endregion

  //#region Constructor

  constructor(_xlsx: XlsxService,
    private _bapiWebApi: BapiWebApi,
    // private _bapiService: BapiService
  ) {
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

      return this._bapiWebApi.executeBapi(rec.dialog, rec.content);
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
      { title: 'Dialog', index: 'dialog' },
      { title: 'Content', index: 'content' },
    ];
  }
  //#endregion
}
