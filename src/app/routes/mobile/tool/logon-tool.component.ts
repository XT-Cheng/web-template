import { Component, Injector } from '@angular/core';
import { Validators } from '@angular/forms';
import { Observable, BehaviorSubject, of, Subject, forkJoin } from 'rxjs';
import { Machine } from '@core/hydra/entity/machine';
import { MachineService } from '@core/hydra/service/machine.service';
import { Operation, ToolStatus } from '@core/hydra/entity/operation';
import { OperationService } from '@core/hydra/service/operation.service';
import { map, switchMap, tap } from 'rxjs/operators';
import { BaseExtendForm } from '../base.form.extend';
import { getToolStatus } from '@core/hydra/utils/operationHelper';
import { ToolService } from '@core/hydra/service/tool.service';
import { requestBatchData } from '../material/request.common';
import { BatchService } from '@core/hydra/service/batch.service';
import { MaterialBatch } from '@core/hydra/entity/batch';
import { WRMBapiService } from '@core/hydra/bapi/wrm/bapi.service';
import { FetchService } from '@core/hydra/service/fetch.service';
import { replaceAll, IActionResult } from '@core/utils/helpers';
import { MaintenanceStatusEnum } from '@core/hydra/entity/tool';
import { toNumber } from '@delon/util';
import { ToolMachine } from '@core/hydra/entity/toolMachine';

