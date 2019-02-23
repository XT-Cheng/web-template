import { DialogBase } from '@core/hydra/bapi/dialog.base';
import { DialogTypeEnum } from '@core/hydra/bapi/constants';

export class ChangeOutputBatch extends DialogBase {
  constructor(private operation: string, private machine: string, private badge: string,
    private batch: string, private qty: number) {
    super(DialogTypeEnum.CHANGE_OUTPUT_BATCH);
  }

  public dialogString(): string {
    return `${super.dialogString()}` +
      `ANR=${this.operation}|` +
      `CNR=${this.batch}|` +
      `KNR=${this.badge}|` +
      `EGR:GUT=${this.qty}|` +
      `KLASSE=G|` +
      // `ZLO=|` +
      `MNR=${this.machine}|`;
  }
}
