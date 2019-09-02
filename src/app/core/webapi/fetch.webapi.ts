import { Injectable } from "@angular/core";

import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Injectable()
export class FetchWebApi {
    constructor(protected _http: HttpClient) {
    }

    executeSelect(sqlStatement: string): Observable<[]> {
        return this._http.post(`/api/fetchService/select`, {
            SQLStatement: sqlStatement,
        }).pipe(
            map((ret: []) => {
                return ret;
            })
        )
    }

    executeUpdate(sqlStatement: string): Observable<number> {
        return this._http.post(`/api/fetchService/update`, {
            SQLStatement: sqlStatement,
        }).pipe(
            map((ret: number) => {
                return ret;
            })
        )
    }
}