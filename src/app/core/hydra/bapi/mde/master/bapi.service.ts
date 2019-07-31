import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CopyMachine } from './copy.machine';

@Injectable()
export class MDEMasterBapiService {
  //#region Private members

  //#endregion

  //#region Constructor

  constructor(protected _http: HttpClient) {
  }
  //#endregion

  //#region Public methods

  //#region Copy Machine
  copyMDEMachine(fromName: string, toName: string) {
    return new CopyMachine(fromName, toName).execute(this._http);
  }
  //#endregion

  //#endregion
}
