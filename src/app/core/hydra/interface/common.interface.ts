import { toNumber } from '@delon/util';

export class Machine {
  name: string;
  currentStatusNr: number;
  currentStatus: string;
  currentOperation: string;
  nextOperation: string;
  currentLeadOrder: string;
  nextLeadOrder: string;
  currentShiftOEE: MachineOEE = new MachineOEE();
  componentLoggedOn: Map<string, IComponentLoggedOn> = new Map<string, IComponentLoggedOn>();
  toolLoggedOn: Map<string, IToolLoggedOn> = new Map<string, IToolLoggedOn>();
  operatorLoggedOn: Map<number, IOperatorLoggedOn> = new Map<number, IOperatorLoggedOn>();
  currentShift: number;
  machineYieldAndScrap: Map<Date, IMachineYieldAndScrap> = new Map<Date, IMachineYieldAndScrap>();
}

export interface IMachineYieldAndScrap {
  yield: number;
  scrap: number;
}

export class MachineOEE {
  availability: number;
  performance: number;
  quality: number;
  get overAll(): number {
    return toNumber(((this.availability * this.performance * this.quality) / 1000000).toFixed());
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
