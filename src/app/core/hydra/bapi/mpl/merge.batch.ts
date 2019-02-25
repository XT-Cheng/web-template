import { DialogBase } from '@core/hydra/bapi/dialog.base';
import { DialogTypeEnum } from '@core/hydra/bapi/constants';

export class MergeBatch extends DialogBase {
  constructor(private mergeTo: string, private toBeMerged: string[], private badge: string) {
    super(DialogTypeEnum.MERGE_BATCH);
  }

  public dialogString(): string {
    let ret = `${super.dialogString()}` +
      `CNR.CNR=${this.mergeTo}|`;

    for (let index = 0; index < this.toBeMerged.length; index++) {
      const element = this.toBeMerged[index];
      ret += `CNR.CNR:${index + 1}=${element}|`;
    }

    return ret +
      `KNR=${this.badge}|` +
      `CNR.MOD=B|`;
  }
}
