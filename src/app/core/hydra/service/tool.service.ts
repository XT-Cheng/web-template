import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FetchService } from './fetch.service';
import { Observable, forkJoin } from 'rxjs';
import { Tool, MaintenanceStatusEnum } from '../entity/tool';
import { map } from 'rxjs/operators';
import { replaceAll } from '@core/utils/helpers';
import { toNumber } from '@delon/util';

@Injectable()
export class ToolService {
  static toolNameTBR = '$toolName';
  //#region SQLs

  static toolSQL =
    `SELECT RES.RES_ID AS ID, RES.RES_NR AS NAME, RES.BEZEICHNUNG AS DESCRIPTION,
 MAINTENNACE.WART_ID AS MAIN_ID, MAINTENNACE.ZUSTAND AS MAIN_STATUS, MAINTENNACE.S_SOLLTAKTE AS INTERVALCYCLES,
 MAINTENNACE.N_SOLLTAKTE AS NEXTCYCLES, MAINTENNACE.I_TAKTE AS CURRENTCYCLES,
 RESSTATUS.AKTIV AS ACTIVE, RESSTATUS.MASCH_NR AS LOGGEDONTO,RESSTATUS.AUFTRAG_NR AS LOGGEDONOP,
 STATUSTEXT.STATUSTEXT AS CURRENTSTATUS, RESSTATUS.STATUS AS CURRENTSTATUSNR
 FROM RES_BESTAND RES, RES_WARTUNGEN MAINTENNACE, RES_STATUS RESSTATUS, RES_STATUS_ZUORD STATUSTEXT
 WHERE RES.RES_NR = '${ToolService.toolNameTBR}' AND RES.RES_TYP = 'VOR'
 AND RESSTATUS.RES_ID = RES.RES_ID AND STATUSTEXT.STATUS = RESSTATUS.STATUS AND STATUSTEXT.RES_TYP = 'VOR'
 AND RES.RES_ID = MAINTENNACE.RES_ID(+)`;

  //#endregion

  //#region Private members

  //#endregion

  //#region Constructor

  constructor(protected _httpClient: HttpClient, protected _fetchService: FetchService) { }

  //#endregion

  //#region Public methods
  getTool(toolName: string): Observable<Tool> {
    let toolRet: Tool = null;
    return forkJoin(
      this._fetchService.query(replaceAll(ToolService.toolSQL, [ToolService.toolNameTBR], [toolName]))).pipe(
        map((array: Array<Array<any>>) => {
          const [tool] = array;

          if (tool.length === 0) {
            return null;
          }

          //#region Initialize Tool
          toolRet = Object.assign(new Tool(), {
            toolName: tool[0].NAME,
            toolId: tool[0].ID,
            description: tool[0].DESCRIPTION,
            currentStatus: tool[0].CURRENTSTATUS,
            currentStatusNr: tool[0].CURRENTSTATUSNR,
          });

          if (tool[0].MAIN_ID) {
            toolRet.nextMaintennaceCycles = toNumber(tool[0].NEXTCYCLES, -1);
            toolRet.currentCycles = toNumber(tool[0].CURRENTCYCLES, -1);
            toolRet.intervalCycles = toNumber(tool[0].INTERVALCYCLES, -1);
            toolRet.maintenanceId = toNumber(tool[0].MAIN_ID, -1);
            switch (tool[0].MAIN_STATUS) {
              case 0:
                toolRet.maintenanceStatus = MaintenanceStatusEnum.GREEN;
                break;
              case 1:
                toolRet.maintenanceStatus = MaintenanceStatusEnum.BLUE;
                break;
              case 2:
                toolRet.maintenanceStatus = MaintenanceStatusEnum.YELLOW;
                break;
              case 3:
                toolRet.maintenanceStatus = MaintenanceStatusEnum.RED;
                break;
              default:
                break;
            }
          }

          if (tool[0].ACTIVE === 'J') {
            toolRet.occupied = true;
            toolRet.loggedOnMachine = tool[0].LOGGEDONTO;
            toolRet.loggedOnOperation = tool[0].LOGGEDONOP;
          } else {
            toolRet.occupied = false;
            toolRet.loggedOnMachine = '';
            toolRet.loggedOnOperation = '';
          }

          return toolRet;
          //#endregion
        })
      );
  }
  //#endregion
}
