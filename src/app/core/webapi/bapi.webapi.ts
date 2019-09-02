import { Injectable } from "@angular/core";

import { HttpClient } from "@angular/common/http";
import { MaterialBatch } from "@core/hydra/entity/batch";
import { Observable, throwError, of } from "rxjs";
import { switchMap } from "rxjs/operators";

@Injectable()
export class BapiWebApi {
    constructor(protected _http: HttpClient) {
    }

    executeBapi(dialog: string, content: string): Observable<MaterialBatch> {
        return this._http.post(`/api/bapiService/execute`, {
            Dialog: dialog,
            Content: content
        }).pipe(
            switchMap((ret: any) => {
                if (ret.ReturnCode != 0) {
                    return throwError(`BAPI Error: ${ret.LongDescription}`);
                }
                else if (ret.LongDescription === ``) {
                    ret.LongDescription = `Success!`;
                }
                return of(ret);
            })
        )
    }

}