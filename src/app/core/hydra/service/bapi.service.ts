import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DialogTypeEnum, IBapiResult } from '@core/hydra/bapi/constants';
import { TestBapi } from '../bapi/test.bapi';
import { CreateBufferBapi } from '../bapi/mpl/master/create.buffer';
import { DeleteBufferBapi } from '../bapi/mpl/master/delete.buffer';
import { CreatePersonBapi } from '../bapi/mpl/master/create.person';
import { DeletePersonBapi } from '../bapi/mpl/master/delete.person';
import { CreateBatch } from '../bapi/mpl/create.batch';
import { MaterialBatch } from '../entity/batch';
import { switchMap, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { UpdateBatch } from '../bapi/mpl/update.batch';
import { GenerateBatchName } from '../bapi/mpl/generate.batchName';
import { CopyBatch } from '../bapi/mpl/copy.batch';
import { GenerateBatchConnection } from '../bapi/mpl/generate.batchConnection';

@Injectable()
export class BapiService {
  //#region Private members

  //#endregion

  //#region Constructor

  constructor(protected _http: HttpClient) {
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
  createBatch(batchName: string, materialNumber: string, batchQty: number,
    materialBuffer: string, badge: string, batch: string = '', dateCode: string = '') {
    return new CreateBatch(batchName, materialNumber, batchQty, materialBuffer, badge, batch, dateCode)
      .execute(this._http);
  }

  splitBatch(batchInfo: MaterialBatch, numberOfChildren: number, childQty: number, badge: string) {
    return Array.from(Array(numberOfChildren + 1)).reduce((next$, currentValue, currentIndex) => {
      if (currentIndex === numberOfChildren) {
        return next$.pipe(
          switchMap(() => {
            return new UpdateBatch(batchInfo.name, badge, batchInfo.quantity).execute(this._http);
          }));
      } else {
        return next$.pipe(
          switchMap(_ => {
            return new GenerateBatchName('W').execute(this._http);
          }),
          switchMap((res: IBapiResult) => {
            const array: Array<string> = res.content.split('|');
            const newBatchName = array.find((item: string) => item.search(`NR=`) > -1)
              .replace('NR=', '').trimRight();
            return new CopyBatch(batchInfo.name, newBatchName, childQty, badge).execute(this._http).pipe(
              map(_ => newBatchName)
            );
          }),
          switchMap((newBatchName: string) => {
            batchInfo.quantity -= childQty;
            return new GenerateBatchConnection(batchInfo.name, newBatchName,
              batchInfo.material, batchInfo.material,
              batchInfo.materialType, batchInfo.materialType).execute(this._http);
          }));
      }
    }, of('start'));
  }
  //#endregion
}
