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
import { InterruptOperation } from './interrupt.operation';
import { LogoffOperation } from './logoff.operation';
import { PartialConfirmOperation } from './partialConfirm.operation';
import { ChangeOutputBatch } from './change.outputBatch';
import { LogonOperator } from './logon.operator';
import { LogoffOperator } from './logoff.operator';

@Injectable()
export class BDEBapiService {
  //#region Private members

  //#endregion

  //#region Constructor

  constructor(protected _http: HttpClient, private _bapiMPL: MPLBapiService, private _webAPIService: WebAPIService,
    private _batchService: BatchService, private _printService: PrintService) {
  }
  //#endregion

  //#region Public methods
  logonOperation(operation: Operation | { name: string }, machine: Machine | { machineName: string },
    componentStatus: ComponentStatus[], operator: Operator)
    : Observable<IActionResult> {

    let batchLogon$ = of(null);

    // LogOn Batch if required
    componentStatus.forEach((status: ComponentStatus) => {
      if (status.isReady && status.operation !== operation.name) {
        batchLogon$ = batchLogon$.pipe(
          switchMap(() => {
            return this._bapiMPL.logonInputBatch(operation,
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
          description: `Operation ${operation.name} Logged On!`
        });
      })
    );
  }

  interruptOperation(operation: Operation | { name: string }, machine: Machine | { machineName: string },
    operator: Operator, yieldQty: number = 0, scrapQty: number = 0, scrapReason: number = 0): Observable<IActionResult> {
    return new InterruptOperation(operation.name, machine.machineName, yieldQty, scrapQty, scrapReason, operator.badge)
      .execute(this._http).pipe(
        map((ret: IActionResult) => {
          return Object.assign(ret, {
            description: `Operation ${operation.name} Interrupted!`
          });
        })
      );
  }

  partialConfirmOperation(operation: Operation | { name: string }, machine: Machine | { machineName: string },
    operator: Operator, yieldQty: number = 0, scrapQty: number = 0, scrapReason: number = 0): Observable<IActionResult> {
    return new PartialConfirmOperation(operation.name, machine.machineName, yieldQty, scrapQty, scrapReason, operator.badge)
      .execute(this._http).pipe(
        map((ret: IActionResult) => {
          return Object.assign(ret, {
            description: `Operation ${operation.name} Confirmed!`
          });
        })
      );
  }

  logoffOperation(operation: Operation | { name: string }, machine: Machine | { machineName: string },
    operator: Operator): Observable<IActionResult> {
    return new LogoffOperation(operation.name, machine.machineName, operator.badge)
      .execute(this._http).pipe(
        map((ret: IActionResult) => {
          return Object.assign(ret, {
            description: `Operation ${operation.name} Logged Off!`
          });
        })
      );
  }

  changeOutputBatch(operation: Operation | { name: string }, machine: Machine | { machineName: string },
    currentBatch: string, qty: number,
    operator: Operator): Observable<IActionResult> {
    let newBatchName;
    return this._webAPIService.getNextLicenseTag().pipe(
      switchMap(batchName => {
        newBatchName = batchName;
        return new ChangeOutputBatch(operation.name, machine.machineName, operator.badge, batchName, 0).execute(this._http);
      }),
      switchMap(_ => {
        return this._batchService.getBatchInformation(currentBatch);
      }),
      switchMap(materialBatch => {
        if (materialBatch.quantity !== qty) {
          return this._bapiMPL.changeBatchQuantity(materialBatch, qty, operator);
        }
        return of(null);
      }),
      switchMap(_ => {
        return this._printService.printMaterialBatchLabel(newBatchName, machine.machineName, 999);
      }),
      map((ret: IActionResult) => {
        return Object.assign(ret, {
          description: `Batch ${currentBatch} Generated And Print!`
        });
      })
    );
  }

  logonOperator(machine: Machine | { machineName: string }, operator: Operator | { badge: string }): Observable<IActionResult> {
    return new LogonOperator(machine.machineName, operator.badge).execute(this._http).pipe(
      map((ret: IActionResult) => {
        return Object.assign(ret, {
          description: `Operator ${operator.badge} LoggedOn to ${machine.machineName}`
        });
      })
    );
  }

  logoffOperator(machine: Machine | { machineName: string }, operator: Operator | { badge: string }): Observable<IActionResult> {
    return new LogoffOperator(machine.machineName, operator.badge).execute(this._http).pipe(
      map((ret: IActionResult) => {
        return Object.assign(ret, {
          description: `Operator ${operator.badge} LoggedOff from ${machine.machineName}`
        });
      })
    );
  }
  //#endregion
}
