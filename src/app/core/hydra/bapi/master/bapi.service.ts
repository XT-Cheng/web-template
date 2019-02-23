import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CreatePerson } from './create.person';
import { DeletePerson } from './delete.person';

@Injectable()
export class MasterBapiService {
  //#region Private members

  //#endregion

  //#region Constructor

  constructor(protected _http: HttpClient) {
  }
  //#endregion

  //#region Public methods

  //#region HR Master

  //#region Create Person
  createHRPerson() {
    return new CreatePerson().execute(this._http);
  }
  //#endregion

  //#region Delete Person
  deleteHRPerson() {
    return new DeletePerson().execute(this._http);
  }

  //#endregion

  //#endregion
}
