import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { Machine, MachineAlarmSetting, MachineOutput, MachineOEE } from '../entity/machine';
import { HttpClient } from '@angular/common/http';
import { FetchService } from './fetch.service';
import { VBoardService } from './vBoard.service';
import { map, switchMap } from 'rxjs/operators';
import { Operation } from '../entity/operation';
import { toNumber } from '@delon/util';
import { CheckList, CheckListItem, ProcessType, CheckListResult } from '../entity/checkList';
import { format } from 'date-fns';
import { replaceAll, dateFormatOracle, dateFormat } from '@core/utils/helpers';

@Injectable()
export class OperationService {
  static alarmSettingDefault = `default`;
  static machineNameTBR = '$machineName';
  static operationNameTBR = '$operationName';
  static headerIdTBR = '$headerId';
  static shiftDateTBR = '$shiftDate';
  static shiftStartTBR = '$shiftStart';
  static shiftNbrTBR = '$shiftNbr';
  static operationsTBR = '$operations';

  //#region SQLs
  static operationSql =
    `SELECT OPERATION.USER_C_55 AS LEADORDER,
     OPERATION.AUNR AS WORKORDER, OPERATION.AGNR AS SEQUENCE,OPERATION.ARTIKEL AS ARTICLE,
     OP_STATUS.GUT_BAS AS YIELD, OP_STATUS.AUS_BAS AS SCRAP, OPERATION.SOLL_MENGE_BAS AS TARGETQTY, OPERATION.SOLL_DAUER AS TARGET_CYCLE,
     (OPERATION.FRUEH_ANF_DAT + OPERATION.FRUEH_ANF_ZEIT / 60 / 60 / 24) AS EARLIEST_START,
     (OPERATION.FRUEH_END_DAT + OPERATION.FRUEH_END_ZEIT / 60 / 60 / 24) AS EARLIEST_FINISH,
     (OPERATION.SPAET_ANF_DAT + OPERATION.SPAET_ANF_ZEIT / 60 / 60 / 24) AS LATEST_START,
     (OPERATION.SPAET_END_DAT + OPERATION.SPAET_END_ZEIT / 60 / 60 / 24) AS LATEST_FINISH,
     (OPERATION.TERM_ANF_DAT + OPERATION.TERM_ANF_ZEIT / 60 / 60 / 24)  AS SCHEDULE_START,
     (OPERATION.TERM_END_DAT + OPERATION.TERM_END_ZEIT / 60 / 60 / 24)  AS SCHEDULE_FINISH,
     (OPERATION.ERRANF_DAT + OPERATION.ERRANF_ZEIT / 60 / 60 / 24)    AS PLAN_START,
     (OPERATION.ERREND_DAT + OPERATION.ERREND_ZEIT / 60 / 60 / 24)    AS PLAN_FINISH
      FROM AUFTRAGS_BESTAND OPERATION,AUFTRAG_STATUS OP_STATUS
     WHERE OPERATION.AUFTRAG_NR  = '${OperationService.operationNameTBR}' AND OPERATION.AUFTRAG_NR = OP_STATUS.AUFTRAG_NR `;

  static opeartionLoggedOnDateSql =
    `SELECT AUFTRAG_NR AS OPERATION, (PROTOCOL.ABMELD_DAT + PROTOCOL.ABMELDZEIT / 60 / 60 / 24) AS LOGGEDONDATE
     FROM ADE_PROTOKOLL PROTOCOL
     WHERE PROTOCOL.AUFTRAG_NR = '${OperationService.operationNameTBR}' AND SATZ_ART = 'A' AND CHARGEN_NR IS NOT NULL
     ORDER BY AUFTRAG_NR, (ABMELD_DAT + ABMELDZEIT / 60 / 60 / 24) DESC`;

