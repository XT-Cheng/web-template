import { Operation, OpeartionOutput, ComponentLoggedOn, ToolLoggedOn, OperatorLoggedOn } from './operation';
import { toNumber } from '@delon/util';
import { CheckList, ProcessType, CheckListResult } from './checkList';

export class Machine {
  static FRACTION_DIGIT = 0;

  //#region Fields

  machineName = '';
  description = '';
  currentStatus = '';
  currentStatusNr = -1;
  currentShift = -1;
  currentShiftDate = new Date();

  lastOperation = '';
  lastArticle = '';

  currentShiftStart = new Date();
  currentShiftEnd = new Date();

  nextOperations: Operation[] = [];
  currentOperations: Operation[] = [];

  // Tool Machine belong to this Line
  toolMachines: string[] = [];

  // Operators Logged On
  operatorsLoggedOn: OperatorLoggedOn[] = [];

  // Components Logged On
  componentsLoggedOn: ComponentLoggedOn[] = [];

  // Tools Logged On
  toolsLoggedOn: ToolLoggedOn[] = [];

  // Check List related
  checkLists: Map<ProcessType, CheckList> = new Map<ProcessType, CheckList>();
  checkListResultsOfCurrentShift: Map<number, CheckListResult> = new Map<number, CheckListResult>();
  checkListResultsOfChangeOver: Map<number, CheckListResult> = new Map<number, CheckListResult>();

  // Shift OEE
  currentShiftOEE: MachineOEE = new MachineOEE();

  // Save last 24 Hours Data
  output: Map<Date, OpeartionOutput> = new Map<Date, OpeartionOutput>();

  // Shift Output
  currentShiftOutput: MachineOutput = new MachineOutput();

  alarmSetting: MachineAlarmSetting = new MachineAlarmSetting();

  //#endregion

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

  //#region Properties

  //#region Shift Statistic

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

  //#endregion

  get currentOperation(): Operation {
    if (this.currentOperations.length === 0) return null;

    return this.currentOperations[0];
  }

  get nextOperation(): Operation {
    if (this.nextOperations.length === 0) return null;

    return this.nextOperations[0];
  }

  //#endregion

  //#region Display

  get display(): string {
    if (this.currentOperation) {
      return `${this.machineName}, ${this.currentOperation.leadOrder} / ${this.currentOperation.order}`;
    } else {
      return `${this.machineName}, No Order Logon`;
    }
  }

  //#endregion
}

export class MachineAlarmSetting {
  oeeLower = 0;
  oeeUpper = 0;
  scrapLower = 0;
  scrapUpper = 0;
}

export class MachineOutput {
  //#region Fields

  yield = 0;
  scrap: Map<number, MachineScrap> = new Map<number, MachineScrap>();

  //#endregion
}

export class MachineScrap {
  //#region Fields

  scrapCode = -1;
  scrapText = ``;
  scrap = 0;

  //#endregion
}

export class MachineOEE {
  //#region Fields

  availability = 0;
  performance = 0;
  quality = 0;

  //#endregion

  //#region Properties

  get overAll(): number {
    return toNumber(((this.availability * this.performance * this.quality) / 10000.0).toFixed(Machine.FRACTION_DIGIT));
  }

  //#endregion
}

