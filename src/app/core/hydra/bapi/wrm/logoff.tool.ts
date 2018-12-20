import { DialogTypeEnum } from '@core/hydra/bapi/constants';
import { DialogBase } from '@core/hydra/dialog.base';

export class LogoffTool extends DialogBase {
  constructor(private operation: string, private machineName: string, private badgeName: string,
    private toolId: string) {
    super(DialogTypeEnum.LOGOFF_TOOL);
  }

  public dialogString(): string {
    return `${super.dialogString()}` +
      `ANR=${this.operation}|` +
      `MNR=${this.machineName}|` +
      `RESID=${this.toolId}|` +
      `KNR=${this.badgeName}|`;
  }
}
