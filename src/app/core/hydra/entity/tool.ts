
export enum MaintenanceStatusEnum {
  GREEN = '0',
  BLUE = '1',
  YELLOW = '2',
  RED = '3',
}

export class Tool {
  //#region Fields

  toolName = '';
  toolId = -1;
  maintenanceId = -1;
  description = '';
  currentStatus = '';
  currentStatusNr = -1;

  loggedOnMachine = '';
  occupied = false;

  currentCycles = -1;
  intervalCycles = -1;
  nextMaintennaceCycles = -1;

  maintenanceStatus: MaintenanceStatusEnum = null;

  //#endregion

  //#region Constructor

  constructor() {
  }

  //#endregion

  get display(): string {
    return this.description;
  }
}