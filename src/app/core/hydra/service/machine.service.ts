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
export class MachineService {
  static alarmSettingDefault = `default`;
  static machineNameTBR = '$machineName';
  static operationNameTBR = '$operationName';
  static headerIdTBR = '$headerId';
  static shiftDateTBR = '$shiftDate';
  static shiftStartTBR = '$shiftStart';
  static shiftNbrTBR = '$shiftNbr';
  static operationsTBR = '$operations';

  //#region SQLs
  static machineAlarmSql =
    `SELECT OEE_LOWER, OEE_UPPER, SCRAP_LOWER, SCRAP_UPPER ` +
    `FROM U_TE_MRA_SETTINGS ` +
    `WHERE MACHINE = '${MachineService.machineNameTBR}'`;

  static machineSql =
    `SELECT MACHINE.MASCH_NR AS MACHINE, MACHINE.BEZ_LANG AS DESCRIPTION, STATUS.M_STATUS AS STATUS, ` +
    `TEXT.STOER_TEXT AS TEXT, STATUS.SCHICHTNR AS SHIFTNR, STATUS.DATUM AS SHIFTDATE, ` +
    `(STATUS.DATUM + STATUS.SCHICHTANF / 60 / 60 / 24) AS SHIFTSTART, ` +
    `(STATUS.DATUM + STATUS.SCHICHTEND / 60 / 60 / 24) AS SHIFTEND ` +
    `FROM MASCHINEN MACHINE, MASCHINEN_STATUS STATUS, STOERTEXTE TEXT ` +
    `WHERE MACHINE.MASCH_NR = '${MachineService.machineNameTBR}' ` +
    `AND STATUS.MASCH_NR = MACHINE.MASCH_NR AND TEXT.STOERTXT_NR = STATUS.M_STATUS`;

  static machineCurrentOPSql =
    `SELECT MACHINE.MASCH_NR AS MACHINE,OPERATION.USER_C_55 AS LEADORDER, ` +
    `OPERATION.AUNR AS WORKORDER, OPERATION.AGNR AS SEQUENCE,OPERATION.ARTIKEL AS ARTICLE, ` +
    `OP_STATUS.GUT_BAS AS YIELD, OP_STATUS.AUS_BAS AS SCRAP, OPERATION.SOLL_MENGE_BAS AS TARGETQTY, OPERATION.SOLL_DAUER AS TARGET_CYCLE,` +
    `(OPERATION.FRUEH_ANF_DAT + OPERATION.FRUEH_ANF_ZEIT / 60 / 60 / 24) AS EARLIEST_START, ` +
    `(OPERATION.FRUEH_END_DAT + OPERATION.FRUEH_END_ZEIT / 60 / 60 / 24) AS EARLIEST_FINISH, ` +
    `(OPERATION.SPAET_ANF_DAT + OPERATION.SPAET_ANF_ZEIT / 60 / 60 / 24) AS LATEST_START, ` +
    `(OPERATION.SPAET_END_DAT + OPERATION.SPAET_END_ZEIT / 60 / 60 / 24) AS LATEST_FINISH, ` +
    `(OPERATION.TERM_ANF_DAT + OPERATION.TERM_ANF_ZEIT / 60 / 60 / 24)  AS SCHEDULE_START, ` +
    `(OPERATION.TERM_END_DAT + OPERATION.TERM_END_ZEIT / 60 / 60 / 24)  AS SCHEDULE_FINISH, ` +
    `(OPERATION.ERRANF_DAT + OPERATION.ERRANF_ZEIT / 60 / 60 / 24)    AS PLAN_START, ` +
    `(OPERATION.ERREND_DAT + OPERATION.ERREND_ZEIT / 60 / 60 / 24)    AS PLAN_FINISH` +
    ` FROM MASCHINEN MACHINE,HYBUCH,AUFTRAGS_BESTAND OPERATION,AUFTRAG_STATUS OP_STATUS ` +
    `WHERE MACHINE.MASCH_NR = '${MachineService.machineNameTBR}' AND OPERATION.AUFTRAG_NR = OP_STATUS.AUFTRAG_NR ` +
    ` AND HYBUCH.SUBKEY2 = OPERATION.AUFTRAG_NR ` +
    ` AND HYBUCH.SUBKEY1  = MACHINE.MASCH_NR AND HYBUCH.KEY_TYPE = 'A'`;

  static machineCurrentOPLoggedOnDateSql =
    `SELECT AUFTRAG_NR AS OPERATION, (PROTOCOL.ABMELD_DAT + PROTOCOL.ABMELDZEIT / 60 / 60 / 24) AS LOGGEDONDATE ` +
    `FROM ADE_PROTOKOLL PROTOCOL ` +
    `WHERE PROTOCOL.AUFTRAG_NR IN (${MachineService.operationsTBR}) AND SATZ_ART = 'A' AND CHARGEN_NR IS NOT NULL ` +
    `ORDER BY AUFTRAG_NR, (ABMELD_DAT + ABMELDZEIT / 60 / 60 / 24) DESC`;

  static machinePreviousOPSql =
    `SELECT OPERATION.AUFTRAG_NR AS OPERATIONNAME, OPERATION.ARTIKEL AS ARTICLE FROM (SELECT AUFTRAG_NR AS OPERATIONNAME ` +
    `FROM ADE_PROTOKOLL WHERE MASCH_NR = '${MachineService.machineNameTBR}' AND SATZ_ART = 'A' ` +
    `ORDER BY  (ABMELD_DAT + ABMELDZEIT / 60 / 60 / 24) DESC) LASTLOGGEDON, AUFTRAGS_BESTAND OPERATION ` +
    `WHERE ROWNUM < 3 AND OPERATION.AUFTRAG_NR = OPERATIONNAME`;

