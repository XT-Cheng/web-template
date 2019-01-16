import { DialogTypeEnum } from '@core/hydra/bapi/constants';
import { DialogBase } from '@core/hydra/bapi/dialog.base';

export class GoodsMovementBatch extends DialogBase {
  constructor(private batchName: string, private newStartQuantity: number, private newRemainQuantity: number, private newMatType: string,
    private newStatus: string, private badge: string) {
    super(DialogTypeEnum.GOODS_MOVEMENT);
  }

  public dialogString(): string {
    return `${super.dialogString()}` +
      `CNR=${this.batchName}|` +
      `RGR:GUT=${this.newRemainQuantity}|` +
      `HZTYP=${this.newMatType}|` +
      `STA=${this.newStatus}|` +
      `KNR=${this.badge}|`;
  }
}
