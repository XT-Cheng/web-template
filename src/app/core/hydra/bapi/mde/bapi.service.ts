import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ChangeMachineStatus } from './change.machine.status';
import { Machine } from '@core/hydra/entity/machine';
import { Operator } from '@core/hydra/entity/operator';
import { map } from 'rxjs/operators';
import { IActionResult } from '@core/utils/helpers';

@Injectable()
export class MDEBapiService {
  //#region Private members

  //#endregion

  //#region Constructor

  constructor(protected _http: HttpClient) {
  }

  //#endregion

  //#region Public methods

  changeMachineStatus(machine: Machine | { machineName: string }, newStatus: number, operator: Operator) {
    return new ChangeMachineStatus(machine.machineName, newStatus, operator.badge).execute(this._http).pipe(
      map((ret: IActionResult) => {
        return Object.assign(ret, {
          description: `Machine ${machine.machineName} Status Changed!`
        });
      })
    );
  }


  //#endregion
}