  static operationBOMItemsSql =
    `SELECT AUFTRAG_NR AS OPERATION, ARTIKEL AS MATERIAL, POS AS POS, SOLL_MENGE AS QUANTITY, SOLL_EINH AS UNIT ` +
    ` FROM MLST_HY WHERE KENNZ = 'M' AND AUFTRAG_NR IN ` +
    ` (SELECT HYBUCH.SUBKEY2 FROM HYBUCH WHERE HYBUCH.SUBKEY1 = '${MachineService.machineNameTBR}' AND HYBUCH.KEY_TYPE = 'A')`;

  static operationToolItemsSql =
    `SELECT AUFTRAG_NR AS OPERATION, ARTIKEL AS REQUIRED_TOOL, SOLL_MENGE AS QUANTITY ` +
    ` FROM MLST_HY WHERE KENNZ = 'W' AND  AUFTRAG_NR IN ` +
    ` (SELECT HYBUCH.SUBKEY2 FROM HYBUCH WHERE HYBUCH.SUBKEY1 = '${MachineService.machineNameTBR}' AND HYBUCH.KEY_TYPE = 'A')`;

  static machineNextOPSql =
    `SELECT OPERATION.USER_C_55 AS LEADORDER, ` +
    `OPERATION.AUNR AS WORKORDER, OPERATION.AGNR AS SEQUENCE, OPERATION.ARTIKEL AS ARTICLE, ` +
    `OP_STATUS.GUT_BAS AS YIELD, OP_STATUS.AUS_BAS AS SCRAP, OPERATION.SOLL_MENGE_BAS AS TARGETQTY, OPERATION.SOLL_DAUER AS TARGET_CYCLE,` +
    `(OPERATION.FRUEH_ANF_DAT + OPERATION.FRUEH_ANF_ZEIT / 60 / 60 / 24) AS EARLIEST_START, ` +
    `(OPERATION.FRUEH_END_DAT + OPERATION.FRUEH_END_ZEIT / 60 / 60 / 24) AS EARLIEST_FINISH, ` +
    `(OPERATION.SPAET_ANF_DAT + OPERATION.SPAET_ANF_ZEIT / 60 / 60 / 24) AS LATEST_START, ` +
    `(OPERATION.SPAET_END_DAT + OPERATION.SPAET_END_ZEIT / 60 / 60 / 24) AS LATEST_FINISH, ` +
    `(OPERATION.TERM_ANF_DAT + OPERATION.TERM_ANF_ZEIT / 60 / 60 / 24)  AS SCHEDULE_START, ` +
    `(OPERATION.TERM_END_DAT + OPERATION.TERM_END_ZEIT / 60 / 60 / 24)  AS SCHEDULE_FINISH, ` +
    `(OPERATION.ERRANF_DAT + OPERATION.ERRANF_ZEIT / 60 / 60 / 24) AS PLAN_START, ` +
    `(OPERATION.ERREND_DAT + OPERATION.ERREND_ZEIT / 60 / 60 / 24) AS PLAN_FINISH ` +
    ` FROM AUFTRAGS_BESTAND OPERATION, AUFTRAG_STATUS OP_STATUS ` +
    ` WHERE OPERATION.MASCH_NR = '${MachineService.machineNameTBR}' AND OPERATION.AUFTRAG_NR = OP_STATUS.AUFTRAG_NR ` +
    ` AND OP_STATUS.PROD_KENN <> 'L' AND OP_STATUS.PROD_KENN <> 'E' ORDER BY (ERRANF_DAT + ERRANF_ZEIT / 60 / 60 / 24)`;

  static loggedOnOperatorSql = `SELECT SUBKEY2 AS OPERATION,PERSONALNUMMER AS PERSON, NAME, KARTEN_NUMMER AS BADGE ` +
    `FROM HYBUCH,PERSONALSTAMM ` +
    `WHERE SUBKEY1 = '${MachineService.machineNameTBR}' AND KEY_TYPE = 'P' AND SUBKEY4 =  LPAD(PERSONALNUMMER, 8, '0')`;

  static loggedOnComponentSql =
    `SELECT SUBKEY1 AS MACHINE, SUBKEY2 AS OPERATION, SUBKEY3 AS BATCHID, ` +
    `LOS_BESTAND.LOSNR AS BATCH, SUBKEY5 AS POS, MENGE AS QTY, ` +
    `RESTMENGE AS REMAINQTY, LOS_BESTAND.ARTIKEL AS MATERIAL FROM HYBUCH, LOS_BESTAND ` +
    `WHERE KEY_TYPE = 'C' AND TYP = 'E' AND SUBKEY1 = '${MachineService.machineNameTBR}' AND SUBKEY3 = LOSNR`;

  static loggedOnToolSql =
    `SELECT SUBKEY1 AS MACHINE, SUBKEY2 AS OPERATION, SUBKEY6 AS RESOURCEID,RES_NR AS TOOLNAME, RES_NR_M AS REQUIREDRESOURCE ` +
    `FROM HYBUCH, RES_BEDARFSZUORD, RES_BESTAND ` +
    `WHERE KEY_TYPE = 'O' AND SUBKEY1 = '${MachineService.machineNameTBR}' AND RES_ID = SUBKEY6 AND RES_NR_T(+) = RES_NR`;

