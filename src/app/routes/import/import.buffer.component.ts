import { Component, ViewChild, ElementRef } from '@angular/core';
import { XlsxService, STColumn } from '@delon/abc';
import { ImportHandleBase } from '@shared/components/import.handle.base';
import { BapiService } from '@core/hydra/bapi.service';

@Component({
  selector: 'app-import-buffer',
  templateUrl: './import.buffer.component.html',
  styleUrls: [`./import.buffer.component.less`]
})
export class ImportBufferComponent extends ImportHandleBase {
  //#region Private fields

  @ViewChild(`uploader`) uploaderElem: ElementRef;

  //#endregion

  //#region Constructor

  constructor(_xlsx: XlsxService, private _bapiService: BapiService) {
    super(_xlsx);
  }

  //#endregion

  //#region Public methods

  change(e: Event) {
    const file = (e.target as HTMLInputElement).files[0];
    this.loadFile(file).then(() => {
      this.uploaderElem.nativeElement.value = '';
    });
  }

  import() {
    this.execute((records) => {
      const rec = records[0];

      // if (Math.floor(Math.random() * 1000) > 500) {
      //   return throwError('').pipe(
      //     delay(10)
      //   );
      // } else {
      //   return of('success').pipe(
      //     delay(10)
      //   );
      // }

      return this._bapiService.createMPLBuffer(
        rec['Buffer Area'], rec['Designation'], rec['Type'], rec['Plant'], rec['Area'],
        rec['Storage Location'], rec['Hiearchy Buffer Area'], rec['Hierarchy level']);
    });
  }

  resetAll() {
    this.uploaderElem.nativeElement.value = '';

    this.clear();
  }

  deleteData() {
    this.execute((records) => {
      const rec = records[0];

      return this._bapiService.deleteMPLBuffer(
        rec['Buffer Area']);
    });
  }

  stop() {
    this.stopExecuting();
  }

  //#endregion

  //#region Implmented Interface

  protected get key(): string {
    return `Buffer Area`;
  }

  protected get dataFields(): STColumn[] {
    return [
      { title: 'Buffer Area', index: 'Buffer Area' },
      { title: 'Hierarchy level', index: 'Hierarchy level' },
      { title: 'Hiearchy Buffer Area', index: 'Hiearchy Buffer Area' },
      { title: 'Type', index: 'Type' },
      { title: 'Area', index: 'Area' },
      { title: 'Storage Location', index: 'Storage Location' },
      { title: 'Plant', index: 'Plant' },
      { title: 'Designation', index: 'Designation' },
    ];
  }
  //#endregion
}
