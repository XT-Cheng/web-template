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
import {
  MACHINE_STATUS_CHANGOVER_SETUP,
  MACHINE_STATUS_PRODUCTION,
  MACHINE_STATUS_NOORDER,
  MACHINE_STATUS_CHANGSHIT_SETUP
} from '../constants';
import { MachineService } from '@core/hydra/service/machine.service';

@Injectable()
export class BDEBapiService {
  //#region Private members

  //#endregion

  //#region Constructor

  constructor(protected _http: HttpClient, private _bapiMPL: MPLBapiService, private _webAPIService: WebAPIService,
    private _bapiMDE: MDEBapiService, private _batchService: BatchService, private _machineService: MachineService,
    private _printService: PrintService) {
  }
  //#endregion

  //#region Public methods
  logonOperation(operation: Operation, machine: Machine,
    componentStatus: ComponentStatus[], operator: Operator)
    : Observable<IActionResult> {

    let operationLogon$ = of(null);

    // LogOn Batch if required
    componentStatus.forEach((status: ComponentStatus) => {
      if (status.isReady && status.operation !== operation.name) {
        operationLogon$ = operationLogon$.pipe(
          switchMap(() => {
            return this._bapiMPL.logonInputBatch(operation,
              machine, operator, { name: status.batchName, material: status.material }, status.pos);
          })
        );
      }
    });

    // LogOn Operation
    operationLogon$ = operationLogon$.pipe(
      switchMap(() => {
        return this._webAPIService.getNextLicenseTag(operation.article, operation.name).pipe(
          switchMap((name) => {
            return new LogonOperation(operation.name, machine.machineName, operator.badge, name).execute(this._http);
          }));
      })
    );

    // Change Machine Status if required
    if (!machine.changeShiftCheckListFinished) {
      operationLogon$ = operationLogon$.pipe(
        switchMap((ret: IActionResult) => {
          // Change it to MACHINE_STATUS_CHANGSHIT_SETUP
          return this._machineService.hasStatusAssigned(machine.machineName, MACHINE_STATUS_CHANGSHIT_SETUP).pipe(
            switchMap(exist => {
              if (exist) {
                return this._bapiMDE.changeMachineStatus(machine, MACHINE_STATUS_CHANGSHIT_SETUP, operator);
              }

              return of(ret);
            })
          );
        })
      );
    } else if (machine.lastArticle !== operation.article && machine.currentOperations.length === 0) {
      operationLogon$ = operationLogon$.pipe(
        switchMap((ret: IActionResult) => {
          // Change it to MACHINE_STATUS_CHANGOVER_SETUP
          return this._machineService.hasStatusAssigned(machine.machineName, MACHINE_STATUS_CHANGOVER_SETUP).pipe(
            switchMap(exist => {
              if (exist) {
                return this._bapiMDE.changeMachineStatus(machine, MACHINE_STATUS_CHANGOVER_SETUP, operator);
              }

              return of(ret);
            })
          );
        })
      );
    } else if (machine.currentStatusNr === MACHINE_STATUS_NOORDER) {
      operationLogon$ = operationLogon$.pipe(
        switchMap(() => {
          // Change it to MACHINE_STATUS_PRODUCTION
          return this._bapiMDE.changeMachineStatus(machine, MACHINE_STATUS_PRODUCTION, operator);
        })
      );
    }

    return operationLogon$.pipe(
      map((ret: IActionResult) => {
        return Object.assign(ret, {
          description: `Operation ${operation.name} Logged On!`
        });
      })
    );
  }

  interruptOperation(operation: Operation | { name: string }, machine: Machine,
    operator: Operator, yieldQty: number = 0, scrapQty: number = 0, scrapReason: number = 0): Observable<IActionResult> {
    return new InterruptOperation(operation.name, machine.machineName, yieldQty, scrapQty, scrapReason, operator.badge)
      .execute(this._http).pipe(
        switchMap(ret => {
          if (machine.currentOperations.length === 1) {
            // Change it to MACHINE_STATUS_NOORDER
            return this._machineService.hasStatusAssigned(machine.machineName, MACHINE_STATUS_NOORDER).pipe(
              switchMap(exist => {
                if (exist) {
                  return this._bapiMDE.changeMachineStatus(machine, MACHINE_STATUS_NOORDER, operator);
                }

                return of(ret);
              })
            );
          } else {
            return of(ret);
          }
        }),
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

  logoffOperation(operation: Operation | { name: string }, machine: Machine,
    operator: Operator, yieldQty: number = 0, scrapQty: number = 0, scrapReason: number = 0): Observable<IActionResult> {
    return new LogoffOperation(operation.name, machine.machineName, yieldQty, scrapQty, scrapReason, operator.badge)
      .execute(this._http).pipe(
        switchMap(ret => {
          if (machine.currentOperations.length === 1) {
            // Change it to MACHINE_STATUS_NOORDER
            return this._machineService.hasStatusAssigned(machine.machineName, MACHINE_STATUS_NOORDER).pipe(
              switchMap(exist => {
                if (exist) {
                  return this._bapiMDE.changeMachineStatus(machine, MACHINE_STATUS_NOORDER, operator);
                }

                return of(ret);
              })
            );
          } else {
            return of(ret);
          }
        }),
        map((ret: IActionResult) => {
          return Object.assign(ret, {
            description: `Operation ${operation.name} Logged Off!`
          });
        })
      );
  }

  // changeOutputBatch(operation: Operation, machine: Machine, currentBatch: string, qty: number,
  //   operator: Operator): Observable<IActionResult> {

  //   return this._webAPIService.getNextLicenseTag(operation.article, operation.name).pipe(
  //     switchMap(batchName => {
  //       return new ChangeOutputBatch(operation.name, machine.machineName, operator.badge, batchName, 0).execute(this._http);
  //     }),
  //     switchMap(_ => {
  //       return this._batchService.getBatchInformationWithRunning(currentBatch, true);
  //     }),
  //     switchMap(materialBatch => {
  //       const toolStatus = getToolStatus(operation, machine);
  //       const toolUsed = toolStatus.map(status => {
  //         if (status.isReady) return status.toolName;
  //       });
  //       return this._bapiMPL.modifyOutputBatch(materialBatch, qty, operator, toolUsed.join(','));
  //     }),
  //     switchMap(ret => {
  //       if (qty > 0) {
  //         return this._printService.printoutBatchLabel([currentBatch], machine.machineName);
  //       }
  //       return of(ret);
  //     }),
  //     map((ret: IActionResult) => {
  //       if (qty > 0) {
  //         return Object.assign(ret, {
  //           description: `Batch ${currentBatch} Generated And Print!`
  //         });
  //       } else {
  //         return Object.assign(ret, {
  //           description: `Batch ${currentBatch} Abandoned!`
  //         });
  //       }
  //     })
  //   );
  // }

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
