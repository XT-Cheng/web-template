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

  // Order based, by time
  // QUANTITY_GOOD
  // QUANTITY_SCRAP
  // TARGET_DURATION
  // TARGET_CAVITY
  // BMK01
  // BMK02
  // BMK03
  // BMK04
  // BMK05
  // BMK06
  // BMK07
  // BMK08
  // BMK09
  // BMK10
  // BMK11
  // BMK12
  // ORDERNUMBER
  // OEE_LOWER
  // OEE_UPPER
  // SCRAP_LOWER
  // SCRAP_UPPER
  // PERFORMANCE
  // SCRAP
  // SNAPSHOT_TIMESTAMP
  Get24HoursMachineMRAData(machineName: string) {
    return this.http.get<any>(`${this._url}/Get24HoursMachineMRADataJSON`, {
      params: {
        Machine_Number: machineName
      }
    });
  }

  // Machine based, by shift
  // MACHINE_NUMBER
  // SHIFT_DATE
  // SHIFT_NUMBER
  // AVAILABLE_PRODUCTION_TIME
  // OPERATING_TIME
  // BREAKDOWN_TIME
  // SETUP_TIME
  // EFFECTIVE_PRODUCTION_TIME
  // YIELD
  // PLANNED_YIELD
  // AVAILABILITY_RATE
  // PERFORMANCE_RATE
  // QUALITY_RATE
  // OEE
  // CREATE_DATE
  // ARTICLE
  // RUNNING_TIME
  GetCurrentShiftMachineOEEData(machineName: string) {
    return this.http.get<any>(`${this._url}/GetCurrentShiftMachineOEEDataJSON`, {
      params: {
        Machine_Number: machineName
      }
    });
  }

  // Machine based, by shift
  // MACHINE_NUMBER
  // SHIFT_DATE
  // SHIFT_NUMBER
  // REASON_CODE
  // REASON_TEXT
  // CREATE_DATE
  // YIELD
  // REJECTS
  GetCurrentShiftMachineRejectsData(machineName: string) {
    return this.http.get<any>(`${this._url}/GetCurrentShiftMachineRejectsDataJSON`, {
      params: {
        Machine_Number: machineName
      }
    });
  }


  //#endregion
}
