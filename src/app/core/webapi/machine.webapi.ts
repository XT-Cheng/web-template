import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { IActionResult } from "@core/utils/helpers";
import { map } from "rxjs/operators";
import { BaseRequest } from "./base.request";
import { Machine, MachineOEE, MachineAlarmSetting, MachineOutput } from "@core/hydra/entity/machine";
import { Injectable } from "@angular/core";
import { OperationWebApi } from "./operation.webapi";
import { ReasonCode } from "@core/hydra/entity/reasonCode";
import { ToolMachine } from "@core/hydra/entity/toolMachine";
import { Operator } from "@core/hydra/entity/operator";
import { ProcessType, CheckList, CheckListResult } from "@core/hydra/entity/checkList";
import { MaintenanceStatusEnum } from "@core/hydra/entity/tool";

@Injectable()
export class MachineWebApi {
    constructor(protected _http: HttpClient) {
    }

    public changeMachineStatus(machineName: string, newStatus: number, operator: Operator): Observable<string> {
        return this._http.post(`/api/machineService/changeStatus`, {
            MachineName: machineName,
            NewStatus: newStatus,
            Badge: operator.badge
        }).pipe(
            map((machineName: string) => machineName)
        );
    }

    public getAvailableStatusToChange(machineName: string, manualOnly: boolean = true): Observable<{ status: number, text: string }[]> {
        return this._http.get(`/api/machineService/availableStatusToChange/${machineName}/${manualOnly}`).pipe(
            map((ret: []) => {
                return ret.map((status: any) => {
                    return {
                        status: status.Number,
                        text: status.Description
                    }
                });
            })
        )
    }

    public getScrapReasonByMachine(machineName: string): Observable<ReasonCode[]> {
        return this._http.get(`/api/machineService/scrapReason/${machineName}`).pipe(
            map((ret: []) => {
                return ret.map((reason: any) => {
                    return {
                        codeNbr: reason.Number,
                        description: reason.Description
                    }
                });
            })
        )
    }

    public getMachineLightWeight(machineName: string): Observable<Machine> {
        return this._http.get(`/api/machineService/machineLightWeight/${machineName}`).pipe(
            map((machine: any) => {
                if (!machine) {
                    throw Error(`${machineName} not exist!`);
                }

                return MachineWebApi.translate(machine);
            })
        )
    }

    public getMachine(machineName: string): Observable<Machine> {
        return this._http.get(`/api/machineService/machine/${machineName}`).pipe(
            map((machine: any) => {
                if (!machine) {
                    throw Error(`${machineName} not exist!`);
                }

                return MachineWebApi.translate(machine);
            })
        )
    }

    public getToolMachine(machineName: string): Observable<ToolMachine> {
        return this._http.get(`/api/machineService/toolMachine/${machineName}`).pipe(
            map((machine: any) => {
                if (!machine) {
                    throw Error(`${machineName} not exist!`);
                }

                return MachineWebApi.translateToolMachine(machine);
            })
        )
    }

