import { Component, ViewChild, ElementRef } from '@angular/core';
import { XlsxService, STColumn } from '@delon/abc';
import { HttpClient } from '@angular/common/http';
import { ImportHandleBase } from '@shared/components/import.handle.base';
import { BapiService } from '@core/hydra/service/bapi.service';

@Component({
  selector: 'app-import-person',
  templateUrl: './import.person.component.html',
  styleUrls: [`./import.person.component.less`]
})
export class ImportPersonComponent extends ImportHandleBase {
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

      return this._bapiService.createHRPerson();
    });
  }

  resetAll() {
    this.uploaderElem.nativeElement.value = '';

    this.clear();
  }

  deleteData() {
    this.execute((records) => {

      return this._bapiService.deleteHRPerson();
    });
  }

  stop() {
    this.stopExecuting();
  }

  //#endregion

  //#region Implmented Interface

  protected get key(): string {
    return `Person`;
  }

  protected get dataFields(): STColumn[] {
    return [
      { title: 'Person Number', index: 'Person Number' },
    ];
  }
  //#endregion
}