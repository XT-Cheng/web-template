import { Component, OnInit, Input } from '@angular/core';
import { STColumn, STColumnTag } from '@delon/abc';
import { MachineService } from '@core/hydra/service/machine.service';
import { Machine } from '@core/hydra/entity/machine';
import { toNumber } from '@delon/util';
import { getToolStatus } from '@core/hydra/utils/operationHelper';
import { of, forkJoin, Subject, BehaviorSubject } from 'rxjs';
import { ToolService } from '@core/hydra/service/tool.service';
import { map } from 'rxjs/operators';
import { Tool, MaintenanceStatusEnum } from '@core/hydra/entity/tool';

const TOOL_TAG: STColumnTag = {
  1: { text: 'In Use', color: 'green' },
  2: { text: 'No Tool.', color: 'red' },
};

@Component({
  selector: 'fw-widget-tool-prep',
  templateUrl: './toolPreparation.component.html',
  styleUrls: ['./toolPreparation.component.less']
})
export class ToolPreparationComponent implements OnInit {

  //#region static Fields

  static COMP_REMAIN_TIME = 30 * 60;
  static COMP_REMAIN_PERCENTAGE = 20;

  //#endregion

  //#region Fields

  toolCols: STColumn[] = [
    { title: 'Material', index: 'requiredMaterial', i18n: 'app.tool.material' },
    {
      title: 'Tool Name',
      index: 'toolName',
      i18n: 'app.tool.toolName'
    },
    { title: 'Used.', render: 'percentages', i18n: 'app.tool.percentage' },
    {
      title: 'Current Cycles',
      index: 'currentCycles',
      i18n: 'app.tool.currentCycles'
    },
    {
      title: 'Cycles Limits',
      index: 'cyclesLimit',
      i18n: 'app.tool.cyclesLimit'
    },
    { title: 'Logged On At', index: 'loggedOnMachine', i18n: 'app.tool.loggedOnMachine' },
    { title: 'Status', index: 'loaded', i18n: 'app.tool.status', type: 'tag', tag: TOOL_TAG },
  ];
  private _machine: Machine = new Machine();

  @Input()
  set machine(value: Machine) {
    this._machine = value;
    this.getToolLoggedOnTable();
  }
  data: BehaviorSubject<Tool[]> = new BehaviorSubject<Tool[]>([]);

  //#endregion

  //#region Constructor

  constructor(
    public machineService: MachineService,
    private toolService: ToolService
  ) {

  }

  //#endregion

  //#region Implemented interface

  ngOnInit() {
  }

  //#endregion

  //#region Compoent logged on
  getToolStatusColor(toolStatus) {
    switch (toolStatus.maintenanceStatus) {
      case MaintenanceStatusEnum.BLUE:
        return `blue`;
      case MaintenanceStatusEnum.GREEN:
        return `green`;
      case MaintenanceStatusEnum.YELLOW:
        return `yellow`;
      case MaintenanceStatusEnum.RED:
        return `red`;
      default:
        return `green`;
    }
  }

  private getToolLoggedOnTable() {
    if (this._machine.currentOperation) {
      const op = this._machine.currentOperation;
      const toolStatuses = getToolStatus(op, this._machine);
      const ret = [];
      const tool$ = [];

      toolStatuses.forEach((tool) => {
        if (tool.toolName) {
          tool$.push(this.toolService.getTool(tool.toolName));
        }
      });

      if (tool$.length === 0) {
        tool$.push(of([]));
      }

      forkJoin(tool$).subscribe((array: Array<any>) => {
        toolStatuses.forEach((toolStatus) => {
          // 1: { text: 'In Use', color: 'green' },
          // 2: { text: 'No Tool.', color: 'red' },
          if (!toolStatus.isReady) {
            ret.push({
              toolName: ``,
              loggedOnMachine: ``,
              requiredMaterial: toolStatus.requiredMaterial,
              currentCycles: ``,
              cyclesLimit: ``,
              percentage: 0,
              maintenanceStatus: ``,
              loaded: 2
            });
          } else {
            const tool = array.find(x => x.toolName === toolStatus.toolName);
            ret.push({
              toolName: toolStatus.toolName,
              loggedOnMachine: toolStatus.loggedOnMachine,
              requiredMaterial: toolStatus.requiredMaterial,
              currentCycles: tool ? tool.currentCycles : ``,
              cyclesLimit: tool ? tool.nextMaintennaceCycles : ``,
              percentage: tool ? toNumber(((tool.nextMaintennaceCycles - tool.currentCycles) / tool.intervalCycles) * 100).toFixed() : 0,
              maintenanceStatus: tool ? tool.maintenanceStatus : ``,
              loaded: 1
            });
          }
        });
        this.data.next(ret);
      });
    }
  }
  //#endregion
}