  static operationShiftOutputSql =
    `SELECT NVL(ADE.MACHINE_NUMBER, HBZ.MACHINE_NUMBER) MACHINE_NUMBER, ` +
    `NVL(ADE.SHIFT_DATE, HBZ.SHIFT_DATE) SHIFT_DATE , ` +
    `NVL(ADE.SHIFT_NUMBER, HBZ.SHIFT_NUMBER) SHIFT_NUMBER , ` +
    `NVL(ADE.OPERATION, HBZ.OPERATION) OPERATION, ` +
    `NVL(ADE.REASON_CODE, HBZ.REASON_CODE) REASON_CODE , ` +
    `NVL(ADE.REASON_TEXT, HBZ.REASON_TEXT) REASON_TEXT , ` +
    `NVL(ADE.YIELD,0)   + NVL(HBZ.YIELD,0) YIELD , ` +
    `NVL(ADE.REJECTS,0) + NVL(HBZ.REJECTS,0) REJECTS ` +
    `FROM ` +
    `(SELECT MST.MASCH_NR MACHINE_NUMBER , ` +
    `MST.DATUM SHIFT_DATE , ` +
    `MST.SCHICHTNR SHIFT_NUMBER , ` +
    `SUM(AP.GUT_PRI) YIELD , ` +
    `SUM(AP.AUS_PRI) REJECTS , ` +
    `AP.AUFTRAG_NR OPERATION, ` +
    `AP.AUS_GRUND REASON_CODE , ` +
    `AGT1.GRUNDTEXT REASON_TEXT ` +
    `FROM MASCHINEN_STATUS MST  ` +
    `INNER JOIN ADE_PROTOKOLL AP ` +
    `ON MST.MASCH_NR   = AP.MASCH_NR ` +
    `AND MST.DATUM     = AP.SCHICHT_DAT ` +
    `AND MST.SCHICHTNR = AP.SCHICHTNR ` +
    ` AND AP.SATZ_ART   = 'T' ` +
    `LEFT OUTER JOIN ADE_GRUND_TEXTE AGT1 ` +
    `ON AGT1.GRUNDTEXT_NR = AP.AUS_GRUND ` +
    `WHERE (AP.GUT_PRI   <> 0 ` +
    `OR AP.AUS_PRI       <> 0 ) ` +
    `AND MST.DATUM = TO_DATE('${MachineService.shiftDateTBR}', '${dateFormatOracle}') ` +
    `AND MST.SCHICHTNR = '${MachineService.shiftNbrTBR}' ` +
    `AND MST.MASCH_NR = '${MachineService.machineNameTBR}'  ` +
    `AND AP.AUFTRAG_NR IN (${MachineService.operationsTBR}) ` +
    `GROUP BY MST.MASCH_NR, ` +
    `MST.DATUM, ` +
    `MST.SCHICHTNR, ` +
    `AP.AUFTRAG_NR, ` +
    `AP.AUS_GRUND, ` +
    `AGT1.GRUNDTEXT ` +
    `) ADE ` +
    `FULL OUTER JOIN ` +
    `(SELECT MST.MASCH_NR MACHINE_NUMBER , ` +
    `MST.DATUM SHIFT_DATE , ` +
    `MST.SCHICHTNR SHIFT_NUMBER , ` +
    `SUM( ` +
    `CASE ` +
    `WHEN UPPER(HBZ.TYP) LIKE 'GUT%' ` +
    `THEN HBZ.WERT ` +
    `ELSE 0 ` +
    `END) YIELD , ` +
    `SUM( ` +
    `CASE ` +
    `WHEN UPPER(HBZ.TYP) LIKE 'AUS%' ` +
    `THEN HBZ.WERT ` +
    `ELSE 0 ` +
    `END) REJECTS , ` +
    `HBZ.SUBKEY2 OPERATION, ` +
    `HBZ.GRUND REASON_CODE , ` +
    `AGT2.GRUNDTEXT REASON_TEXT ` +
    `FROM MASCHINEN_STATUS MST ` +
    `INNER JOIN HYBUCH_ZUSATZ HBZ ` +
    `ON MST.MASCH_NR = HBZ.SUBKEY1 ` +
    `AND MST.DATUM BETWEEN TRUNC(SYSDATE-2) AND TRUNC(SYSDATE) ` +
    `LEFT OUTER JOIN ADE_GRUND_TEXTE AGT2 ` +
    `ON AGT2.GRUNDTEXT_NR = HBZ.GRUND ` +
    `WHERE  ( ` +
    `CASE ` +
    `WHEN UPPER(HBZ.TYP) LIKE 'GUT%' ` +
    `THEN HBZ.WERT ` +
    `ELSE 0 ` +
    `END) <> 0 ` +
    ` OR ( ` +
    `CASE ` +
    `WHEN UPPER(HBZ.TYP) LIKE 'AUS%' ` +
    `THEN HBZ.WERT ` +
    `ELSE 0 ` +
    `END) <> 0 ` +
    `AND MST.DATUM = TO_DATE('${MachineService.shiftDateTBR}', '${dateFormatOracle}') ` +
    `AND MST.SCHICHTNR = '${MachineService.shiftNbrTBR}' ` +
    `AND MST.MASCH_NR = '${MachineService.machineNameTBR}'  ` +
    `AND HBZ.SUBKEY2 IN (${MachineService.operationsTBR}) ` +
    `GROUP BY MST.MASCH_NR, ` +
    `MST.DATUM, ` +
    `MST.SCHICHTNR, ` +
    `HBZ.SUBKEY2, ` +
    `HBZ.GRUND, ` +
    `AGT2.GRUNDTEXT ` +
    `) HBZ ON ADE.MACHINE_NUMBER = HBZ.MACHINE_NUMBER ` +
    `AND ADE.SHIFT_DATE            = HBZ.SHIFT_DATE ` +
    `AND ADE.SHIFT_NUMBER          = HBZ.SHIFT_NUMBER ` +
    `AND ADE.REASON_CODE           = HBZ.REASON_CODE ` +
    `ORDER BY MACHINE_NUMBER, ` +
    `SHIFT_DATE, ` +
    `SHIFT_NUMBER, ` +
    `OPERATION, ` +
    `REASON_CODE`;

