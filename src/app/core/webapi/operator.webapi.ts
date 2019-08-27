import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Operator } from "@core/hydra/entity/operator";
import { map } from "rxjs/operators";

@Injectable()
export class OperatorWebApi {
    constructor(protected _http: HttpClient) {
    }

    public getOperatorByBadge(badge: string): Observable<Operator> {
        return this._http.get(`/api/operatorService/operator/${badge}`).pipe(
            map((operator: any) => {
                if (!operator) {
                    throw Error(`${badge} not exist!`);
                }

                return OperatorWebApi.translateOperator(operator);
            })
        )
    }

    public static translateOperator(operator: any): Operator {
        let ret = new Operator();

        ret.badge = operator.Badge;
        ret.firstName = operator.FirstName;
        ret.lastName = operator.LastName;

        return ret;
    }
}