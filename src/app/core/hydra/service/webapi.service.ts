import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { FetchService } from './fetch.service';
import { map, switchMap, delay } from 'rxjs/operators';
import { IActionResult } from '@core/utils/helpers';
import { environment } from '@env/environment';

@Injectable()
export class WebAPIService {
  //#region Private members

  private terminalNo = 600;
  private userId = 86812;

  //#endregion

  //#region Constructor

  constructor(protected _http: HttpClient, protected _fetchService: FetchService) { }

  //#endregion

  //#region Public methods
  getNextLicenseTag(material: string, workOrder?: string, terminalNo?: number, userId?: number): Observable<string> {
    return of(null).pipe(
      // delay(0),
      switchMap(_ => {
        return this._http.get(environment.GET_LT_URL, {
          params: {
            data: `{"PartNo":"${material}","WorkOrder": "${workOrder ? workOrder : `COMPONENT`}","Qty": "1",`
              + `"TerminalNo":"${terminalNo ? terminalNo : this.terminalNo}"`
              + `,"UserId":"${userId ? userId : this.userId}"}`
          }
        });
      }),
      map((ret: any) => {
        return ret[0].SN;
      })
    );
  }

  createLicenseTagInfo(licenseTag: string, material: string, quantity: number,
    terminalNo?: number, userId?: number): Observable<IActionResult> {
    return of(null).pipe(
      // delay(0),
      switchMap(_ => {
        return this._http.get(environment.CREATE_LT_URL, {
          params: {
            data: `{"LicenseTag":"${licenseTag}","PartNo":"${material}","Qty":"${quantity}",`
              + `"TerminalNo":"${terminalNo ? terminalNo : this.terminalNo}"`
              + `,"UserId":"${userId ? userId : this.userId}"}`
          }
        });
      }),
      switchMap(_ => {
        return of({
          isSuccess: true,
          error: ``,
          content: ``,
          description: `LT ${licenseTag} Generated!`,
        });
      })
    );
  }

  //#endregion
}