  static machineCheckListItemSql =
    `SELECT CHECKLIST_TYPE.PMDM_HEADER_ID,CHECKLIST_TYPE.MACHINE_NUMBER,CHECKLIST_TYPE.CHECKLIST_TYPE, ` +
    `CHECKLIST_TYPE.PROCESS_TYPE,PMDM_DATA.PMDM_DATA FROM ` +
    `(SELECT DISTINCT H.PMDM_HEADER_ID, ` +
    `  HD1.PMDM_HEADER_DATA AS MACHINE_NUMBER, ` +
    `  HD2.PMDM_HEADER_DATA AS CHECKLIST_TYPE, ` +
    `  HD3.PMDM_HEADER_DATA AS PROCESS_TYPE ` +
    `FROM U_TE_PMDM_HEADER H, ` +
    `  U_TE_PMDM_HEADER_DATA HD1, ` +
    `  U_TE_PMDM_PROCESSES PCS1, ` +
    `  U_TE_PMDM_PROCESS P, ` +
    `  U_TE_PMDM_HEADER_DATA HD2, ` +
    `  U_TE_PMDM_PROCESSES PCS2, ` +
    `  U_TE_PMDM_HEADER_DATA HD3, ` +
    `  U_TE_PMDM_PROCESSES PCS3 ` +
    `WHERE H.PMDM_HEADER_ID           = HD1.PMDM_HEADER_ID ` +
    `AND HD1.PMDM_PROCESSES_ID        = PCS1.PMDM_PROCESSES_ID ` +
    `AND PCS1.PMDM_PROCESS_ID         = P.PMDM_PROCESS_ID ` +
    `AND H.PMDM_HEADER_ID             = HD2.PMDM_HEADER_ID ` +
    `AND HD2.PMDM_PROCESSES_ID        = PCS2.PMDM_PROCESSES_ID ` +
    `AND P.PMDM_PROCESS_ID            = PCS2.PMDM_PROCESS_ID ` +
    `AND H.PMDM_HEADER_ID             = HD3.PMDM_HEADER_ID ` +
    `AND HD3.PMDM_PROCESSES_ID        = PCS3.PMDM_PROCESSES_ID ` +
    `AND P.PMDM_PROCESS_ID            = PCS3.PMDM_PROCESS_ID ` +
    `AND (PCS1.PMDM_FIELD_NAME        = 'MachineNumber') ` +
    `AND (PCS2.PMDM_FIELD_NAME        = 'CheckListType') ` +
    `AND (PCS3.PMDM_FIELD_NAME        = 'ProcessType') ` +
    `AND (P.PMDM_BUSINESS_PROCESS     = 'CheckLists') ` +
    `AND H.PMDM_STATUS_VALUE          = '09' ` +
    `AND UPPER(HD1.PMDM_HEADER_DATA)  = '${MachineService.machineNameTBR}' ` +
    `AND UPPER(HD3.PMDM_HEADER_DATA) IN ('CHANGEOVER','CHANGESHIFT')) CHECKLIST_TYPE, ` +
    `(SELECT U_TE_PMDM_DATA.PMDM_HEADER_ID, ` +
    `  U_TE_PMDM_DATA.PMDM_DATA ` +
    `FROM U_TE_PMDM_PROCESS, ` +
    `  U_TE_PMDM_PROCESSES, ` +
    `  U_TE_PMDM_DATA ` +
    `WHERE U_TE_PMDM_PROCESS.PMDM_PROCESS_ID       = U_TE_PMDM_PROCESSES.PMDM_PROCESS_ID ` +
    `AND U_TE_PMDM_DATA.PMDM_PROCESSES_ID          = U_TE_PMDM_PROCESSES.PMDM_PROCESSES_ID ` +
    `AND (U_TE_PMDM_PROCESS.PMDM_BUSINESS_PROCESS  = 'CheckLists') ` +
    `AND (U_TE_PMDM_PROCESSES.PMDM_FIELD_NAME      = 'CheckList')) PMDM_DATA ` +
    `WHERE PMDM_DATA.PMDM_HEADER_ID = CHECKLIST_TYPE.PMDM_HEADER_ID`;

