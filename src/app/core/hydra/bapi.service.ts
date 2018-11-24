import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, OperatorFunction } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { IBapiResult, DialogTypeEnum } from '@core/hydra/bapi/constants';
import { FetchService } from './fetch.service';
import { TestBapi } from './bapi/test.bapi';

@Injectable()
export class BapiService {
  //#region Private members

  private _url = 'bapi';

  //#endregion

  //#region Constructor

  constructor(protected _http: HttpClient, private _fetchService: FetchService) {
  }

  //#endregion

  //#region Public methods

  test(type: string, content: string) {
    const typedString = type as keyof typeof DialogTypeEnum;
    return new TestBapi(DialogTypeEnum[typedString], content).execute(this._http);
  }

  //#endregion

  //#region Private methods

  private getResult(res: any) {
    return {
      isSuccess: res.isSuccess,
      error: res.error,
      description: res.description,
      content: res.content
    };
  }

  //#endregion
}
