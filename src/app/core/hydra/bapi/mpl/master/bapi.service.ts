import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CreateBuffer } from './create.buffer';
import { DeleteBuffer } from './delete.buffer';

@Injectable()
export class MPLMasterBapiService {
  //#region Private members

  //#endregion

  //#region Constructor

  constructor(protected _http: HttpClient) {
  }
  //#endregion

  //#region Public methods

  //#region Create Buffer
  createMPLBuffer(name: string, description: string,
    type: string, plant: string, area: string,
    storageLocation: string, parent: string, level: number) {
    return new CreateBuffer(name, description, type, plant, area, storageLocation, parent, level).execute(this._http);
  }
  //#endregion

  //#region Delete Buffer
  deleteMPLBuffer(name: string) {
    return new DeleteBuffer(name).execute(this._http);
  }
  //#endregion

  //#endregion
}
