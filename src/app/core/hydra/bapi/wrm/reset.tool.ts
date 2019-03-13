import { DialogTypeEnum } from '@core/hydra/bapi/constants';
import { DialogBase } from '@core/hydra/bapi/dialog.base';

export class ResetTool extends DialogBase {
  constructor(private toolId: number, private maintenanceId: number, private badgeName: string) {
    super(DialogTypeEnum.RESET_MAINTENNANCE);
  }

  public dialogString(): string {
    return `${super.dialogString()}` +
      `MOD=R|` +
      `RESID=${this.toolId}|` +
      `WARTVERWEIS=${this.maintenanceId}|` +
      `AUFSATZ=I|` +
      `KNR=${this.badgeName}|`;
  }
}
