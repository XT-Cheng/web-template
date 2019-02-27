import { DialogTypeEnum } from '@core/hydra/bapi/constants';
import { DialogBase } from '@core/hydra/bapi/dialog.base';

export class ResetTool extends DialogBase {
  constructor(private toolId: number, private maintenanceId: number, private badgeName: string) {
    super(DialogTypeEnum.RESET_MAINTENNANCE);
  }

  public dialogString(): string {
    return `${super.dialogString()}` +
      `MODE=R|` +
      `RESID=${this.toolId}|` +
      `WARTVERWEIS=${this.maintenanceId}|` +
      `KNR=${this.badgeName}|`;
  }
}
