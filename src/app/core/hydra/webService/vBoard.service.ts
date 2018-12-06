import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, concatMap, combineLatest, delay } from 'rxjs/operators';
import { IMachineYieldAndScrap, MachineOEE } from '../interface/machine.interface';

@Injectable()
export class VBoardService {
  //#region Private members

  private _url = 'http://cne35db03:8903/vBoard/vBoardWS.asmx';

  //#endregion

  //#region Constructor

  constructor(protected http: HttpClient) { }

  //#endregion

  //#region Public methods

  Get24HoursMachineMRAData(machineName: string) {
    return this.http.get<any>(`${this._url}/Get24HoursMachineMRADataJSON`, {
      params: {
        Machine_Number: machineName
      }
    });
  }

  GetCurrentShiftMachineOEEData(machineName: string) {
    return this.http.get<any>(`${this._url}/GetCurrentShiftMachineOEEDataJSON`, {
      params: {
        Machine_Number: machineName
      }
    });
  }

  GetCurrentShiftMachineRejectsData(machineName: string) {
    return this.http.get<any>(`${this._url}/GetCurrentShiftMachineRejectsDataJSON`, {
      params: {
        Machine_Number: machineName
      }
    });
  }


  //#endregion
}
