export class Tool {
  //#region Fields

  toolName = '';
  toolId = -1;
  description = '';
  currentStatus = '';
  currentStatusNr = -1;

  loggedOnMachine = '';
  occupied = false;
  currentCycles = -1;
  nextMaintennaceCycles = -1;

  //#endregion

  //#region Constructor

  constructor() {
  }

  //#endregion

  get display(): string {
    return this.description;
  }
}
