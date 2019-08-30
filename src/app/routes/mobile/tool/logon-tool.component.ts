import { Component, Injector } from '@angular/core';
import { Validators } from '@angular/forms';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { Machine } from '@core/hydra/entity/machine';
import { MachineService } from '@core/hydra/service/machine.service';
import { Operation, ToolStatus } from '@core/hydra/entity/operation';
import { OperationService } from '@core/hydra/service/operation.service';
import { map, switchMap, tap, delay } from 'rxjs/operators';
import { BaseExtendForm } from '../base.form.extend';
import { getToolStatus } from '@core/hydra/utils/operationHelper';
import { ToolService } from '@core/hydra/service/tool.service';
import { BatchService } from '@core/hydra/service/batch.service';
import { MaterialBatch } from '@core/hydra/entity/batch';
import { WRMBapiService } from '@core/hydra/bapi/wrm/bapi.service';
import { FetchService } from '@core/hydra/service/fetch.service';
import { replaceAll } from '@core/utils/helpers';
import { MaintenanceStatusEnum } from '@core/hydra/entity/tool';
import { ToolWebApi } from '@core/webapi/tool.webapi';
import { MachineWebApi } from '@core/webapi/machine.webapi';
import { BatchWebApi } from '@core/webapi/batch.webapi';
import { OperationWebApi } from '@core/webapi/operation.webapi';

@Component({
  selector: 'fw-tool-logon',
  templateUrl: 'logon-tool.component.html',
  styleUrls: ['./logon-tool.component.scss'],
  host: {
    '[class.mobile-layout]': 'true',
  },
})
export class LogonToolComponent extends BaseExtendForm {

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
    private _toolWebApi: ToolWebApi,
    private _machineWebApi: MachineWebApi,
    private _batchWebApi: BatchWebApi,
    private _operationWebApi: OperationWebApi,
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
    return this._toolWebApi.getTool(this.form.value.tool).pipe(
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

        if (tool.loggedOnMachine === this.form.value.toolMachineData.machineName) {
          throw Error(`Tool ${tool.toolName} already logged on to ${this.form.value.toolMachineData.machineName}`);
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
    return this._machineWebApi.getToolMachine(this.form.value.toolMachine).pipe(
      tap(toolMachine => {
        if (toolMachine === null) {
          throw Error(`Tool Machine ${this.form.value.toolMachine} invalid!`);
        }

        if (!this.machineData.toolMachines.find(machine => machine === toolMachine.machineName)) {
          throw Error(`Tool Machine ${this.form.value.toolMachine} is not belongs to machine ${this.machineData.machineName}!`);
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
    return this._machineWebApi.getMachine(this.form.value.machine).pipe(
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
    return this._batchWebApi.getBatchInfoFrom2DBarCode(this.form.value.batch).pipe(
      switchMap((barCodeData: MaterialBatch) => {
        barCodeInfo = barCodeData;
        return this._batchWebApi.getBatch(barCodeData.name).pipe(
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
    return this._operationWebApi.getOperation(this.form.value.operation).pipe(
      switchMap(operation => {
        return this._operationWebApi.getToolStatus(operation.name, this.machineData.machineName).pipe(
          map((toolStatus) => {
            this.toolStatus$.next(toolStatus);
            return operation;
          })
        );
      }));
  }

  //#endregion

  //#endregion

  //#region Protected methods

  protected beforeRequestCheck(srcElement): Observable<boolean> {
    if (!srcElement) return of(true);

    switch (srcElement.id) {
      case 'toolMachine':
        if (!this.form.value.machineData) {
          return throwError(`Input Machine First`);
        }
        break;
      case 'batch':
        if (!this.form.value.toolMachineData) {
          return throwError(`Input Tool Machine First`);
        }
        break;
      case 'tool':
        if (!this.batchData) {
          return throwError(`Input Batch First`);
        }
        break;
      default:
        return of(true);
    }
    return of(true);
  }

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
    this._machineWebApi.getMachine(machineName).subscribe((machine) => {
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
    return this._toolWebApi.logonTool(this.toolData.toolName, this.toolData.toolId,
      this.machineData.toolLogonOrder, this.form.value.toolMachine, this.operatorData).pipe(
        map(_ => {
          return {
            isSuccess: true,
            description: `Tool ${this.toolData.toolName} Logged On!`
          }
        }));
  }

  //#endregion

  //#region Override methods

  protected afterReset() {
    this.document.getElementById(`machine`).focus();

    this.toolStatus$.next([]);
    this.operations$.next([]);
  }

  protected beforeStartCheck(): Observable<boolean> {
    let check$ = of(true);

    if (this.form.value.toolMachineData.toolsLoggedOn.length > 0) {
      check$ = check$.pipe(
        switchMap(_ => {
          return this.showDialog(`${this.form.value.toolMachineData.machineName}
         already has tool ${this.form.value.toolMachineData.toolsLoggedOn[0].toolName} logged on,
         Would you like to log it off first?`).pipe(delay(100));
        })
      );
    }

    if (this.toolData.loggedOnMachine) {
      check$ = check$.pipe(
        switchMap(_ => {
          return this.showDialog(`${this.toolData.toolName} already logged on to ${this.toolData.loggedOnMachine},
         Would you like to log it off first?`).pipe(delay(100));
        })
      );
    }

    return check$;
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
