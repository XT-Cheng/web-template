import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, switchMap } from 'rxjs/operators';
import { IActionResult } from '@core/utils/helpers';
import { Operation } from '@core/hydra/entity/operation';
import { Machine } from '@core/hydra/entity/machine';
import { Operator } from '@core/hydra/entity/operator';
import { MaterialBatch, MaterialBuffer } from '@core/hydra/entity/batch';
import { LogonInputBatch } from './logon.inputBatch';
import { Observable, of } from 'rxjs';
import { GoodsMovementBatch } from './goodsMovement.batch';
import { MoveBatch } from './move.batch';
import { CreateBatch } from './create.batch';
import { WebAPIService } from '@core/hydra/service/webapi.service';
import { CopyBatch } from './copy.batch';
import { GenerateBatchConnection } from './generate.batchConnection';
import { LogoffInputBatch } from './logoff.inputBatch';
import { MergeBatch } from './merge.batch';

@Injectable()
export class MPLBapiService {
  //#region Private members

  //#endregion

  //#region Constructor

  constructor(protected _http: HttpClient, private _webAPIService: WebAPIService) {
  }
  //#endregion

  //#region Public methods
  logonInputBatch(operation: Operation | { name: string }, machine: Machine | { machineName: string }, operator: Operator,
    batch: MaterialBatch | { name: string, material: string }, pos: number): Observable<IActionResult> {
    return new LogonInputBatch(operation.name, machine.machineName, operator.badge, batch.name, batch.material, pos)
      .execute(this._http).pipe(
        map((ret: IActionResult) => {
          return Object.assign(ret, {
            description: `Batch ${batch.name} Logged On!`
          });
        })
      );
  }

  logoffInputBatch(operation: Operation | { name: string }, machine: Machine, operator: Operator,
    batch: MaterialBatch | { name: string }, pos: number) {
    return new LogoffInputBatch(operation.name, machine.machineName, operator.badge, batch.name, pos).execute(this._http).pipe(
      map((ret: IActionResult) => {
        return Object.assign(ret, {
          description: `Batch ${batch.name} Logged Off!`
        });
      })
    );
  }

  createBatch(batchName: string, materialNumber: string, matType: string, unit: string, batchQty: number,
    materialBuffer: MaterialBuffer | { name: string }, operator: Operator,
    batchSAP: string = '', dateCode: string = ''): Observable<IActionResult> {
    return new CreateBatch(batchName, materialNumber, matType, unit, batchQty, materialBuffer.name, operator.badge, batchSAP, dateCode)
      .execute(this._http).pipe(
        map((ret: IActionResult) => {
          return Object.assign(ret, {
            description: `Batch ${batchName} Created!`
          });
        })
      );
  }

  changeBatchQuantity(batch: MaterialBatch, newQuantity: number, operator: Operator): Observable<IActionResult> {
    return new GoodsMovementBatch(batch.name, newQuantity,
      batch.materialType, batch.status, batch.class, operator.badge).execute(this._http).pipe(
        map((ret: IActionResult) => {
          return Object.assign(ret, {
            description: `Batch ${batch.name} Quantity Changed!`
          });
        })
      );
  }

  moveBatch(batch: MaterialBatch, destination: MaterialBuffer | { name: string }, operator: Operator): Observable<IActionResult> {
    return new MoveBatch(batch.name, batch.materialType, destination.name, operator.badge).execute(this._http).pipe(
      map((ret: IActionResult) => {
        return Object.assign(ret, {
          description: `Batch ${batch.name} Moved to ${destination.name}!`
        });
      })
    );
  }

  splitBatch(batch: MaterialBatch, numberOfChildren: number, childQty: number, operator: Operator): Observable<IActionResult> {
    return Array.from(Array(numberOfChildren + 1)).reduce((next$, currentValue, currentIndex) => {
      if (currentIndex === numberOfChildren) {
        return next$.pipe(
          switchMap((childrenBatchNames: [string]) => {
            // 2. Adjust Batch Quantity
            return new GoodsMovementBatch(batch.name, batch.quantity,
              batch.materialType, batch.status, batch.class, operator.badge)
              .execute(this._http).pipe(
                map(_ => {
                  return {
                    isSuccess: true,
                    error: ``,
                    content: ``,
                    description: `Batch ${batch.name} Split to ${childrenBatchNames.join(`,`)}!`,
                    context: childrenBatchNames
                  };
                }
                ));
          }));
      } else {
        return next$.pipe(
          // 1. Create new Batch
          switchMap((childrenBatchNames: [string]) => {
            return this._webAPIService.getNextLicenseTag().pipe(
              map((newBatchName) => {
                childrenBatchNames.push(newBatchName);
                return childrenBatchNames;
              }));
          }),
          switchMap((childrenBatchNames: [string]) => {
            return new CopyBatch(batch.name, childrenBatchNames[childrenBatchNames.length - 1],
              childQty, operator.badge).execute(this._http).pipe(
                map(_ => childrenBatchNames)
              );
          }),
          switchMap((childrenBatchNames: [string]) => {
            batch.quantity -= childQty;
            return new GenerateBatchConnection(batch.name, childrenBatchNames[childrenBatchNames.length - 1],
              batch.material, batch.material,
              batch.materialType, batch.materialType).execute(this._http).pipe(
                map(_ => childrenBatchNames)
              );
          }));
      }
    }, of([]));
  }

  mergeBatch(batch: MaterialBatch | { name: string }, toBeMerged: string[], operator: Operator) {
    return new MergeBatch(batch.name, toBeMerged, operator.badge).execute(this._http).pipe(
      map((ret: IActionResult) => {
        return Object.assign(ret, {
          description: `Batch ${toBeMerged} Merged to ${batch.name}!`
        });
      })
    );
  }
  //#endregion
}