  static machineCheckListDoneOfCurrentShift =
    `SELECT TERMINAL_NR,PMDM_HEADER_ID,CHECKLIST_TYPE,CHECKLIST_TIMESTAMP,CHECKLIST_SEQUENCE,MACHINE_NUMBER,PART_NUMBER, ` +
    `PART_DESCRIPTION, RESOURCE_NUMBER,OPERATION_NUMBER,OPERATION_DESCRIPTION,CHECKLIST_QUESTION,CHECKLIST_ANSWER, ` +
    `TOLERANCES_REQUIRED, TOLERANCES_COMPARER, TOLERANCES_INPUT, STEP_START_TIMESTAMP, STEP_START_USER,STEP_END_TIMESTAMP, ` +
    `STEP_END_USER,STEP_COMMENT,ORIGINAL_CHECKLIST_ITEM_STRING,ORIGINAL_HEADER_STRING,CHECKLIST_IS_CRITICAL_ANSWER, ` +
    `CHECKLIST_CRITICAL_ANSWERS, SSRW_EVENT_ID, PERSONALSTAMM.NAME ` +
    `FROM U_TE_PMDM_CHECKLIST_RESULTS, PERSONALSTAMM WHERE MACHINE_NUMBER = '${MachineService.machineNameTBR}' ` +
    `AND PMDM_HEADER_ID =  '${MachineService.headerIdTBR}' ` +
    `AND STEP_END_TIMESTAMP IS NOT NULL ` +
    `AND STEP_END_TIMESTAMP > TO_DATE('${MachineService.shiftStartTBR}', '${dateFormatOracle}') ` +
    `AND PERSONALSTAMM.PERSONALNUMMER(+) = U_TE_PMDM_CHECKLIST_RESULTS.STEP_END_USER ` +
    `ORDER BY STEP_END_TIMESTAMP DESC, CHECKLIST_SEQUENCE`;

  static machineCheckListDoneOfChangeOver =
    `SELECT TERMINAL_NR,PMDM_HEADER_ID,CHECKLIST_TYPE,CHECKLIST_TIMESTAMP,CHECKLIST_SEQUENCE,MACHINE_NUMBER,PART_NUMBER, ` +
    `PART_DESCRIPTION, RESOURCE_NUMBER,OPERATION_NUMBER,OPERATION_DESCRIPTION,CHECKLIST_QUESTION,CHECKLIST_ANSWER, ` +
    `TOLERANCES_REQUIRED, TOLERANCES_COMPARER, TOLERANCES_INPUT, STEP_START_TIMESTAMP, STEP_START_USER,STEP_END_TIMESTAMP, ` +
    `STEP_END_USER,STEP_COMMENT,ORIGINAL_CHECKLIST_ITEM_STRING,ORIGINAL_HEADER_STRING,CHECKLIST_IS_CRITICAL_ANSWER, ` +
    `CHECKLIST_CRITICAL_ANSWERS, SSRW_EVENT_ID, PERSONALSTAMM.NAME ` +
    `FROM U_TE_PMDM_CHECKLIST_RESULTS, PERSONALSTAMM  WHERE MACHINE_NUMBER = '${MachineService.machineNameTBR}' ` +
    `AND PMDM_HEADER_ID =  '${MachineService.headerIdTBR}' ` +
    `AND STEP_END_TIMESTAMP IS NOT NULL ` +
    `AND OPERATION_NUMBER = '${MachineService.operationNameTBR}' ` +
    `AND PERSONALSTAMM.PERSONALNUMMER(+) = U_TE_PMDM_CHECKLIST_RESULTS.STEP_END_USER ` +
    `ORDER BY STEP_END_TIMESTAMP DESC, CHECKLIST_SEQUENCE`;

  //#endregion

  //#region Private members

  //#endregion

  //#region Constructor

  constructor(protected _httpClient: HttpClient, protected _fetchService: FetchService,
    protected _vBoardService: VBoardService) { }

  //#endregion

  //#region Public methods

  getMachineWithMock(): Observable<Machine> {
    return this._httpClient.get('/machine').pipe(
      map(rec => <Machine>rec)
    );
  }

