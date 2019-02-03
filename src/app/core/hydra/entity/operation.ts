import { toNumber } from '@delon/util';
import { MachineOutput } from './machine';

export class Operation {
  static FRACTION_DIGIT = 2;

  //#region Constructor

  constructor() {
    const now = new Date();
    const interval = 1000 * 60 * 30;
    const beginDay = (new Date(now.getTime() - (now.getTime() % interval))).getTime();

    for (let i = 48; i >= 0; i -= 1) {
      this.output.set(new Date(beginDay - interval * i), {
        yield: 0,
        scrap: 0,
        performance: 0,
      });
    }
  }

  //#endregion

  //#region Fields

  order = '';
  article = '';
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
  toolsLoggedOn: ToolLoggedOn[] = [];
  operatorsLoggedOn: Map<number, OperatorLoggedOn> = new Map<number, OperatorLoggedOn>();

  // Save last 24 Hours Data
  output: Map<Date, OpeartionOutput> = new Map<Date, OpeartionOutput>();

  // Current Shift Output
  currentShiftOutput: MachineOutput = new MachineOutput();

  //#endregion

  //#region Display

  get display(): string {
    return `${this.name}, ${this.article}, ${this.targetQty}, ${this.totalYield}`;
  }

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

export interface ComponentStatus {
  material: string;
  pos: number;
  isReady: boolean;
  batchName?: string;
  quantity?: number;
}

export class ToolItem {
  requiredMaterial = '';

  availableTools = [];
  requiredQty = -1;
}

export class ToolLoggedOn {
  requiredMaterial = '';

  loggedOnMachine = '';
  toolName = '';
}

export interface ToolStatus {
  requiredMaterial: string;

  isReady: boolean;
  loggedOnMachine?: string;
  toolName?: number;
}

export class OperatorLoggedOn {
  personNumber = 1;

  name = '';
  badgeId = '';
}
