import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Operation, ComponentStatus } from "@core/hydra/entity/operation";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Injectable()
export class OperationWebApi {
    constructor(protected _http: HttpClient) {
    }

    public getComponentStatus(operationName: string, machineName: string): Observable<ComponentStatus[]> {
        return this._http.get(`/api/operationService/componentStatus/${machineName}/${operationName}`).pipe(
            map((compStatus: []) => {
                return compStatus.map(status => OperationWebApi.translateComponentStatus(status));
            })
        )
    }

    public getOperation(operationName: string): Observable<Operation> {
        return this._http.get(`/api/operationService/operation/${operationName}`).pipe(
            map((operation: any) => {
                if (!operation) {
                    throw Error(`${operationName} not exist!`);
                }

                return OperationWebApi.translate(operation);
            })
        )
    }

    public static translateComponentStatus(comp: any): ComponentStatus {
        return {
            operation: comp.OperationName,
            material: comp.Material,
            pos: comp.Pos,
            isReady: comp.IsReady,
            batchName: comp.BatchName,
            quantity: comp.Quantity,
        }
    }

    public static translate(operation: any): Operation {
        var ret = new Operation();

        //#region OperationLightWeight

        ret.order = operation.Order;
        ret.article = operation.Article;
        ret.sequence = operation.Sequence;
        ret.leadOrder = operation.LeadOrder;
        ret.targetQty = operation.TargetQty;
        ret.totalYield = operation.TotalYield;
        ret.totalScrap = operation.TotalScrap;
        ret.targetCycleTime = operation.TargetCycleTime;

        ret.earliestStart = new Date(operation.EarliestStart);
        ret.earliestEnd = new Date(operation.EarliestEnd);
        ret.latestStart = new Date(operation.LatestStart);
        ret.latestEnd = new Date(operation.LatestEnd);
        ret.planStart = new Date(operation.PlanStart);
        ret.planEnd = new Date(operation.PlanEnd);
        ret.scheduleStart = new Date(operation.ScheduleStart);
        ret.scheduleEnd = new Date(operation.ScheduleEnd);
        ret.lastLoggedOn = new Date(operation.LastLoggedOn);

        //#endregion

        //#region Operation

        ret.currentOutputBatch = operation.CurrentOutputBatch;
        ret.pendingProblemQty = operation.PendingProblemQty
        ret.pendingYieldQty = operation.PendingYieldQty
        ret.pendingScrapQty = operation.PendingScrapQty

        if (operation.BomItems) {
            Object.keys(operation.BomItems).forEach((key) => {
                var c = operation.BomItems[key];
                ret.bomItems.set(Number.parseInt(c.key), {
                    material: c.Material,
                    unit: c.Unit,
                    pos: c.Pos,
                    quantity: c.Quantity,
                });
            })
        }
        if (operation.ToolItems) {
            Object.keys(operation.ToolItems).forEach((key) => {
                var c = operation.ToolItems[key];
                ret.toolItems.set(c.key, {
                    requiredMaterial: c.RequiredMaterial,
                    availableTools: c.AvailableTools.map(x => x),
                    requiredQty: c.RequiredQty
                });
            })
        }

        if (operation.ComponentsLoggedOn) {
            Object.keys(operation.ComponentsLoggedOn).forEach((key) => {
                var c = operation.ComponentsLoggedOn[key];
                ret.componentsLoggedOn.set(Number.parseInt(c.key), {
                    operations: [{ name: c.OperationPos[0].Operation, pos: c.OperationPos[0].Pos }],
                    batchName: c.BatchName,
                    material: c.Material,
                    allowLogoff: c.AllowLogoff,
                    machine: c.Machine,
                    batchQty: c.BatchQty,
                });
            })
        }

        if (operation.OperatorsLoggedOn) {
            Object.keys(operation.OperatorsLoggedOn).forEach((key) => {
                var c = operation.OperatorsLoggedOn[key];
                ret.operatorsLoggedOn.set(Number.parseInt(c.key), {
                    personNumber: c.PersonNumber,
                    name: c.Name,
                    badge: c.Badge
                });
            })
        }
        //#endregion

        return ret;
    }
}