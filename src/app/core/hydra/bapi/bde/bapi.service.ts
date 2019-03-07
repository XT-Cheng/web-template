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
import { MDEBapiService } from '../mde/bapi.service';
import { MACHINE_STATUS_CHANGOVER_SETUP, MACHINE_STATUS_PRODUCTION, MACHINE_STATUS_NOORDER } from '../constants';

@Injectable()
export class BDEBapiService {
  //#region Private members

  //#endregion

  //#region Constructor

  constructor(protected _http: HttpClient, private _bapiMPL: MPLBapiService, private _webAPIService: WebAPIService,
    private _bapiMDE: MDEBapiService, private _batchService: BatchService, private _printService: PrintService) {
  }
  //#endregion

  //#region Public methods
  logonOperation(operation: Operation, machine: Machine,
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
    batchLogon$ = batchLogon$.pipe(
      switchMap(() => {
        return this._webAPIService.getNextLicenseTag(operation.article, operation.name).pipe(
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

    // Change Machine Status if required
    if (machine.lastArticle !== operation.article && machine.currentOperations.length === 0) {
      batchLogon$ = batchLogon$.pipe(
        switchMap(() => {
          // Change it to MACHINE_STATUS_CHANGOVER_SETUP
          return this._bapiMDE.changeMachineStatus(machine, MACHINE_STATUS_CHANGOVER_SETUP, operator);
        })
      );
    } else if (machine.currentStatusNr === MACHINE_STATUS_NOORDER) {
      batchLogon$ = batchLogon$.pipe(
        switchMap(() => {
          // Change it to MACHINE_STATUS_PRODUCTION
          return this._bapiMDE.changeMachineStatus(machine, MACHINE_STATUS_PRODUCTION, operator);
        })
      );
    }

    return batchLogon$;
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

  changeOutputBatch(operation: Operation | { name: string, article: string }, machine: Machine | { machineName: string },
    currentBatch: string, qty: number,
    operator: Operator): Observable<IActionResult> {
    let newBatchName: string;
    return this._webAPIService.getNextLicenseTag(operation.article, operation.name).pipe(
      switchMap(batchName => {
        newBatchName = batchName;
        return new ChangeOutputBatch(operation.name, machine.machineName, operator.badge, batchName, 0).execute(this._http);
      }),
      switchMap(_ => {
        return this._batchService.getBatchInformation(currentBatch);
      }),
      switchMap(materialBatch => {
        if (materialBatch.quantity !== qty) {
          return this._bapiMPL.modifyOutputBatch(materialBatch, qty, operator);
        }
        return of(null);
      }),
      switchMap(_ => {
        return this._printService.printOutputBatchLabel([newBatchName], machine.machineName);
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
