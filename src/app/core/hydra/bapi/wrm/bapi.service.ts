import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IActionResult } from '@core/utils/helpers';
import { LogonTool } from './logon.tool';
import { map } from 'rxjs/operators';
import { Operator } from '@core/hydra/entity/operator';
import { Operation } from '@core/hydra/entity/operation';
import { Machine } from '@core/hydra/entity/machine';
import { Tool } from '@core/hydra/entity/tool';
import { LogoffTool } from './logoff.tool';
import { ResetTool } from './reset.tool';

@Injectable()
export class WRMBapiService {

  //#region Private members

  //#endregion

  //#region Constructor

  constructor(protected _http: HttpClient) {
  }
  //#endregion

  //#region Public methods
  logonTool(operation: Operation | { name: string }, machine: Machine | { machineName: string },
    tool: Tool | { toolId: number }, operator: Operator): Observable<IActionResult> {
    return new LogonTool(operation.name, machine.machineName, operator.badge, tool.toolId).execute(this._http).pipe(
      map((ret: IActionResult) => {
        return Object.assign(ret, {
          description: `Tool ${tool.toolId} Logged On!`
        });
      })
    );
  }

  logoffTool(operation: Operation | { name: string }, machine: Machine | { machineName: string },
    tool: Tool | { toolId: number }, operator: Operator): Observable<IActionResult> {
    return new LogoffTool(operation.name, machine.machineName, operator.badge, tool.toolId).execute(this._http).pipe(
      map((ret: IActionResult) => {
        return Object.assign(ret, {
          description: `Tool ${tool.toolId} Logged Off!`
        });
      })
    );
  }

  resetTool(tool: Tool, operator: Operator): Observable<IActionResult> {
    return new ResetTool(tool.toolId, tool.maintenanceId, operator.badge).execute(this._http).pipe(
      map((ret: IActionResult) => {
        return Object.assign(ret, {
          description: `Tool ${tool.toolName} Reset!`
        });
      })
    );
  }
  //#endregion
}

