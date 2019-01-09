import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable()
export class FetchService {
  //#region Private members

  private _url = 'fetch';

  //#endregion

  //#region Constructor

  constructor(protected http: HttpClient) { }

  //#endregion

  //#region Public methods

  query(sql: string) {
    return this.http.post(`/${this._url}`, { sql: sql }).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

  //#endregion

  //#region Batch related fetch
  getBatchInfoFrom2DBarCode(barCode: string) {
    return of(null);
  }

  getBatchInformation(barCode: string) {
    return of(null);
  }

  getMaterialBuffer(barCode: string) {
    return of(null);
  }

  getOperatorByBadge(barCode: string) {
    return of(null);
  }
  //#endregion
}
