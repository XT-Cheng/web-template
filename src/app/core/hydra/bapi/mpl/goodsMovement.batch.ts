import { DialogTypeEnum } from '@core/hydra/bapi/constants';
import { DialogBase } from '@core/hydra/bapi/dialog.base';

export class GoodsMovementBatch extends DialogBase {
  constructor(private batchName: string, private newRemainQuantity: number, private newMatType: string,
    private newStatus: string, private newClass: string, private badge: string, private SAPBatch?: string, private dateCode?: string) {
    super(DialogTypeEnum.GOODS_MOVEMENT);
  }

  public dialogString(): string {
    let ret = `${super.dialogString()}` +
      `CNR=${this.batchName}|`;

    if (this.newRemainQuantity !== null && this.newRemainQuantity !== undefined) {
      ret += `RGR:GUT=${this.newRemainQuantity}|`;
    }

    if (this.newMatType !== null && this.newMatType !== undefined) {
      ret += `HZTYP=${this.newMatType}|`;
    }

    if (this.newStatus !== null && this.newStatus !== undefined) {
      ret += `STA=${this.newStatus}|`;
    }

    if (this.newClass !== null && this.newClass !== undefined) {
      ret += `KLASSE=${this.newClass}|`;
    }

    if (this.SAPBatch !== null && this.SAPBatch !== undefined) {
      ret += `CNR:SAPCNR=${this.SAPBatch}|`;
    }

    if (this.dateCode !== null && this.dateCode !== undefined) {
      ret += `EXTCNR=${this.dateCode}|`;
    }

    return ret +
      `KNR=${this.badge}|`;
  }
}
