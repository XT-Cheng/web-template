import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Injectable } from "@angular/core";
import { Tool } from "@core/hydra/entity/tool";
import { Operator } from "@core/hydra/entity/operator";

@Injectable()
export class ToolWebApi {
    constructor(protected _http: HttpClient) {
    }

    public getTool(toolName: string): Observable<Tool> {
        return this._http.get(`/api/toolService/tool/${toolName}`).pipe(
            map((tool: any) => {
                if (!tool) {
                    throw Error(`${toolName} not exist!`);
                }

                return ToolWebApi.translate(tool);
            })
        )
    }

    public logonTool(toolName: string, toolId: number, operationName: string, machineName: string, operator: Operator): Observable<string> {
        return this._http.post(`/api/toolService/logonTool`, {
            OperationName: operationName,
            MachineName: machineName,
            ToolName: toolName,
            ToolId: toolId,
            Badge: operator.badge
        }).pipe(
            map((tool: string) => tool)
        )
    }

    public logoffTool(toolName: string, toolId: number, operationName: string, machineName: string, operator: Operator): Observable<string> {
        return this._http.post(`/api/toolService/logoffTool`, {
            OperationName: operationName,
            MachineName: machineName,
            ToolName: toolName,
            ToolId: toolId,
            Badge: operator.badge
        }).pipe(
            map((tool: string) => tool)
        )
    }

    public resetTool(toolId: number, maintenanceId: number, operator: Operator): Observable<number> {
        return this._http.post(`/api/toolService/resetMaintenance`, {
            MaintenanceId: maintenanceId,
            ResourceId: toolId,
            Badge: operator.badge
        }).pipe(
            map((toolId: number) => toolId)
        )
    }

    public recordToolCycle(machineName: string, cycles: number, operator: Operator): Observable<string> {
        return this._http.post(`/api/toolService/recordToolCycle`, {
            MachineName: machineName,
            Cycles: cycles,
            Badge: operator.badge
        }).pipe(
            map((machineName: string) => machineName)
        )
    }

    public static translate(tool: any): Tool {
        var ret = new Tool();

        ret.toolName = tool.ToolName;
        ret.toolId = tool.ToolId;
        ret.description = tool.Description;
        ret.currentStatus = tool.CurrentStatus;
        ret.currentStatusNr = tool.CurrentStatusNr;
        ret.intervalCycles = tool.IntervalCycles;
        ret.currentCycles = tool.CurrentCycles;
        ret.nextMaintennaceCycles = tool.NextMaintennaceCycles;
        ret.maintenanceStatus = tool.MaintenanceStatus;
        ret.occupied = tool.Occupied;
        ret.loggedOnMachine = tool.LoggedOnMachine;
        ret.loggedOnOperation = tool.LoggedOnOperation
        ret.maintenanceId = tool.MaintenanceId

        return ret;
    }
}