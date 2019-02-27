import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DialogTypeEnum } from '@core/hydra/bapi/constants';
import { TestBapi } from './test.bapi';

@Injectable()
export class BapiService {
  //#region Private members

  //#endregion

  //#region Constructor

  constructor(protected _http: HttpClient) {
  }

  //#endregion

  //#region Public methods

  test(type: string, content: string) {
    const typedString = type as keyof typeof DialogTypeEnum;
    return new TestBapi(DialogTypeEnum[typedString], content).execute(this._http);
  }

  //#endregion
}
