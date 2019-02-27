import { DialogBase } from '@core/hydra/bapi/dialog.base';
import { DialogTypeEnum } from '@core/hydra/bapi/constants';

export class LogoffOperation extends DialogBase {
  constructor(private operation: string, private machineName: string, private badgeName: string) {
    super(DialogTypeEnum.LOGOFF_OPERATION);
  }

  public dialogString(): string {
    return `${super.dialogString()}` +
      `ANR=${this.operation}|` +
      `MNR=${this.machineName}|` +
      `KNR=${this.badgeName}|`;
  }
}
