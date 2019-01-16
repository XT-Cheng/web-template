import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FetchService } from './fetch.service';
import { map } from 'rxjs/operators';
import { leftPad } from '@core/utils/helpers';

@Injectable()
export class WebAPIService {
  //#region Private members

  //#endregion

  //#region Constructor

  constructor(protected http: HttpClient, protected _fetchService: FetchService) { }

  //#endregion

  //#region Public methods
  getNextLicenseTag(): Observable<string> {
    const sql = 'SELECT S_MPL_NEXT_LT.NEXTVAL FROM DUAL';
    return this._fetchService.query(sql).pipe(
      map(res => {
        return `3SDUMMY${leftPad(res[0].NEXTVAL, 6)}`;
      })
    );
  }

  //#endregion
}
