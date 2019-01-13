import { Injectable } from '@angular/core';
import { FetchService } from './fetch.service';
import { map } from 'rxjs/operators';
import { Operator } from '../entity/operator';

@Injectable()
export class OperatorService {

  static badgeNameTBR = '$badgeName';

  //#region SQL

  static operatorSql =
    `SELECT PERSON_NAME AS FIRSTNAME, PERSON_VORNAME AS LASTNAME ` +
    ` FROM PERSONALSTAMM WHERE KARTEN_NUMMER = '${OperatorService.badgeNameTBR}'`;

  //#endregion
  //#region Private members


  //#endregion

  //#region Constructor

  constructor(protected _fetchService: FetchService) { }

  //#endregion

  //#region Public methods
  getOperatorByBadge(badgeName: string) {
    let sql = OperatorService.operatorSql;
    sql = sql.replace(OperatorService.badgeNameTBR, badgeName);

    return this._fetchService.query(sql).pipe(
      map((operators: any) => {
        let ret: Operator = null;

        operators.forEach(operator => {
          ret = new Operator();
          ret.badge = badgeName;
          ret.firstName = operator.FIRSTNAME;
          ret.lastName = operator.LASTNAME;
        });

        return ret;
      }));
  }
  //#endregion

  //#region Private methods

  //#endregion
}
