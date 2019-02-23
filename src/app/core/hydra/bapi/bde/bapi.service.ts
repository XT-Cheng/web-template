import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { WebAPIService } from '@core/hydra/service/webapi.service';
import { BatchService } from '@core/hydra/service/batch.service';
import { PrintService } from '@core/hydra/service/print.service';
import { switchMap, map } from 'rxjs/operators';
import { IActionResult } from '@core/utils/helpers';
import { ComponentStatus, Operation } from '@core/hydra/entity/operation';
import { Machine } from '@core/hydra/entity/machine';
import { Operator } from '@core/hydra/entity/operator';
import { LogonOperation } from './logon.operation';
import { of, Observable } from 'rxjs';
import { MPLBapiService } from '../mpl/bapi.service';

@Injectable()
export class BDEBapiService {
  //#region Private members

  //#endregion

  //#region Constructor

  constructor(protected _http: HttpClient, private _bapiBatch: MPLBapiService, private _webAPIService: WebAPIService,
    private _batchService: BatchService, private _printService: PrintService) {
  }
  //#endregion

  //#region Public methods
  logonOperation(operation: Operation, machine: Machine, componentStatus: ComponentStatus[], operator: Operator)
    : Observable<IActionResult> {

    let batchLogon$ = of(null);

    // LogOn Batch if required
    componentStatus.forEach((status: ComponentStatus) => {
      if (status.isReady && status.operation !== operation.name) {
        batchLogon$ = batchLogon$.pipe(
          switchMap(() => {
            return this._bapiBatch.logonInputBatch(operation,
              machine, operator, { name: status.batchName, material: status.material }, status.pos);
          })
        );
      }
    });

    // LogOn Operation
    return batchLogon$.pipe(
      switchMap(() => {
        return this._batchService.getNextBatchName().pipe(
          switchMap((name) => {
            return new LogonOperation(operation.name, machine.machineName, operator.badge, name).execute(this._http);
          }));
      }),
      map((ret: IActionResult) => {
        return Object.assign(ret, {
          description: `Operation ${operation} Logged On!`
        });
      })
    );
  }
  //#endregion
}