  static operationBOMItemSql =
    `SELECT AUFTRAG_NR AS OPERATION, ARTIKEL AS MATERIAL, POS AS POS, SOLL_MENGE AS QUANTITY, SOLL_EINH AS UNIT
     FROM MLST_HY WHERE KENNZ = 'M' AND AUFTRAG_NR = '${OperationService.operationNameTBR}'`;

  static operationToolItemsSql =
    `SELECT MLST_HY.AUFTRAG_NR AS OPERATION, MLST_HY.ARTIKEL AS REQUIRED_MATERIAL, MLST_HY.SOLL_MENGE AS QUANTITY,
  RES_FERTIGUNG_VAR.WERKZEUG AS TOOLNAME
  FROM MLST_HY, RES_FERTIGUNG_VAR
  WHERE MLST_HY.KENNZ = 'V' AND MLST_HY.AUFTRAG_NR = '${OperationService.operationNameTBR}'
  AND RES_FERTIGUNG_VAR.ARTIKEL = MLST_HY.ARTIKEL`;

  static loggedOnOperatorSql = `SELECT SUBKEY2 AS OPERATION,PERSONALNUMMER AS PERSON, NAME, KARTEN_NUMMER AS BADGE
     FROM HYBUCH,PERSONALSTAMM
     WHERE SUBKEY2 = '${OperationService.operationNameTBR}' AND KEY_TYPE = 'P' AND SUBKEY4 = LPAD(PERSONALNUMMER, 8, '0')`;

  static loggedOnComponentSql =
    `SELECT SUBKEY1 AS MACHINE, SUBKEY2 AS OPERATION, SUBKEY3 AS BATCHID,
     LOS_BESTAND.LOSNR AS BATCH, SUBKEY5 AS POS, MENGE AS QTY,
     RESTMENGE AS REMAINQTY, LOS_BESTAND.ARTIKEL AS MATERIAL FROM HYBUCH, LOS_BESTAND
     WHERE KEY_TYPE = 'C' AND TYP = 'E' AND SUBKEY2 = '${OperationService.operationNameTBR}' AND SUBKEY3 = LOSNR`;

  static loggedOnToolSql =
    `SELECT SUBKEY1 AS MACHINE, SUBKEY2 AS OPERATION, SUBKEY6 AS RESOURCEID,RES_NR AS TOOLNAME, RES_NR_M AS REQUIREDRESOURCE
     FROM HYBUCH, RES_BEDARFSZUORD, RES_BESTAND
     WHERE KEY_TYPE = 'O' AND SUBKEY2 = '${OperationService.operationNameTBR}' AND RES_ID = SUBKEY6 AND RES_NR_T(+) = RES_NR`;

  static loggedOnOperationSql =
    `SELECT PROBLEM_PRI AS PROBLEM , GUT_PRI AS YIELD, AUS_PRI AS SCRAP
     FROM HYBUCH WHERE KEY_TYPE = 'A' AND SUBKEY2 = '${OperationService.operationNameTBR}'`;
  //#endregion

  //#region Private members

  //#endregion

  //#region Constructor

  constructor(protected _httpClient: HttpClient, protected _fetchService: FetchService,
    protected _vBoardService: VBoardService) { }

  //#endregion

  //#region Public methods

