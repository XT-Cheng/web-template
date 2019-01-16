import { DialogTypeEnum } from '@core/hydra/bapi/constants';
import { DialogBase } from '@core/hydra/bapi/dialog.base';

export class MoveBatch extends DialogBase {
  constructor(private batchName: string, private newMatType: string, private destination: string, private badge: string) {
    super(DialogTypeEnum.MOVE_BATCH);
  }

  public dialogString(): string {
    return `${super.dialogString()}` +
      `CNR=${this.batchName}|` +
      `ZLO=${this.destination}|` +
      `HZTYP=${this.newMatType}|` +
      `KNR=${this.badge}|` +
      `KLASSE=G|`;
  }
}
