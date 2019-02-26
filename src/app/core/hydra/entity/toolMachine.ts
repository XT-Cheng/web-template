import { ToolLoggedOn } from './operation';

export class ToolMachine {

  //#region Fields

  machineName = '';
  description = '';

  // Tools Logged On
  toolsLoggedOn: ToolLoggedOn[] = [];

  //#endregion

  //#region Constructor

  constructor() { }

  //#endregion

  //#region Properties

  //#endregion

  //#region Display

  get display(): string {
    return `${this.description},${this.toolsLoggedOn.length}`;
  }

  //#endregion
}
