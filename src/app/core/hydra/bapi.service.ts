import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, OperatorFunction } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { IBapiResult, DialogTypeEnum } from '@core/hydra/bapi/constants';
import { FetchService } from './fetch.service';
import { TestBapi } from './bapi/test.bapi';
import { CreateBufferBapi } from './bapi/mpl/master/create.buffer';
import { DeleteBufferBapi } from './bapi/mpl/master/delete.buffer';
import { CreatePersonBapi } from './bapi/mpl/master/create.person';
import { DeletePersonBapi } from './bapi/mpl/master/delete.person';

@Injectable()
export class BapiService {
  //#region Private members

  //#endregion

  //#region Constructor

  constructor(protected _http: HttpClient, private _fetchService: FetchService) {
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

  //#endregion

  //#endregion

  //#region Private methods

  private getResult(res: any) {
    return {
      isSuccess: res.isSuccess,
      error: res.error,
      description: res.description,
      content: res.content
    };
  }

  //#endregion
}