@Component({
  selector: 'fw-tool-logon',
  templateUrl: 'logon-tool.component.html',
  styleUrls: ['./logon-tool.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class LogonToolComponent extends BaseExtendForm {
  private machineNameTBR = '$machineNameTBR';
  private operationNameTBR = '$operationNameTBR';
  private resIDTBR = '$resIDTBR';

  private updateHYBUCHSql = `UPDATE HYBUCH SET PARAM_STR1 = '${this.operationNameTBR}'
   WHERE KEY_TYPE = 'O' AND SUBKEY1 = '${this.machineNameTBR}' AND SUBKEY6 = '${this.resIDTBR}'`;

  //#region View Children

  //#endregion

  //#region Protected member

  protected key = `app.mobile.tool.logon`;

  //#endregion

  //#region Public member

  toolStatus$: BehaviorSubject<ToolStatus[]> = new BehaviorSubject<[]>([]);
  operations$: BehaviorSubject<Operation[]> = new BehaviorSubject<[]>([]);

  //#endregion

  //#region Public member

  //#endregion

  //#region Constructor

  constructor(
    injector: Injector,
    private _toolService: ToolService,
    private _machineService: MachineService,
    private _batchService: BatchService,
    private _operationService: OperationService,
    private _bapiService: WRMBapiService,
    private _fetchService: FetchService
  ) {
    super(injector, false);
    this.addControls({
      operation: [null, [Validators.required], 'operationData'],
      machine: [null, [Validators.required], 'machineData'],
      toolMachine: [null, [Validators.required], 'toolMachineData'],
      tool: [null, [Validators.required], 'toolData'],
      batch: [null, [Validators.required], 'batchData'],
    });
  }

  //#endregion

  //#region Public methods

  //#endregion

  //#region Data Request

  //#region Tool Reqeust

  requestToolDataSuccess = () => {
  }

  requestToolDataFailed = () => {
  }

  requestToolData = () => {
    return this._toolService.getTool(this.form.value.tool).pipe(
      tap(tool => {
        if (!tool) {
          throw Error(`Tool ${this.form.value.tool} not exist`);
        }

        if (tool.maintenanceStatus && tool.maintenanceStatus === MaintenanceStatusEnum.RED) {
          throw Error(`Tool must maintain before use`);
        }

        const toolItem = this.operationData.toolItems.get(this.batchData.material);
        if (!toolItem.availableTools.includes(tool.toolName)) {
          throw Error(`Tool ${tool.toolName} not valid for Material ${this.batchData.material}`);
        }
      })
    );
  }

  //#endregion

  //#region Tool Machine Reqeust

  requestToolMachineDataSuccess = () => {
  }

  requestToolMachineDataFailed = () => {
  }

  requestToolMachineData = () => {
    return this._machineService.getToolMachine(this.form.value.toolMachine).pipe(
      tap(toolMachine => {
        if (toolMachine === null) {
          throw Error(`Tool Machine ${this.form.value.toolMachine} invalid!`);
        }
      })
    );
  }

  //#endregion

  //#region Machine Reqeust

  requestMachineDataSuccess = (machine: Machine) => {
    this.operations$.next([...machine.currentOperations, ...machine.nextOperations]);
    if (machine.currentOperation) {
      this.form.controls.operation.setValue(machine.currentOperation.name);
      this.request(this.requestOperationData, this.requestOperationDataSuccess, this.requestOperationDataFailed)
        (null, null, `operation`);
    } else if (machine.nextOperations.length > 0) {
      this.form.controls.operation.setValue(machine.nextOperations[0].name);
      this.request(this.requestOperationData, this.requestOperationDataSuccess, this.requestOperationDataFailed)
        (null, null, `operation`);
    }
  }

  requestMachineDataFailed = () => {
  }

  requestMachineData = () => {
    return this._machineService.getMachine(this.form.value.machine).pipe(
      tap(machine => {
        if (!machine) {
          throw Error('Machine invalid');
        }

        if (!machine.toolLogonOrder) {
          throw Error(`No Tool Logon Order for ${machine.machineName}`);
        }
      })
    );
  }

  //#endregion

  //#region Batch Reqeust
  requestBatchDataSuccess = (batch) => {
    this.form.controls.batch.setValue(batch.name);

    setTimeout(() => {
      this.document.getElementById(`tool`).focus();
    }, 0);
  }

  requestBatchDataFailed = () => {
  }

  requestBatchData = () => {
    let barCodeInfo: MaterialBatch;
    return this._batchService.getBatchInfoFrom2DBarCode(this.form.value.batch).pipe(
      switchMap((barCodeData: MaterialBatch) => {
        barCodeInfo = barCodeData;
        return this._batchService.getBatchInformationWithRunning(barCodeData.name).pipe(
          tap((batch: MaterialBatch) => {
            if (!batch) {
              throw Error(`${barCodeInfo.name} not exist!`);
            }
          }),
          map((batch: MaterialBatch) => {
            if (batch) {
              batch.barCode = barCodeData.barCode;
            }
            return batch;
          }),
          map((batch: MaterialBatch) => {
            if (!Array.from(this.operationData.toolItems.keys()).includes(batch.material)) {
              throw Error(`Material ${batch.material} in-correct!`);
            }
            return batch;
          }),
        );
      }));
  }

  //#endregion

  //#region Operation Reqeust
  requestOperationDataSuccess = (_) => {
    setTimeout(() => this.document.getElementById(`toolMachine`).focus(), 0);
  }

  requestOperationDataFailed = () => {
  }

  requestOperationData = (): Observable<any> => {
    return this._operationService.getOperation(this.form.value.operation).pipe(
      map(operation => {
        this.toolStatus$.next(getToolStatus(operation, this.machineData));
        return operation;
      }));
  }

  //#endregion

  //#endregion

  //#region Protected methods

  //#endregion

  //#region Event Handler

  operationSelected(operationName) {
    this.operationListPopup.close();
    this.form.controls.operation.setValue(operationName);
    if (operationName) {
      this.request(this.requestOperationData, this.requestOperationDataSuccess, this.requestOperationDataFailed)
        (null, null, `operation`);
    }
  }

  //#endregion

  //#region Exeuction

  logonToolSuccess = () => {
    const machineName = this.form.value.machine;

    this.resetForm();

    this.toolStatus$.next([]);
    this.operations$.next([]);

    this.form.controls.machine.setValue(machineName);
    this._machineService.getMachine(machineName).subscribe((machine) => {
      this.form.controls.machineData.setValue(machine);
      this.operations$.next([...machine.currentOperations, ...machine.nextOperations]);
      if (machine.currentOperation) {
        this.form.controls.operation.setValue(machine.currentOperation.name);
        this.request(this.requestOperationData, this.requestOperationDataSuccess, this.requestOperationDataFailed)
          (null, null, `operation`);
      } else if (machine.nextOperations.length > 0) {
        this.form.controls.operation.setValue(machine.nextOperations[0].name);
        this.request(this.requestOperationData, this.requestOperationDataSuccess, this.requestOperationDataFailed)
          (null, null, `operation`);
      }
    });
  }

  logonToolFailed = () => {
  }

  logonTool = () => {
    let logonTool$ = of(null);
    if (this.form.value.toolMachineData.toolsLoggedOn.length > 0) {
      // Log off first
      logonTool$ = logonTool$.pipe(
        switchMap(_ => {
          return this.showDialog(`Tool already logged on, Would you like to log it off first?`).pipe(
            switchMap(confirmed => {
              if (confirmed) {
                return this._bapiService.logoffTool({ name: this.form.value.toolMachineData.toolsLoggedOn[0].loggedOnOperation },
                  { machineName: this.form.value.toolMachine }, { toolId: this.form.value.toolMachineData.toolsLoggedOn[0].toolId },
                  this.operatorData);
              }

              return of(null);
            })
          );
        }));
    }

    // LogOn Tool
    return logonTool$.pipe(
      switchMap(_ => {
        return this._bapiService.logonTool({ name: this.machineData.toolLogonOrder },
          { machineName: this.form.value.toolMachine }, this.toolData,
          this.operatorData);
      }),
      switchMap(_ => {
        return this._fetchService.query(replaceAll(this.updateHYBUCHSql,
          [this.machineNameTBR, this.operationNameTBR, this.resIDTBR],
          [this.form.value.toolMachine, this.operationData.name, this.toolData.toolId]));
      }),
      map(_ => {
        return {
          isSuccess: true,
          description: `Tool ${this.toolData.toolName} Logged On!`
        };
      }));
  }

  //#endregion

  //#region Override methods

  protected afterReset() {
    this.document.getElementById(`machine`).focus();

    this.toolStatus$.next([]);
    this.operations$.next([]);
  }

  //#endregion

  //#region Override properties

  get upperLevel(): string {
    return `/tool/list`;
  }

  //#endregion

  //#region Private methods

  //#endregion
}