  getOperation(operationName: string): Observable<Operation> {
    let operationRet: Operation;
    return forkJoin(
      this._fetchService.query(replaceAll(OperationService.operationSql, [OperationService.operationNameTBR], [operationName])),
      this._fetchService.query(replaceAll(OperationService.opeartionLoggedOnDateSql, [OperationService.operationNameTBR], [operationName])),
      this._fetchService.query(replaceAll(OperationService.operationBOMItemSql, [OperationService.operationNameTBR], [operationName])),
      this._fetchService.query(replaceAll(OperationService.operationToolItemsSql, [OperationService.operationNameTBR], [operationName])),
      this._fetchService.query(replaceAll(OperationService.loggedOnOperatorSql, [OperationService.operationNameTBR], [operationName])),
      this._fetchService.query(replaceAll(OperationService.loggedOnComponentSql, [OperationService.operationNameTBR], [operationName])),
      this._fetchService.query(replaceAll(OperationService.loggedOnOperationSql, [OperationService.operationNameTBR], [operationName])))
      .pipe(
        map((array: Array<Array<any>>) => {
          const [
            opeartion,
            opeartionLastLoggedOn,
            operationBOM,
            operationTool,
            loggedOnOperator,
            loggedOnComponent,
            loggedOnOperation,
          ] = array;

          if (opeartion.length === 0) {
            return null;
          }

          //#region Initialize Operation
          operationRet = Object.assign(new Operation(), {
            order: opeartion[0].WORKORDER,
            sequence: opeartion[0].SEQUENCE,
            article: opeartion[0].ARTICLE,
            targetQty: opeartion[0].TARGETQTY,
            totalYield: opeartion[0].YIELD,
            totalScrap: opeartion[0].SCRAP,
            leadOrder: opeartion[0].LEADORDER,
            targetCycleTime: opeartion[0].TARGET_CYCLE,
            earliestStart: new Date(opeartion[0].EARLIEST_START),
            earliestEnd: new Date(opeartion[0].EARLIEST_FINISH),
            latestStart: new Date(opeartion[0].LATEST_START),
            latestEnd: new Date(opeartion[0].LATEST_FINISH),
            scheduleStart: new Date(opeartion[0].SCHEDULE_START),
            scheduleEnd: new Date(opeartion[0].SCHEDULE_FINISH),
            planStart: new Date(opeartion[0].PLAN_START),
            planEnd: new Date(opeartion[0].PLAN_FINISH),
          });

          //#endregion

          //#region Setup Opearation's Last LoggedOn

          const allLoggedOn = opeartionLastLoggedOn
            .sort((a, b) => a.LOGGEDONDATE > b.LOGGEDONDATE ? 1 : -1);
          if (allLoggedOn.length > 0) {
            operationRet.lastLoggedOn = new Date(allLoggedOn[0].LOGGEDONDATE);
          }

          //#endregion

          //#region Setup BOM Items
          operationBOM.map(item => {
            operationRet.bomItems.set(item.POS, {
              material: item.MATERIAL,
              pos: item.POS,
              quantity: item.QUANTITY,
              unit: item.UNIT,
            });
          });

          //#endregion

          //#region Setup Tool Items
          operationTool.map(item => {
            if (operationRet.toolItems.has(item.REQUIRED_MATERIAL)) {
              operationRet.toolItems.get(item.REQUIRED_MATERIAL).availableTools.push(item.TOOLNAME);
            } else {
              operationRet.toolItems.set(item.REQUIRED_MATERIAL, {
                requiredMaterial: item.REQUIRED_MATERIAL,
                requiredQty: item.QUANTITY,
                availableTools: [item.TOOLNAME]
              });
            }
          });

          //#endregion

          //#region Setup Logged On Operators
          loggedOnOperator.map(operator => {
            operationRet.operatorsLoggedOn.set(operator.PERSON, {
              personNumber: operator.PERSON,
              name: operator.NAME,
              badgeId: operator.BADGE,
            });
          });

          //#endregion

          //#region Setup Logged On Components
          loggedOnComponent.map(component => {
            operationRet.componentsLoggedOn.set(component.POS, {
              allowLogoff: false,
              operation: component.OPERATION,
              batchName: component.BATCHID,
              batchQty: component.REMAINQTY,
              pos: component.POS,
              material: component.MATERIAL,
            });
          });

          //#endregion

          //#region Setup not confirmed quantity
          loggedOnOperation.map(operation => {
            operationRet.pendingProblemQty = toNumber(operation.PROBLEM);
            operationRet.pendingYieldQty = toNumber(operation.YIELD);
            operationRet.pendingScrapQty = toNumber(operation.SCRAP);
          });
          //#endregion
          return operationRet;
        }));
  }

  //#region Private methods

  //#endregion
}
