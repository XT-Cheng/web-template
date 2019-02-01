import { Component, OnInit, Input } from '@angular/core';
import { STColumn, STColumnTag } from '@delon/abc';
import { MachineService } from '@core/hydra/service/machine.service';
import { Machine } from '@core/hydra/entity/machine';
import { toNumber } from '@delon/util';

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
    { title: 'Logged On At', index: 'loggedOnMachine', i18n: 'app.tool.loggedOnMachine' },
    { title: 'Status', index: 'loaded', i18n: 'app.tool.status', type: 'tag', tag: TOOL_TAG },
  ];
  private _machine: Machine = new Machine();

  @Input()
  set machine(value: Machine) {
    this._machine = value;
    this.data = this.toolLoggedOnTable;
  }
  data: any[];

  //#endregion

  //#region Constructor

  constructor(
    public machineService: MachineService
  ) {

  }

  //#endregion

  //#region Implemented interface

  ngOnInit() {
  }

  //#endregion

  //#region Compoent logged on

  get toolLoggedOnTable(): any[] {
    const ret: any[] = [];

    if (this._machine.currentOperation) {
      const op = this._machine.currentOperation;
      op.toolStatus.forEach((tool, key) => {
        // 1: { text: 'In Use', color: 'green' },
        // 2: { text: 'No Tool.', color: 'red' },
        let loaded = -1;
        if (!tool.toolName) {
          loaded = 2;
        } else {
          loaded = 1;
        }

        ret.push({
          toolName: tool.toolName,
          loggedOnMachine: tool.loggedOnMachine,
          requiredMaterial: tool.requiredMaterial,
          loaded: loaded
        });
      });
    }

    return ret;
  }

  //#endregion
}
