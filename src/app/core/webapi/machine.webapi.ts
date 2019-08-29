import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { IActionResult } from "@core/utils/helpers";
import { map } from "rxjs/operators";
import { BaseRequest } from "./base.request";
import { Machine } from "@core/hydra/entity/machine";
import { Injectable } from "@angular/core";
import { OperationWebApi } from "./operation.webapi";
import { ReasonCode } from "@core/hydra/entity/reasonCode";

@Injectable()
export class MachineWebApi {
    constructor(protected _http: HttpClient) {
    }

    public changeMachineStatus(req: ChangeMachineStatusReq): Observable<string> {
        return this._http.post(`/api/machineService/changeStatus`, req).pipe(
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
                    toolStatus: tool.ToolStatus,
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

        ret.changeShiftCheckListFinished = machine.ChangeShiftCheckListFinished;

        //#endregion

        //#region CheckList



        //#endregion

        return ret;
    }
}

export class ChangeMachineStatusReq extends BaseRequest {
    public MachineName: string;
    public NewStatus: number;
}