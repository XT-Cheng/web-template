import { toNumber } from '@delon/util';
import { MachineOutput } from './machine';

export class Operation {
  static FRACTION_DIGIT = 2;

  //#region Fields

  order = '';
  sequence = '';
  leadOrder = '';
  targetQty = -1;
  totalYield = -1;
  totalScrap = -1;
  targetCycleTime = -1;

  //#region Date fields

  earliestStart: Date = null;
  earliestEnd: Date = null;
  latestStart: Date = null;
  latestEnd: Date = null;
  planStart: Date = null;
  planEnd: Date = null;
  scheduleStart: Date = null;
  scheduleEnd: Date = null;

  lastLoggedOn: Date = null;

  //#endregion

  bomItems: Map<number, BomItem> = new Map<number, BomItem>();
  toolItems: Map<string, ToolItem> = new Map<string, ToolItem>();

  componentsLoggedOn: Map<number, ComponentLoggedOn> = new Map<number, ComponentLoggedOn>();
  toolLoggedOn: Map<string, ToolLoggedOn> = new Map<string, ToolLoggedOn>();
  operatorLoggedOn: Map<number, OperatorLoggedOn> = new Map<number, OperatorLoggedOn>();

  // Save last 24 Hours Data
  output: Map<Date, OpeartionOutput> = new Map<Date, OpeartionOutput>();

  // Current Shift Output
  currentShiftOutput: MachineOutput = new MachineOutput();

  //#endregion

  //#region Properties
  get currentShiftYield(): number {
    return this.currentShiftOutput.yield;
  }

  get currentShiftScrap(): number {
    let total = 0;
    this.currentShiftOutput.scrap.forEach((scrap, key) => {
      total += scrap.scrap;
    });
    return total;
  }

  get componentStatus(): Map<number, ComponentLoggedOn> {
    const ret = new Map<number, ComponentLoggedOn>();

    this.bomItems.forEach((bomItem, key) => {
      const component = this.componentsLoggedOn.get(key);

      if (component) {
        ret.set(key, {
          batchName: component.batchName,
          material: component.material,
          batchQty: component.batchQty,
          pos: key
        });
      } else {
        ret.set(key, {
          batchName: ``,
          material: bomItem.material,
          batchQty: 0,
          pos: key
        });
      }
    });

    return ret;
  }

  get toolStatus(): Map<string, ToolLoggedOn> {
    const ret = new Map<string, ToolLoggedOn>();

    this.toolItems.forEach((toolItem, key) => {
      const tool = this.toolLoggedOn.get(key);

      if (tool) {
        ret.set(key, {
          requiredTool: key,
          toolName: tool.toolName,
        });
      } else {
        ret.set(key, {
          requiredTool: key,
          toolName: '',
        });
      }
    });

    return ret;
  }

  get name(): string {
    return `${this.order}${this.sequence}`;
  }

  get finishRate(): number {
    if (this.targetQty === -1) return 0;

    return toNumber((this.totalYield / this.targetQty * 100).toFixed(Operation.FRACTION_DIGIT));
  }

  get expectFinishRate(): number {
    if (this.targetQty === -1) return 0;

    const expectFinished = this.targetQty -
      toNumber(((this.planEnd.getTime() - Date.now()) / 1000 / this.targetCycleTime).toFixed(Operation.FRACTION_DIGIT));

    if (expectFinished < 0) {
      return 0;
    }

    return toNumber((expectFinished / this.targetQty * 100).toFixed(Operation.FRACTION_DIGIT));
  }

  get estimatedFinishedAt(): Date {
    if (this.targetQty === -1) return new Date();

    const begin = new Date().getTime();
    return new Date(begin + 1000 * (this.targetQty - this.totalYield) * this.targetCycleTime);
  }
  //#endregion
}

export class OpeartionOutput {
  yield = 0;
  scrap = 0;
  performance = 0;
}

export class BomItem {
  material = '';
  unit = '';

  pos = -1;
  quantity = -1;
}

export class ComponentLoggedOn {
  batchName = '';
  material = '';

  batchQty = -1;
  pos = -1;
}

export class ToolItem {
  requiredTooL = '';

  requiredQty = -1;
}

export class ToolLoggedOn {
  requiredTool = '';

  toolName = '';
}

export class OperatorLoggedOn {
  personNumber = 1;

  name = '';
  badgeId = '';
}


