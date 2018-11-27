import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError, forkJoin } from 'rxjs';
import { map, concatMap, combineLatest, delay } from 'rxjs/operators';
import { FetchService } from '../fetch.service';
import { Machine } from '../interface/common.interface';
import { VBoardService } from '../webService/vBoard.service';

@Injectable()
export class MachineReportService {
  //#region Private members

  private _url = 'fetch';

  //#endregion

  //#region Constructor

  constructor(protected _fetchService: FetchService, protected _vBoardService: VBoardService) { }

  //#endregion

  //#region Public methods

  getMachine(machineName: string) {
    const machineSql =
      `SELECT MACHINE.MASCH_NR AS MACHINE, STATUS.M_STATUS AS STATUS, TEXT.STOER_TEXT AS TEXT, STATUS.SCHICHTNR AS SHIFTNR ` +
      `FROM MASCHINEN MACHINE, MASCHINEN_STATUS STATUS, STOERTEXTE TEXT ` +
      `WHERE MACHINE.MASCH_NR = '${machineName}' ` +
      `AND STATUS.MASCH_NR = MACHINE.MASCH_NR AND TEXT.STOERTXT_NR = STATUS.M_STATUS`;

    const machineCurrentOPSql =
      `SELECT MACHINE.MASCH_NR AS MACHINE, HYBUCH.SUBKEY2 AS OPERATION, AUFTRAGS_BESTAND.USER_C_55 AS LEADORDER ` +
      `FROM MASCHINEN MACHINE, HYBUCH, AUFTRAGS_BESTAND ` +
      `WHERE MACHINE.MASCH_NR = '${machineName}' AND HYBUCH.SUBKEY2 = AUFTRAGS_BESTAND.AUFTRAG_NR ` +
      `AND HYBUCH.SUBKEY1(%2B) = MACHINE.MASCH_NR AND HYBUCH.KEY_TYPE(%2B) = 'A'`;

    const machineNextOPSql =
      `SELECT OP.AUFTRAG_NR AS NEXTOPERATION, OP.USER_C_55 AS LEADORDER, ` +
      ` (OP.TERM_ANF_DAT %2B OP.TERM_ANF_ZEIT / 3600 / 24) AS STARTDATE ` +
      ` FROM AUFTRAGS_BESTAND OP, AUFTRAG_STATUS STATUS ` +
      ` WHERE OP.MASCH_NR = '${machineName}' AND OP.AUFTRAG_NR = STATUS.AUFTRAG_NR ` +
      ` AND STATUS.A_STATUS <> 'L'  ORDER BY  TERM_ANF_DAT, TERM_ANF_ZEIT`;

    const loggedOnOperatorSql = `SELECT PERSONALNUMMER AS PERSON, NAME, KARTEN_NUMMER AS BADGE ` +
      `FROM HYBUCH,PERSONALSTAMM ` +
      `WHERE SUBKEY1 = '${machineName}' AND KEY_TYPE = 'P' AND SUBKEY4 =  LPAD(PERSONALNUMMER, 8, '0')`;

    const loggedOnComponentSql =
      `SELECT SUBKEY1 AS MACHINE, SUBKEY2 AS OPERATION, SUBKEY3 AS BATCHID, ` +
      `LOS_BESTAND.LOSNR AS BATCH, SUBKEY5 AS POS, MENGE AS QTY, ` +
      `RESTMENGE AS REMAINQTY, LOS_BESTAND.ARTIKEL AS MATERIAL FROM HYBUCH, LOS_BESTAND ` +
      `WHERE KEY_TYPE = 'C' AND TYP = 'E' AND SUBKEY1 = '${machineName}' AND SUBKEY3 = LOSNR`;

    const loggedOnToolSql =
      `SELECT SUBKEY1 AS MACHINE, SUBKEY2 AS OPERATION, SUBKEY6 AS RESOURCEID,RES_NR AS TOOLNAME, RES_NR_M AS REQUIREDRESOURCE ` +
      `FROM HYBUCH, RES_BEDARFSZUORD, RES_BESTAND ` +
      `WHERE KEY_TYPE = 'O' AND SUBKEY1 = '${machineName}' AND RES_ID = SUBKEY6 AND RES_NR_T(%2B) = RES_NR`;

    return forkJoin(
      this._fetchService.query(machineSql),
      this._fetchService.query(machineCurrentOPSql),
      this._fetchService.query(machineNextOPSql),
      this._fetchService.query(loggedOnOperatorSql),
      this._fetchService.query(loggedOnComponentSql),
      this._fetchService.query(loggedOnToolSql),
      this._vBoardService.Get24HoursMachineMRAData(machineName),
      this._vBoardService.GetCurrentShiftMachineOEEData(machineName))
      .pipe(
        map((array) => {
          const [
            machine,
            machineCurrentOP,
            machineNextOP,
            loggedOnOperator,
            loggedOnComponent,
            loggedOnTool,
            mraData,
            currentShiftOEE] = array;

          if (machine.length === 0) {
            return null;
          }

          const ret = Object.assign(new Machine(), {
            name: machine[0].MACHINE,
            currentStatusNr: machine[0].STATUS,
            currentStatus: machine[0].TEXT,
            currentOperation: machineCurrentOP.length > 0 ? machineCurrentOP[0].OPERATION : ``,
            nextOperation: machineNextOP.length > 0 ? machineNextOP[0].NEXTOPERATION : ``,
            currentLeadOrder: machineCurrentOP.length > 0 ? machineCurrentOP[0].LEADORDER : ``,
            nextLeadOrder: machineNextOP.length > 0 ? machineNextOP[0].LEADORDER : ``,
            currentShift: machine[0].SHIFTNR
          });

          if (currentShiftOEE.length > 0) {
            ret.currentShiftOEE.availability = currentShiftOEE[0].AVAILABILITY_RATE;
            ret.currentShiftOEE.performance = currentShiftOEE[0].PERFORMANCE_RATE;
            ret.currentShiftOEE.quality = currentShiftOEE[0].QUALITY_RATE;
          }

          mraData.forEach(rec => {
            ret.machineYieldAndScrap.set(rec.SNAPSHOT_TIMESTAMP, {
              yield: rec.QUANTITY_GOOD,
              scrap: rec.QUANTITY_SCRAP,
            });
          });

          loggedOnOperator.forEach(operator => {
            ret.operatorLoggedOn.set(operator.PERSON, {
              personNumber: operator.PERSON,
              name: operator.NAME,
              badgeId: operator.BADGE,
            });
          });

          loggedOnComponent.forEach(component => {
            ret.componentLoggedOn.set(component.BATCHID, {
              batchName: component.BATCHID,
              batchQty: component.REMAINQTY,
              bomItem: component.POS,
              material: component.MATERIAL,
            });
          });

          loggedOnTool.forEach(tool => {
            ret.toolLoggedOn.set(tool.TOOLNAME, {
              toolName: tool.TOOLNAME,
              requiredTool: tool.REQUIREDRESOURCE,
            });
          });

          return ret;
        }));
  }

  getMachineStatistics(machineName: string) {

  }
  //#endregion
}
