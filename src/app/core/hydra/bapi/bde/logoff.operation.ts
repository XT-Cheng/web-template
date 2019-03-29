import { DialogBase } from '@core/hydra/bapi/dialog.base';
import { DialogTypeEnum } from '@core/hydra/bapi/constants';

export class LogoffOperation extends DialogBase {
  constructor(private operation: string, private machineName: string, private yieldQty: number,
    private scrapQty: number, private scrapReason: number, private badgeName: string) {
    super(DialogTypeEnum.LOGOFF_OPERATION);
  }

  public dialogString(): string {
    return `${super.dialogString()}` +
      `ANR=${this.operation}|` +
      `MNR=${this.machineName}|` +
      `EGR:GUT=${this.yieldQty}|` +
      `EGR:AUS=${this.scrapQty}|` +
      `EGG:AUS=${this.scrapReason}|` +
      `KNR=${this.badgeName}|`;
  }
}
