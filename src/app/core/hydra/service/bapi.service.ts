import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DialogTypeEnum } from '@core/hydra/bapi/constants';
import { TestBapi } from '../bapi/test.bapi';
import { CreateBufferBapi } from '../bapi/mpl/master/create.buffer';
import { DeleteBufferBapi } from '../bapi/mpl/master/delete.buffer';
import { CreatePersonBapi } from '../bapi/mpl/master/create.person';
import { DeletePersonBapi } from '../bapi/mpl/master/delete.person';
import { CreateBatch } from '../bapi/mpl/create.batch';
import { MaterialBatch } from '../entity/batch';
import { switchMap, map, zip } from 'rxjs/operators';
import { of, forkJoin, Observable } from 'rxjs';
import { UpdateBatch } from '../bapi/mpl/update.batch';
import { CopyBatch } from '../bapi/mpl/copy.batch';
import { GenerateBatchConnection } from '../bapi/mpl/generate.batchConnection';
import { WebAPIService } from './webapi.service';
import { BatchService } from './batch.service';
import { PrintService } from './print.service';
import { IActionResult } from '@core/utils/helpers';
import { MoveBatch } from '../bapi/mpl/move.batch';
import { GoodsMovementBatch } from '../bapi/mpl/goodsMovement.batch';

@Injectable()
export class BapiService {
  //#region Private members

  //#endregion

  //#region Constructor

  constructor(protected _http: HttpClient, private _webAPIService: WebAPIService,
    private _batchService: BatchService, private _printService: PrintService) {
  }

  //#endregion

  //#region Public methods

  test(type: string, content: string) {
    const typedString = type as keyof typeof DialogTypeEnum;
    return new TestBapi(DialogTypeEnum[typedString], content).execute(this._http);
  }

  //#region MPL Master

  //#region Create Buffer
  createMPLBuffer(name: string, description: string,
    type: string, plant: string, area: string,
    storageLocation: string, parent: string, level: number) {
    return new CreateBufferBapi(name, description, type, plant, area, storageLocation, parent, level).execute(this._http);
  }
  //#endregion

  //#region Delete Buffer
  deleteMPLBuffer(name: string) {
    return new DeleteBufferBapi(name).execute(this._http);
  }
  //#endregion

  //#endregion

  //#region HR Master

  //#region Create Person
  createHRPerson() {
    return new CreatePersonBapi().execute(this._http);
  }
  //#endregion

  //#region Delete Person
  deleteHRPerson() {
    return new DeletePersonBapi().execute(this._http);
  }

  //#endregion

  //#region Batch related
  changeBatchQuantity(batchInfo: MaterialBatch, newQuantity: number, badge: string): Observable<IActionResult> {
    return new GoodsMovementBatch(batchInfo.name, batchInfo.startQty, newQuantity,
      batchInfo.materialType, batchInfo.status, badge).execute(this._http).pipe(
        map((ret: IActionResult) => {
          return Object.assign(ret, {
            description: `Batch ${batchInfo.name} Quantity Changed!`
          });
        })
      );
  }

  moveBatch(batchInfo: MaterialBatch, destination: string, badge: string): Observable<IActionResult> {
    return new MoveBatch(batchInfo.name, batchInfo.materialType, destination, badge).execute(this._http).pipe(
      map((ret: IActionResult) => {
        return Object.assign(ret, {
          description: `Batch ${batchInfo.name} Moved to ${destination}!`
        });
      })
    );
  }

  createBatch(batchName: string, materialNumber: string, matType: string, unit: string, batchQty: number,
    materialBuffer: string, badge: string, batch: string = '', dateCode: string = ''): Observable<IActionResult> {
    return new CreateBatch(batchName, materialNumber, matType, unit, batchQty, materialBuffer, badge, batch, dateCode)
      .execute(this._http).pipe(
        map((ret: IActionResult) => {
          return Object.assign(ret, {
            description: `Batch ${batchName} Created!`
          });
        })
      );
  }

  splitBatch(batchInfo: MaterialBatch, numberOfChildren: number, childQty: number, badge: string): Observable<IActionResult> {
    return Array.from(Array(numberOfChildren + 1)).reduce((next$, currentValue, currentIndex) => {
      if (currentIndex === numberOfChildren) {
        return next$.pipe(
          switchMap((childrenBatchNames: [string]) => {
            return new GoodsMovementBatch(batchInfo.name, batchInfo.startQty,
              batchInfo.quantity, batchInfo.materialType, batchInfo.status, badge)
              .execute(this._http).pipe(
                map(_ => {
                  return {
                    isSuccess: true,
                    error: ``,
                    content: ``,
                    description: `Batch ${batchInfo.name} Split to ${childrenBatchNames.join(`,`)}!`,
                    context: childrenBatchNames
                  };
                }
                ));
          }));
      } else {
        return next$.pipe(
          switchMap((childrenBatchNames: [string]) => {
            return this._webAPIService.getNextLicenseTag().pipe(
              map((newBatchName) => {
                childrenBatchNames.push(newBatchName);
                return childrenBatchNames;
              }));
          }),
          switchMap((childrenBatchNames: [string]) => {
            return new CopyBatch(batchInfo.name, childrenBatchNames[childrenBatchNames.length - 1],
              childQty, badge).execute(this._http).pipe(
                map(_ => childrenBatchNames)
              );
          }),
          switchMap((childrenBatchNames: [string]) => {
            batchInfo.quantity -= childQty;
            return new GenerateBatchConnection(batchInfo.name, childrenBatchNames[childrenBatchNames.length - 1],
              batchInfo.material, batchInfo.material,
              batchInfo.materialType, batchInfo.materialType).execute(this._http).pipe(
                map(_ => childrenBatchNames)
              );
          }));
      }
    }, of([]));
  }
  //#endregion
}