    public static translate(machine: any): Machine {
        var ret = new Machine();

        // #region MachineLightWeight

        ret.machineName = machine.MachineName;
        ret.description = machine.Description;
        ret.currentStatus = machine.CurrentStatus;
        ret.currentStatusNr = machine.CurrentStatusNr;
        ret.numberOfOperationAllowed = machine.NumberOfOperationAllowed;
        ret.currentShift = machine.CurrentShift;
        ret.currentShiftDate = new Date(machine.CurrentShiftDate);
        ret.lastOperation = machine.LastOperation;
        ret.lastArticle = machine.LastArticle;
        ret.currentShiftStart = new Date(machine.CurrentShiftStart);
        ret.currentShiftEnd = new Date(machine.CurrentShiftEnd);
        ret.toolMachines = machine.AssocaiteToolMachines.map((m: any) => m);
        ret.toolLogonOrder = machine.DeputyToolLogonOperation;

        ret.nextOperations = machine.NextOperations.map(o => {
            return OperationWebApi.translate(o);
        });
        ret.currentOperations = machine.CurrentOperations.map(o => {
            return OperationWebApi.translate(o);
        });

        //#endregion

        //#region Machine

        if (machine.ComponentsLoggedOn) {
            Object.keys(machine.ComponentsLoggedOn).forEach((key) => {
                var c = machine.ComponentsLoggedOn[key];

                ret.componentsLoggedOn.push({
                    operations: c.OperationPos.map(op => {
                        return {
                            name: op.Operation,
                            pos: op.Pos
                        }
                    }),
                    batchName: c.BatchName,
                    material: c.Material,
                    machine: c.Machine,
                    allowLogoff: c.AllowLogoff,
                    batchQty: c.BatchQty,
                });
            })
        }

        if (machine.ToolsLoggedOn) {
            ret.toolsLoggedOn = machine.ToolsLoggedOn.map(tool => {
                return {
                    loggedOnOperation: tool.DeputyOperation,
                    loggedOnMachine: tool.ToolMachine,
                    toolName: tool.ToolName,
                    toolId: tool.ToolId,
                    toolStatus: tool.ToolStatus ? MaintenanceStatusEnum[tool.ToolStatus as string] : null,
                    currentCycle: tool.CurrentCycle,
                };
            })
        }

        if (machine.OperatorsLoggedOn) {
            Object.keys(machine.OperatorsLoggedOn).forEach((key) => {
                var c = machine.OperatorsLoggedOn[key];
                ret.operatorsLoggedOn.push({
                    personNumber: c.PersonNumber,
                    name: c.Name,
                    badge: c.Badge
                });
            })
        }

        //#region CheckList

        if (machine.CheckLists) {
            Object.keys(machine.CheckLists).forEach((key) => {
                var c = machine.CheckLists[key];
                var checkList = new CheckList();
                checkList.processType = ProcessType[key];
                checkList.checkListType = c.CheckListType;
                checkList.headerId = c.HeaderId;

                checkList.items = c.Items.map(item => {
                    return {
                        sequence: item.Sequence,
                        shortText: item.ShortText
                    }
                })

                ret.checkLists.set(ProcessType[key], checkList);
            })
        }

        if (machine.CheckListResultsOfCurrentShift) {
            Object.keys(machine.CheckListResultsOfCurrentShift).forEach((key) => {
                var c = machine.CheckListResultsOfCurrentShift[key];

                var checkListResult = new CheckListResult();
                checkListResult.sequence = c.Sequence;
                checkListResult.answer = c.Answer;
                checkListResult.criticalAnswer = c.CriticalAnswer;
                checkListResult.checkListType = c.CheckListType;
                checkListResult.headerId = c.HeaderId;
                checkListResult.operationName = c.OperationName;
                checkListResult.finishedAt = new Date(c.FinishedAt);
                checkListResult.finishedBy = c.FinishedBy;
                checkListResult.comment = c.Comment;

                ret.checkListResultsOfCurrentShift.set(Number.parseInt(key), checkListResult);
            })
        }

        if (machine.CheckListResultsOfChangeOver) {
            Object.keys(machine.CheckListResultsOfChangeOver).forEach((key) => {
                var c = machine.CheckListResultsOfChangeOver[key];

                var checkListResult = new CheckListResult();
                checkListResult.sequence = c.Sequence;
                checkListResult.answer = c.Answer;
                checkListResult.criticalAnswer = c.CriticalAnswer;
                checkListResult.checkListType = c.CheckListType;
                checkListResult.headerId = c.HeaderId;
                checkListResult.operationName = c.OperationName;
                checkListResult.finishedAt = new Date(c.FinishedAt);
                checkListResult.finishedBy = c.FinishedBy;
                checkListResult.comment = c.Comment;

                ret.checkListResultsOfChangeOver.set(Number.parseInt(key), checkListResult);
            })
        }

        ret.changeShiftCheckListFinished = machine.ChangeShiftCheckListFinished;

        //#endregion

        //#endregion

        //#region Machine Statistics

        if (machine.AlarmSetting) {
            ret.alarmSetting = new MachineAlarmSetting();
            ret.alarmSetting.oeeLower = machine.AlarmSetting.OEE_Lower;
            ret.alarmSetting.oeeUpper = machine.AlarmSetting.OEE_Upper;
            ret.alarmSetting.scrapLower = machine.AlarmSetting.Scrap_Lower;
            ret.alarmSetting.scrapUpper = machine.AlarmSetting.Scrap_Upper;
        }

        if (machine.CurrentShiftOEE) {
            ret.currentShiftOEE = new MachineOEE();
            ret.currentShiftOEE.operationTime = machine.CurrentShiftOEE.OperationTime;
            ret.currentShiftOEE.availability = machine.CurrentShiftOEE.Availability;
            ret.currentShiftOEE.performance = machine.CurrentShiftOEE.Performance;
            ret.currentShiftOEE.quality = machine.CurrentShiftOEE.Quality;
        }

        if (machine.CurrentShiftOutput) {
            ret.currentShiftOutput = new MachineOutput();
            ret.currentShiftOutput.yield = machine.CurrentShiftOutput.Yield;

            Object.keys(machine.CurrentShiftOutput.Scrap).forEach((key) => {
                var c = machine.CurrentShiftOutput.Scrap[key];
                ret.currentShiftOutput.scrap.set(Number.parseInt(key), {
                    scrap: c.ScrapQuantity,
                    scrapCode: c.ScrapQuantity,
                    scrapText: c.ScrapReason
                });
            })
        }

        if (machine.OutputByTime) {
            Object.keys(machine.OutputByTime).forEach((key) => {
                var c = machine.OutputByTime[key];
                ret.output.set(new Date(key), {
                    output: c.Yield,
                    scrap: c.Scrap,
                    performance: c.Performance,
                });
            })
        }

        //#endregion

        return ret;
    }

    public static translateToolMachine(machine: any): ToolMachine {
        var ret = new ToolMachine();

        ret.machineName = machine.MachineName;
        ret.description = machine.Description;

        if (machine.ToolsLoggedOn) {
            ret.toolsLoggedOn = machine.ToolsLoggedOn.map(tool => {
                return {
                    loggedOnOperation: tool.DeputyOperation,
                    loggedOnMachine: tool.ToolMachine,
                    toolName: tool.ToolName,
                    toolId: tool.ToolId,
                    toolStatus: tool.ToolStatus,
                    currentCycle: tool.CurrentCycle,
                };
            })
        }

        return ret;
    }
}

export class ChangeMachineStatusReq extends BaseRequest {

}