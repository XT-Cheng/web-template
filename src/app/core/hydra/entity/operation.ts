import { toNumber } from '@delon/util';
import { MachineOutput } from './machine';
import { MaintenanceStatusEnum } from './tool';

export class Operation {
  static FRACTION_DIGIT = 2;

  //#region Constructor

  constructor() {
    const now = new Date();
    const interval = 1000 * 60 * 30;
    const beginDay = (new Date(now.getTime() - (now.getTime() % interval))).getTime();

    for (let i = 48; i > 0; i -= 1) {
      this.output.set(new Date(beginDay - interval * i), {
        output: 0,
        scrap: 0,
        performance: 0,
      });
    }
  }

  //#endregion

  //#region Fields

  order = '';//checked
  article = '';//checked
  sequence = '';//checked
  leadOrder = '';//checked
  leadOrderArticle = '';//checked
  targetQty = -1;//checked
  totalYield = -1;//checked
  totalScrap = -1;//checked
  targetCycleTime = -1;//checked

  currentOutputBatch = '';

  //#region Date fields

  earliestStart: Date = null;//checked
  earliestEnd: Date = null;//checked
  latestStart: Date = null;//checked
  latestEnd: Date = null;//checked
  planStart: Date = null;//checked
  planEnd: Date = null;//checked
  scheduleStart: Date = null;//checked
  scheduleEnd: Date = null;//checked

  lastLoggedOn: Date = null;//checked

  //#endregion

  //#region Partial confirmed quantity

  pendingProblemQty = 0;
  pendingYieldQty = 0;
  pendingScrapQty = 0;
  outputBatchSize = 0;

  //#endregion

  bomItems: Map<number, BomItem> = new Map<number, BomItem>();
  toolItems: Map<string, ToolItem> = new Map<string, ToolItem>();

  componentsLoggedOn: Map<number, ComponentLoggedOn> = new Map<number, ComponentLoggedOn>();
  // toolsLoggedOn: ToolLoggedOn[] = [];
  operatorsLoggedOn: Map<number, OperatorLoggedOn> = new Map<number, OperatorLoggedOn>();

  // Save last 24 Hours Data
  output: Map<Date, OpeartionOutput> = new Map<Date, OpeartionOutput>();

  // Current Shift Output
  currentShiftOutput: MachineOutput = new MachineOutput();

  //#region Display

  get display(): string {
    if (this.leadOrder) {
      return `${this.leadOrderArticle} / ${this.article} ${this.totalYield} ${this.targetQty}`;
    }

    return `${this.article} ${this.totalYield} ${this.targetQty}`;
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
    if (this.targetQty <= this.totalYield) return new Date();

    const begin = new Date().getTime();
    return new Date(begin + 1000 * (this.targetQty - this.totalYield) * this.targetCycleTime);
  }
  //#endregion
}

export class OpeartionOutput {
  output = 0;
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
  batchName: string;
  allowLogoff: boolean;
  suggestLogoff: boolean;
  material: string;
  batchQty: number;
  machine: string;
  operations: { name: string, pos: number }[];
}

export interface ComponentStatus {
  operations: string[];
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
  batchMaterial = '';
  loggedOnOperation = '';
  loggedOnMachine = '';
  toolName = '';
  toolId = -1;
  toolStatus: MaintenanceStatusEnum;
  currentCycle = -1;
}

export interface ToolStatus {
  requiredMaterial: string;

  isReady: boolean;
  loggedOnMachine?: string;
  toolName?: string;
  deputyOperation?: string;
  toolId?: string;
}

export class OperatorLoggedOn {
  personNumber = 1;

  name = '';
  badge = '';
}
