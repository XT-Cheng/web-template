import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FetchService } from './fetch.service';
import { Observable, forkJoin } from 'rxjs';
import { Tool } from '../entity/tool';
import { map } from 'rxjs/operators';
import { replaceAll } from '@core/utils/helpers';
import { toNumber } from '@delon/util';

@Injectable()
export class ToolService {
  static toolNameTBR = '$toolName';
  //#region SQLs

  static toolSQL =
    `SELECT RES.RES_ID AS ID, RES.RES_NR AS NAME, RES.BEZEICHNUNG AS DESCRIPTION,
 MAINTENNACE.N_SOLLTAKTE AS NEXTCYCLES, MAINTENNACE.I_TAKTE AS CURRENTCYCLES,
 RESSTATUS.AKTIV AS ACTIVE, RESSTATUS.MASCH_NR AS LOGGEDONTO,
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
    let toolRet: Tool;
    return forkJoin(
      this._fetchService.query(replaceAll(ToolService.toolSQL, [ToolService.toolNameTBR], [toolName]))).pipe(
        map((array: Array<Array<any>>) => {
          const [
            tool] = array;

          if (tool.length === 0) {
            return;
          }

          //#region Initialize Tool
          toolRet = Object.assign(new Tool(), {
            toolName: tool[0].NAME,
            toolId: tool[0].ID,
            description: tool[0].DESCRIPTION,
            currentStatus: tool[0].CURRENTSTATUS,
            currentStatusNr: tool[0].CURRENTSTATUSNR,
          });

          if (tool[0].CURRENTCYCLES) {
            toolRet.currentCycles = toNumber(tool[0].CURRENTCYCLES, -1);
          }

          if (tool[0].NEXTCYCLES) {
            toolRet.nextMaintennaceCycles = toNumber(tool[0].NEXTCYCLES, -1);
          }

          if (tool[0].ACTIVE === 'J') {
            toolRet.occupied = true;
            toolRet.loggedOnMachine = tool[0].LOGGEDONTO;
          } else {
            toolRet.occupied = false;
            toolRet.loggedOnMachine = '';
          }

          return toolRet;
          //#endregion
        })
      );
  }
  //#endregion
}
