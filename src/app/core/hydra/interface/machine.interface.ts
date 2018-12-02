import { toNumber } from '@delon/util';
import { format } from 'date-fns';

export class Machine {
  public static COMP_REMAIN_TIME = 30 * 60;
  public static COMP_REMAIN_PERCENTAGE = 20;

  private _yieldTrend = [];
  private _scrapTrend = [];
  private _componentLoggedOnTable = [];
  private _hourlyPerformance = [];

  name: string;
  description: string;
  currentStatusNr: number;
  currentStatus: string;
  currentOperation: Operation;
  nextOperation: string;
  currentLeadOrder: string;
  nextLeadOrder: string;
  currentShiftOEE: MachineOEE = new MachineOEE();
  componentLoggedOn: Map<number, IComponentLoggedOn> = new Map<number, IComponentLoggedOn>();
  toolLoggedOn: Map<string, IToolLoggedOn> = new Map<string, IToolLoggedOn>();
  operatorLoggedOn: Map<number, IOperatorLoggedOn> = new Map<number, IOperatorLoggedOn>();
  currentShift: number;
  machineYieldAndScrap: Map<Date, IMachineYieldAndScrap> = new Map<Date, IMachineYieldAndScrap>();
  alarmSetting: IMachineAlarmSetting;

  get averageHourYield(): number {
    if (!this.currentOperation) return null;

    return toNumber((this._yieldTrend.reduce((previousValue, currentValue, currentIndex, array) => {
      previousValue += currentValue.y;
      return previousValue;
    }, 0) / this._yieldTrend.length * 2.0).toFixed());
  }

  get averageHourScrap(): number {
    if (!this.currentOperation) return null;

    return toNumber((this._scrapTrend.reduce((previousValue, currentValue, currentIndex, array) => {
      previousValue += currentValue.y;
      return previousValue;
    }, 0) / this._scrapTrend.length * 2.0).toFixed());
  }

  get currentShiftYield(): number {
    if (!this.currentShiftOEE) return 0;

    return this.currentShiftOEE.yield;
  }

  get displayCurrentShiftYield(): string {
    return this.currentShiftYield.toFixed();
  }

  get currentShiftScrap(): number {
    if (!this.currentShiftOEE) return 0;

    return this.currentShiftOEE.scrap;
  }

  get displayCurrentShiftScrap(): string {
    return this.currentShiftScrap.toFixed();
  }

  get yieldTrend() {
    return this._yieldTrend;
  }

  get scrapTrend() {
    return this._scrapTrend;
  }

  get componentLoggedOnTable() {
    return this._componentLoggedOnTable;
  }

  get performanceComparedToLastHalfHour(): number {
    if (this._hourlyPerformance.length === 0) return null;

    const perc = toNumber((this._hourlyPerformance[this._hourlyPerformance.length - 1].y
      / this._hourlyPerformance[this._hourlyPerformance.length - 2].y * 100).toFixed(2));

    return toNumber((perc - 100).toFixed(2));
  }

  get scrapComparedToLastHalfHour(): number {
    if (this._scrapTrend.length === 0) return null;

    const perc = toNumber((this._scrapTrend[this._scrapTrend.length - 1].y
      / this._scrapTrend[this._scrapTrend.length - 2].y * 100).toFixed(2));

    return toNumber((perc - 100).toFixed(2));
  }

  caculate() {
    if (!this.currentOperation) return;

    this._yieldTrend = this.calculateYieldTrend();
    this._scrapTrend = this.calculateScrapTrend();
    this._hourlyPerformance = this.calculateHourlyPerformance();

    this._componentLoggedOnTable = this.calculateComponentLoggedOnTable();
  }

  private calculateHourlyPerformance() {
    const performance = new Array<{ x: string, y: number }>();
    this.machineYieldAndScrap.forEach((value, key) => {
      performance.push({
        x: format(key, 'HH:mm'),
        y: value.performance
      });
    });

    return performance.slice(((performance.length + 1) / 2), performance.length);
  }

  private calculateYieldTrend() {
    const yields = new Array<{
      x: string; y: number
    }>();
    this.machineYieldAndScrap.forEach((value, key) => {
      yields.push({
        x: format(key, 'HH:mm'),
        y: value.yield
      });
    });

    return yields.slice(((yields.length + 1) / 2), yields.length);
  }

  private calculateScrapTrend() {
    const scraps = new Array<{
      x: string; y: number
    }>();
    this.machineYieldAndScrap.forEach((value, key) => {
      scraps.push({
        x: format(key, 'HH:mm'),
        y: value.scrap
      });
    });

    return scraps.slice(((scraps.length + 1) / 2), scraps.length);
  }

  private calculateComponentLoggedOnTable() {
    const ret = [];

    this.currentOperation.bomItems.forEach((bomItem, key) => {
      const component = this.componentLoggedOn.get(bomItem.pos);

      if (component) {
        const remainTime = toNumber((component.batchQty / bomItem.quantity * this.currentOperation.targetCycleTime).toFixed());
        const percentage = toNumber(((remainTime / Machine.COMP_REMAIN_TIME) * 100).toFixed());

        let loaded = 0;
        if (percentage > Machine.COMP_REMAIN_PERCENTAGE) {
          loaded = 1;
        } else {
          loaded = 3;
        }

        ret.push({
          batchName: component.batchName,
          batchQty: component.batchQty,
          material: component.material,
          percentage: percentage,
          loaded: loaded
        });
      } else {
        ret.push({
          batchName: ``,
          batchQty: 0,
          material: bomItem.material,
          percentage: 0,
          loaded: 2
        });
      }
    });

    return ret;
  }
}

export class Operation {
  name: string;
  targetQty: number;
  totalYield: number;
  totalScrap: number;
  targetCycleTime: number;
  scheduleCompleted: Date;
  bomItems: Map<number, BomItem> = new Map<number, BomItem>();

  get finishRate() {
    return toNumber((this.totalYield / this.targetQty * 100).toFixed());
  }

  get expectFinishRate(): number {
    const expectFinished = this.targetQty -
      toNumber(((this.scheduleCompleted.getTime() - Date.now()) / 1000 / this.targetCycleTime).toFixed());

    if (expectFinished < 0) {
      return 0;
    }

    return toNumber((expectFinished / this.targetQty * 100).toFixed());
  }

  get estimatedFinished(): Date {
    const begin = new Date().getTime();
    return new Date(begin + 1000 * (this.targetQty - this.totalYield) * this.targetCycleTime);
  }
}

export class BomItem {
  material: string;
  pos: number;
  quantity: number;
  unit: string;
}

export interface IMachineYieldAndScrap {
  yield: number;
  scrap: number;
  performance: number;
}

export class MachineOEE {
  yield = 0;
  scrap = 0;
  availability = 0;
  performance = 0;
  quality = 0;
  get overAll(): number {
    return toNumber(((this.availability * this.performance * this.quality) / 10000.0).toFixed());
  }
}

export interface IComponentLoggedOn {
  batchName: string;
  batchQty: number;
  bomItem: number;
  material: string;
}

export interface IToolLoggedOn {
  toolName: string;
  requiredTool: string;
}

export interface IOperatorLoggedOn {
  personNumber: number;
  name: string;
  badgeId: string;
}

export interface IMachineAlarmSetting {
  oeeLower: number;
  oeeUpper: number;
  scrapLower: number;
  scrapUpper: number;
}
