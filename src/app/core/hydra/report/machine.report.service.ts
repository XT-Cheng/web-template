import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError, forkJoin } from 'rxjs';
import { map, concatMap, combineLatest, delay } from 'rxjs/operators';
import { FetchService } from '../fetch.service';
import { Machine, Operation } from '../interface/machine.interface';
import { VBoardService } from '../webService/vBoard.service';

@Injectable()
export class MachineReportService {
  //#region Private members

  //#endregion

  //#region Constructor

  constructor(protected _fetchService: FetchService, protected _vBoardService: VBoardService) { }

  //#endregion

  //#region Public methods

  getMachine(machineName: string) {
    const machineAlarmSql =
      `SELECT OEE_LOWER, OEE_UPPER, SCRAP_LOWER, SCRAP_UPPER ` +
      `FROM U_TE_MRA_SETTINGS ` +
      `WHERE MACHINE = '${machineName}'`;

    const machineSql =
      `SELECT MACHINE.MASCH_NR AS MACHINE, MACHINE.BEZ_LANG AS DESCRIPTION, STATUS.M_STATUS AS STATUS, ` +
      `TEXT.STOER_TEXT AS TEXT, STATUS.SCHICHTNR AS SHIFTNR ` +
      `FROM MASCHINEN MACHINE, MASCHINEN_STATUS STATUS, STOERTEXTE TEXT ` +
      `WHERE MACHINE.MASCH_NR = '${machineName}' ` +
      `AND STATUS.MASCH_NR = MACHINE.MASCH_NR AND TEXT.STOERTXT_NR = STATUS.M_STATUS`;

    const machineCurrentOPSql =
      `SELECT MACHINE.MASCH_NR AS MACHINE,HYBUCH.SUBKEY2 AS OPERATION,OPERATION.USER_C_55 AS LEADORDER, ` +
      `OP_STATUS.GUT_BAS AS YIELD, OP_STATUS.AUS_BAS AS SCRAP, PPS.SOLL_MENGE_BAS AS TARGETQTY, PPS.SOLL_DAUER AS TARGET_CYCLE,` +
      `(PPS.ERREND_DAT %2B PPS.ERREND_ZEIT / 24 / 3600) AS PLANNED_FINISHED ` +
      ` FROM MASCHINEN MACHINE,HYBUCH,AUFTRAGS_BESTAND OPERATION,AUFTRAG_STATUS OP_STATUS,PPS_BESTAND PPS ` +
      `WHERE MACHINE.MASCH_NR = '${machineName}' AND OPERATION.AUFTRAG_NR = OP_STATUS.AUFTRAG_NR ` +
      ` AND PPS.AUFTRAG_NR = OPERATION.AUFTRAG_NR AND HYBUCH.SUBKEY2 = OPERATION.AUFTRAG_NR ` +
      ` AND HYBUCH.SUBKEY1  = MACHINE.MASCH_NR AND HYBUCH.KEY_TYPE = 'A'`;

    const operationBOMItemsSql =
      `SELECT AUFTRAG_NR AS OPERATION, ARTIKEL AS MATERIAL, POS AS POS, SOLL_MENGE AS QUANTITY, SOLL_EINH AS UNIT ` +
      ` FROM MLST_HY WHERE AUFTRAG_NR IN ` +
      ` (SELECT HYBUCH.SUBKEY2 FROM HYBUCH WHERE HYBUCH.SUBKEY1 = '${machineName}' AND HYBUCH.KEY_TYPE = 'A')`;

    const machineNextOPSql =
      `SELECT OP.AUFTRAG_NR AS NEXTOPERATION, OP.USER_C_55 AS LEADORDER, ` +
      ` (OP.TERM_ANF_DAT %2B OP.TERM_ANF_ZEIT / 3600 / 24) AS STARTDATE ` +
      ` FROM AUFTRAGS_BESTAND OP, AUFTRAG_STATUS STATUS ` +
      ` WHERE OP.MASCH_NR = '${machineName}' AND OP.AUFTRAG_NR = STATUS.AUFTRAG_NR ` +
      ` AND STATUS.A_STATUS <> 'L'  ORDER BY TERM_ANF_DAT, TERM_ANF_ZEIT`;

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
      this._fetchService.query(operationBOMItemsSql),
      this._fetchService.query(machineNextOPSql),
      this._fetchService.query(loggedOnOperatorSql),
      this._fetchService.query(loggedOnComponentSql),
      this._fetchService.query(loggedOnToolSql),
      this._vBoardService.Get24HoursMachineMRAData(machineName),
      this._vBoardService.GetCurrentShiftMachineOEEData(machineName),
      this._vBoardService.GetCurrentShiftMachineRejectsData(machineName),
      this._fetchService.query(machineAlarmSql))
      .pipe(
        map((array) => {
          const [
            machine,
            machineCurrentOP,
            bomItems,
            machineNextOP,
            loggedOnOperator,
            loggedOnComponent,
            loggedOnTool,
            mraData,
            currentShiftOEE,
            currentShiftOutput,
            alarmSetting] = array;

          if (machine.length === 0) {
            return null;
          }

          const ret = Object.assign(new Machine(), {
            name: machine[0].MACHINE,
            description: machine[0].DESCRIPTION,
            currentStatusNr: machine[0].STATUS,
            currentStatus: machine[0].TEXT,
            nextOperation: machineNextOP.length > 0 ? machineNextOP[0].NEXTOPERATION : ``,
            currentLeadOrder: machineCurrentOP.length > 0 ? machineCurrentOP[0].LEADORDER : ``,
            nextLeadOrder: machineNextOP.length > 0 ? machineNextOP[0].LEADORDER : ``,
            currentShift: machine[0].SHIFTNR
          });

          if (machineCurrentOP.length > 0) {
            ret.currentOperation = Object.assign(new Operation(), {
              name: machineCurrentOP[0].OPERATION,
              targetQty: machineCurrentOP[0].TARGETQTY,
              totalYield: machineCurrentOP[0].YIELD,
              totalScrap: machineCurrentOP[0].SCRAP,
              targetCycleTime: machineCurrentOP[0].TARGET_CYCLE,
              scheduleCompleted: new Date(machineCurrentOP[0].PLANNED_FINISHED)
            });

            bomItems.forEach(item => {
              ret.currentOperation.bomItems.set(item.POS, {
                material: item.MATERIAL,
                pos: item.POS,
                quantity: item.QUANTITY,
                unit: item.UNIT,
              });
            });
          }

          if (alarmSetting.length > 0) {
            ret.alarmSetting = {
              oeeLower: alarmSetting[0].OEE_LOWER,
              oeeUpper: alarmSetting[0].OEE_UPPER,
              scrapLower: alarmSetting[0].SCRAP_LOWER,
              scrapUpper: alarmSetting[0].SCRAP_UPPER,
            };
          } else {
            ret.alarmSetting = {
              oeeLower: 55,
              oeeUpper: 80,
              scrapLower: 5,
              scrapUpper: 1,
            };
          }

          if (currentShiftOEE.length > 0) {
            ret.currentShiftOEE.availability = currentShiftOEE[0].AVAILABILITY_RATE;
            ret.currentShiftOEE.performance = currentShiftOEE[0].PERFORMANCE_RATE;
            ret.currentShiftOEE.quality = currentShiftOEE[0].QUALITY_RATE;
          }

          if (currentShiftOutput.length > 0) {
            ret.currentShiftOEE.yield = currentShiftOutput.reduce((previousValue, currentValue, currentIndex) => {
              previousValue += currentValue.YIELD;
              return previousValue;
            }, 0);
            ret.currentShiftOEE.scrap = currentShiftOutput.reduce((previousValue, currentValue, currentIndex) => {
              previousValue += currentValue.REJECTS;
              return previousValue;
            }, 0);
          }

          if (ret.currentOperation) {
            mraData.forEach(rec => {
              if (rec.ORDERNUMBER === ret.currentOperation.name) {
                ret.machineYieldAndScrap.set(new Date(rec.SNAPSHOT_TIMESTAMP), {
                  yield: rec.QUANTITY_GOOD,
                  scrap: rec.QUANTITY_SCRAP,
                  performance: rec.PERFORMANCE,
                });
              }
            });
          }

          loggedOnOperator.forEach(operator => {
            ret.operatorLoggedOn.set(operator.PERSON, {
              personNumber: operator.PERSON,
              name: operator.NAME,
              badgeId: operator.BADGE,
            });
          });

          loggedOnComponent.forEach(component => {
            ret.componentLoggedOn.set(component.POS, {
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

          ret.caculate();
          return ret;
        }));
  }

  getMachineStatistics(machineName: string) {

  }
  //#endregion
}
