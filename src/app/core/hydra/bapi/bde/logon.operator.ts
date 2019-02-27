import { DialogBase } from '@core/hydra/bapi/dialog.base';
import { DialogTypeEnum } from '@core/hydra/bapi/constants';

export class LogonOperator extends DialogBase {
  constructor(private machineName: string, private badge: string) {
    super(DialogTypeEnum.LOGON_OPERATOR);
  }

  public dialogString(): string {
    return `${super.dialogString()}MNR=${this.machineName}|KNR=${this.badge}`;
  }
}
