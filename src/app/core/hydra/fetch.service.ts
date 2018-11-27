import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, concatMap, combineLatest, delay } from 'rxjs/operators';

@Injectable()
export class FetchService {
  //#region Private members

  private _url = 'http://localhost:3001/fetch';

  //#endregion

  //#region Constructor

  constructor(protected http: HttpClient) { }

  //#endregion

  //#region Public methods

  query(sql: string) {
    return this.http.get(`${this._url}?sql=${sql}`).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

  //#endregion
}
