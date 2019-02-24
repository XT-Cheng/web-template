import { DialogTypeEnum } from '@core/hydra/bapi/constants';
import { DialogBase } from '@core/hydra/bapi/dialog.base';

export class GoodsMovementBatch extends DialogBase {
  constructor(private batchName: string, private newRemainQuantity: number, private newMatType: string,
    private newStatus: string, private newClass: string, private badge: string) {
    super(DialogTypeEnum.GOODS_MOVEMENT);
  }

  public dialogString(): string {
    let ret = `${super.dialogString()}` +
      `CNR=${this.batchName}|`;

    if (this.newRemainQuantity !== null) {
      ret += `RGR:GUT=${this.newRemainQuantity}|`;
    }

    if (this.newMatType !== null) {
      ret += `HZTYP=${this.newMatType}|`;
    }

    if (this.newStatus !== null) {
      ret += `STA=${this.newStatus}|`;
    }

    if (this.newClass !== null) {
      ret += `KLASSE=${this.newClass}|`;
    }

    return ret +
      `KNR=${this.badge}|`;
  }
}