  getMachine(machineName: string): Observable<Machine> {
    let machineRet: Machine;
    return forkJoin(
      this._fetchService.query(replaceAll(MachineService.machineSql, [MachineService.machineNameTBR], [machineName])),
      this._fetchService.query(replaceAll(MachineService.machineCurrentOPSql, [MachineService.machineNameTBR], [machineName])),
      this._fetchService.query(replaceAll(MachineService.operationBOMItemsSql, [MachineService.machineNameTBR], [machineName])),
      this._fetchService.query(replaceAll(MachineService.operationToolItemsSql, [MachineService.machineNameTBR], [machineName])),
      this._fetchService.query(replaceAll(MachineService.machineNextOPSql, [MachineService.machineNameTBR], [machineName])),
      this._fetchService.query(replaceAll(MachineService.loggedOnOperatorSql, [MachineService.machineNameTBR], [machineName])),
      this._fetchService.query(replaceAll(MachineService.loggedOnComponentSql, [MachineService.machineNameTBR], [machineName])),
      this._fetchService.query(replaceAll(MachineService.loggedOnToolSql, [MachineService.machineNameTBR], [machineName])),
      this._fetchService.query(replaceAll(MachineService.machineCheckListItemSql, [MachineService.machineNameTBR], [machineName])),
      this._fetchService.query(replaceAll(MachineService.machinePreviousOPSql, [MachineService.machineNameTBR], [machineName])),
      this._vBoardService.Get24HoursMachineMRAData(machineName),
      this._vBoardService.GetCurrentShiftMachineOEEData(machineName),
      this._vBoardService.GetCurrentShiftMachineRejectsData(machineName),
      this._fetchService.query(replaceAll(MachineService.machineAlarmSql, [MachineService.machineNameTBR], [machineName])))
      .pipe(
        map((array: Array<Array<any>>) => {
          const [
            machine,
            machineCurrentOP,
            bomItems,
            toolItems,
            machineNextOP,
            loggedOnOperator,
            loggedOnComponent,
            loggedOnTool,
            checkListItems,
            machinePreviousOP,
            mraData,
            currentShiftOEE,
            currentShiftOutput,
            alarmSetting] = array;

          if (machine.length === 0) {
            return null;
          }

          //#region Initialize Machine
          machineRet = Object.assign(new Machine(), {
            machineName: machine[0].MACHINE,
            description: machine[0].DESCRIPTION,
            currentStatusNr: machine[0].STATUS,
            currentStatus: machine[0].TEXT,
            currentShift: machine[0].SHIFTNR,
            currentShiftDate: new Date(machine[0].SHIFTDATE),
            currentShiftStart: new Date(machine[0].SHIFTSTART),
            currentShiftEnd: new Date(machine[0].SHIFTEND),
          });

          //#endregion

          //#region Setup Current Operations
          machineCurrentOP.forEach(rec => {
            const operation = Object.assign(new Operation(), {
              order: rec.WORKORDER,
              sequence: rec.SEQUENCE,
              article: rec.ARTICLE,
              targetQty: rec.TARGETQTY,
              totalYield: rec.YIELD,
              totalScrap: rec.SCRAP,
              leadOrder: rec.LEADORDER,
              targetCycleTime: rec.TARGET_CYCLE,
              earliestStart: new Date(rec.EARLIEST_START),
              earliestEnd: new Date(rec.EARLIEST_FINISH),
              latestStart: new Date(rec.LATEST_START),
              latestEnd: new Date(rec.LATEST_FINISH),
              scheduleStart: new Date(rec.SCHEDULE_START),
              scheduleEnd: new Date(rec.SCHEDULE_FINISH),
              planStart: new Date(rec.PLAN_START),
              planEnd: new Date(rec.PLAN_FINISH),
              lastLoggedOn: new Date(rec.LAST_LOGGEDON),
            });

            // Setup BOM Items
            bomItems.filter(item => item.OPERATION === operation.name).map(item => {
              operation.bomItems.set(item.POS, {
                material: item.MATERIAL,
                pos: item.POS,
                quantity: item.QUANTITY,
                unit: item.UNIT,
              });
            });

            // Setup Tool Items
            toolItems.filter(item => item.OPERATION === operation.name).map(item => {
              operation.toolItems.set(item.REQUIRED_TOOL, {
                requiredTooL: item.REQUIRED_TOOL,
                requiredQty: item.QUANTITY,
              });
            });


            // Setup Logged On Operators
            loggedOnOperator.filter(item => item.OPERATION === operation.name).map(operator => {
              operation.operatorLoggedOn.set(operator.PERSON, {
                personNumber: operator.PERSON,
                name: operator.NAME,
                badgeId: operator.BADGE,
              });
            });

            // Setup Logged On Components
            loggedOnComponent.filter(item => item.OPERATION === operation.name).map(component => {
              operation.componentsLoggedOn.set(component.POS, {
                batchName: component.BATCHID,
                batchQty: component.REMAINQTY,
                pos: component.POS,
                material: component.MATERIAL,
              });
            });

            // Setup Logged On Tools
            loggedOnTool.filter(item => item.OPERATION === operation.name).map(tool => {
              operation.toolLoggedOn.set(tool.TOOLNAME, {
                toolName: tool.TOOLNAME,
                requiredTool: tool.REQUIREDRESOURCE,
              });
            });

            // Setup Operation's output
            mraData.filter(item => item.ORDERNUMBER === operation.name).map(mraItem => {
              const found = Array.from(operation.output.keys()).find(key =>
                key.getTime() === new Date(mraItem.SNAPSHOT_TIMESTAMP).getTime());

              if (found) {
                const ot = operation.output.get(found);
                ot.yield += mraItem.QUANTITY_GOOD;
                ot.scrap += mraItem.QUANTITY_SCRAP;
                ot.performance += mraItem.PERFORMANCE;
              } else {
                operation.output.set(new Date(mraItem.SNAPSHOT_TIMESTAMP), {
                  yield: mraItem.QUANTITY_GOOD,
                  scrap: mraItem.QUANTITY_SCRAP,
                  performance: mraItem.PERFORMANCE,
                });
              }
            });

            machineRet.currentOperations.push(operation);
          });

          //#endregion

          //#region Setup Previous Article
          if (machineRet.currentOperation) {
            machinePreviousOP.map(rec => {
              if (rec.OPERATIONNAME === machineRet.currentOperation.name) {
                return;
              } else {
                machineRet.previousOperation = rec.OPERATIONNAME;
                machineRet.previousArticle = rec.ARTICLE;
              }
            });
          } else if (machinePreviousOP.length > 0) {
            machineRet.previousOperation = machinePreviousOP[0].OPERATIONNAME;
            machineRet.previousArticle = machinePreviousOP[0].ARTICLE;
          }

          //#endregion

          //#region Setup Next Operations
          machineNextOP.forEach(rec => {
            const operation = Object.assign(new Operation(), {
              order: rec.WORKORDER,
              sequence: rec.SEQUENCE,
              article: rec.ARTICLE,
              targetQty: rec.TARGETQTY,
              totalYield: rec.YIELD,
              totalScrap: rec.SCRAP,
              leadOrder: rec.LEADORDER,
              targetCycleTime: rec.TARGET_CYCLE,
              earliestStart: new Date(rec.EARLIEST_START),
              earliestEnd: new Date(rec.EARLIEST_FINISH),
              latestStart: new Date(rec.LATEST_START),
              latestEnd: new Date(rec.LATEST_FINISH),
              scheduleStart: new Date(rec.SCHEDULE_START),
              scheduleEnd: new Date(rec.SCHEDULE_FINISH),
              planStart: new Date(rec.PLAN_START),
              planEnd: new Date(rec.PLAN_FINISH),
              lastLoggedOn: new Date(rec.LAST_LOGGEDON),
            });

            machineRet.nextOperations.push(operation);
          });

          machineRet.nextOperations.sort((a, b) => a.planStart > b.planStart ? 1 : -1);

          //#endregion

          //#region Setup Machine's output
          mraData.map(mraItem => {
            const found = Array.from(machineRet.output.keys()).find(key =>
              key.getTime() === new Date(mraItem.SNAPSHOT_TIMESTAMP).getTime());

            if (found) {
              const ot = machineRet.output.get(found);
              ot.yield += mraItem.QUANTITY_GOOD;
              ot.scrap += mraItem.QUANTITY_SCRAP;
              ot.performance += mraItem.PERFORMANCE;
            } else {
              machineRet.output.set(new Date(mraItem.SNAPSHOT_TIMESTAMP), {
                yield: mraItem.QUANTITY_GOOD,
                scrap: mraItem.QUANTITY_SCRAP,
                performance: mraItem.PERFORMANCE,
              });
            }
          });

          //#endregion

          //#region Setup Current Shift OEE
          machineRet.currentShiftOEE = new MachineOEE();
          currentShiftOEE.map(oee => {
            machineRet.currentShiftOEE = Object.assign(machineRet.currentShiftOEE, {
              availability: toNumber(oee.AVAILABILITY_RATE * 100, Machine.FRACTION_DIGIT),
              performance: toNumber(oee.PERFORMANCE_RATE * 100, Machine.FRACTION_DIGIT),
              quality: toNumber(oee.QUALITY_RATE * 100, Machine.FRACTION_DIGIT),
            });
          });

          //#endregion

          //#region Setup Machine's Current Shift Output
          machineRet.currentShiftOutput = new MachineOutput();
          machineRet.currentShiftOutput.yield = currentShiftOutput.reduce((previousValue, currentValue) => {
            previousValue += currentValue.YIELD;
            return previousValue;
          }, 0);
          currentShiftOutput.filter(rec => rec.REASON_CODE > 0).map(rec => {
            if (machineRet.currentShiftOutput.scrap.has(rec.REASON_CODE)) {
              machineRet.currentShiftOutput.scrap.get(rec.REASON_CODE).scrap += rec.REJECTS;
            } else {
              machineRet.currentShiftOutput.scrap.set(rec.REASON_CODE, {
                scrapCode: rec.REASON_CODE,
                scrapText: rec.REASON_TEXT,
                scrap: rec.REJECTS,
              });
            }
          });

          //#endregion

          //#region Setup Alarm Setting
          if (alarmSetting.length === 0) {
            machineRet.alarmSetting = Object.assign(new MachineAlarmSetting(), {
              oeeLower: 55,
              oeeUpper: 80,
              scrapLower: 5,
              scrapUpper: 1,
            });
          } else if (alarmSetting.length === 1) {
            machineRet.alarmSetting = Object.assign(new MachineAlarmSetting(), {
              oeeLower: alarmSetting[0].OEE_LOWER,
              oeeUpper: alarmSetting[0].OEE_UPPER,
              scrapLower: alarmSetting[0].SCRAP_LOWER,
              scrapUpper: alarmSetting[0].SCRAP_UPPER,
            });
          } else {
            const found = alarmSetting.find(setting => setting.MACHINE !== MachineService.alarmSettingDefault);
            machineRet.alarmSetting = Object.assign(new MachineAlarmSetting(), {
              oeeLower: found.OEE_LOWER,
              oeeUpper: found.OEE_UPPER,
              scrapLower: found.SCRAP_LOWER,
              scrapUpper: found.SCRAP_UPPER,
            });
          }
          //#endregion

          //#region Setup Machine's Check List Items

          checkListItems.map(rec => {
            const checkList = new CheckList();
            checkList.headerId = rec.PMDM_HEADER_ID;
            checkList.checkListType = rec.CHECKLIST_TYPE;
            checkList.processType = rec.PROCESS_TYPE;
            checkList.items = this.processCheckListItems(rec.PMDM_DATA);

            machineRet.checkLists.set(checkList.processType, checkList);
          });

          //#endregion

          return machineRet;
        }),
        //#region Fetch Shift Change Check List Results
        switchMap((machine) => {
          const checkList = machine.checkLists.get(ProcessType.CHANGESHIFT);
          const ds = format(machine.currentShiftStart, dateFormat);
          if (!checkList) return of([]);
          return this._fetchService.query(replaceAll(MachineService.machineCheckListDoneOfCurrentShift
            , [MachineService.machineNameTBR, MachineService.headerIdTBR, MachineService.shiftStartTBR]
            , [machine.machineName, checkList.headerId.toString(), format(machine.currentShiftStart, dateFormat)]));
        }),
        map((checkListResults: any[]) => {
          checkListResults.map(rec => {
            const result = new CheckListResult();
            result.headerId = rec.PMDM_HEADER_ID;
            result.sequence = rec.CHECKLIST_SEQUENCE;
            result.finishedAt = new Date(rec.STEP_END_TIMESTAMP);
            result.finishedBy = rec.NAME;
            result.checkListType = rec.CHECKLIST_TYPE;
            result.comment = rec.STEP_COMMENT;
            result.operationName = rec.OPERATION_NUMBER;

            if (machineRet.checkListResultsOfCurrentShift.has(result.sequence)) {
              const exist = machineRet.checkListResultsOfCurrentShift.get(result.sequence);
              if (exist.finishedAt < rec.STEP_END_TIMESTAMP) {
                machineRet.checkListResultsOfCurrentShift.set(result.sequence, result);
              }
            } else {
              machineRet.checkListResultsOfCurrentShift.set(result.sequence, result);
            }
          });

          return machineRet;
        }),
        //#endregion
        //#region Fetch Change Over Check List Results
        switchMap((machine) => {
          const checkList = machine.checkLists.get(ProcessType.CHANGEOVER);

          if (!checkList) return of([]);

          if (!machine.currentOperation) return of([]);

          return this._fetchService.query(replaceAll(MachineService.machineCheckListDoneOfChangeOver
            , [MachineService.machineNameTBR, MachineService.headerIdTBR, MachineService.operationNameTBR]
            , [machine.machineName, checkList.headerId.toString(), machine.currentOperation.name]));

        }),
        map((checkListResults: any[]) => {
          checkListResults.map(rec => {
            const result = new CheckListResult();
            result.headerId = rec.PMDM_HEADER_ID;
            result.sequence = rec.CHECKLIST_SEQUENCE;
            result.finishedAt = new Date(rec.STEP_END_TIMESTAMP);
            result.finishedBy = rec.NAME;
            result.checkListType = rec.CHECKLIST_TYPE;
            result.comment = rec.STEP_COMMENT;
            result.operationName = rec.OPERATION_NUMBER;

            if (machineRet.checkListResultsOfChangeOver.has(result.sequence)) {
              const exist = machineRet.checkListResultsOfChangeOver.get(result.sequence);
              if (exist.finishedAt < rec.STEP_END_TIMESTAMP) {
                machineRet.checkListResultsOfChangeOver.set(result.sequence, result);
              }
            } else {
              machineRet.checkListResultsOfChangeOver.set(result.sequence, result);
            }
          });

          return machineRet;
        }),
        //#endregion
        //#region Setup Opearation's Last LoggedOn
        switchMap((machine) => {
          if (machine.currentOperations.length === 0) return of([]);

          const operationNames = [];
          machine.currentOperations.map((op) => operationNames.push(`'` + op.name + `'`));

          return this._fetchService.query(replaceAll(MachineService.machineCurrentOPLoggedOnDateSql
            , [MachineService.operationsTBR]
            , [operationNames.join(',')]));

        }),
        map((lastLoggedOn: any[]) => {
          if (lastLoggedOn.length === 0) return machineRet;

          machineRet.currentOperations.map((op) => {
            // Setup Last Logged On
            const allLoggedOn = lastLoggedOn
              .filter(rec => rec.OPERATION === op.name)
              .sort((a, b) => a.LOGGEDONDATE > b.LOGGEDONDATE ? 1 : -1);
            if (allLoggedOn.length > 0) {
              op.lastLoggedOn = new Date(allLoggedOn[0].LOGGEDONDATE);
            }
          });
          machineRet.currentOperations.sort((a, b) => a.lastLoggedOn > b.lastLoggedOn ? 1 : -1);

          return machineRet;
        }),
        //#endregion
        //#region Setup Opeartion's Current Shift Output
        switchMap((machine) => {
          if (machine.currentOperations.length === 0) return of([]);

          const operationNames = [];
          machine.currentOperations.map((op) => operationNames.push(`'` + op.name + `'`));

          return this._fetchService.query(replaceAll(MachineService.operationShiftOutputSql
            , [MachineService.machineNameTBR, MachineService.shiftDateTBR, MachineService.shiftNbrTBR, MachineService.operationsTBR]
            , [machine.machineName, format(machine.currentShiftDate, dateFormat), machine.currentShift.toString()
              , operationNames.join(',')]));
        }),
        map((opShiftOutput: any[]) => {
          if (opShiftOutput.length === 0) return machineRet;

          machineRet.currentOperations.map((op) => {
            // Setup Current Shift Output
            op.currentShiftOutput = new MachineOutput();
            op.currentShiftOutput.yield = opShiftOutput.filter((rec) => rec.OPERATION === op.name).reduce((previousValue, currentValue) => {
              previousValue += currentValue.YIELD;
              return previousValue;
            }, 0);
            opShiftOutput.filter(rec => rec.REASON_CODE > 0).map(rec => {
              if (op.currentShiftOutput.scrap.has(rec.REASON_CODE)) {
                op.currentShiftOutput.scrap.get(rec.REASON_CODE).scrap += rec.REJECTS;
              } else {
                op.currentShiftOutput.scrap.set(rec.REASON_CODE, {
                  scrapCode: rec.REASON_CODE,
                  scrapText: rec.REASON_TEXT,
                  scrap: rec.REJECTS,
                });
              }
            });
          });

          return machineRet;
        }));
    //#endregion
  }

  //#region Private methods
  private processCheckListItems(data: string) {
    const ret = [];
    const lines = data.split(`\n`);
    const fields = lines[0].split(`\t`);

    for (let index = 1; index < lines.length; index++) {
      const column = lines[index];
      const parsed = column.split(`\t`);
      const item = new CheckListItem();
      for (let colIndex = 0; colIndex < fields.length; colIndex++) {
        switch (fields[colIndex]) {
          case `Short Text`:
            item.shortText = parsed[colIndex];
            break;
          case `Code`:
            item.sequence = toNumber(parsed[colIndex]);
            break;
          default:
            break;
        }
      }
      ret.push(item);
    }

    return ret;
  }
  //#endregion
}
