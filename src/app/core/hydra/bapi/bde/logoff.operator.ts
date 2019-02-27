import { DialogBase } from '@core/hydra/bapi/dialog.base';
import { DialogTypeEnum } from '@core/hydra/bapi/constants';

export class LogoffOperator extends DialogBase {
  constructor(private machineName: string, private badge: string) {
    super(DialogTypeEnum.LOGOFF_OPERRATOR);
  }

  public dialogString(): string {
    return `${super.dialogString()}MNR=${this.machineName}|KNR=${this.badge}`;
  }
}
