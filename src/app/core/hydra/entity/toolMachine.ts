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
    if (this.toolsLoggedOn.length > 0) {
      return `${this.description},${this.toolsLoggedOn[0].toolName}`;
    } else {
      return `${this.description}`;
    }
  }

  //#endregion
}
