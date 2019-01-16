import { DialogTypeEnum } from '@core/hydra/bapi/constants';
import { DialogBase } from '@core/hydra/bapi/dialog.base';

export class CreateBatch extends DialogBase {
  constructor(private batchNumber: string, private materialNumber: string, private materialType: string,
    private unit: string, private batchQty: number, private materialBuffer: string,
    private badge: string, private batch: string = '', private dateCode: string = '') {
    super(DialogTypeEnum.CREATE_BATCH);
  }

  public dialogString(): string {
    return `${super.dialogString()}` +
      `CNR=${this.batchNumber}|` +
      `CNR:ALT1=${this.batchNumber}|` +
      `HZTYP=${this.materialType}|` +
      `CNR:ALT1=${this.batchNumber}|` +
      `ATK=${this.materialNumber}|` +
      `EGR:GUT=${this.batchQty}|` +
      `EGE:GUT=${this.unit}|` +
      `KNR=${this.badge}|` +
      `CNR:SAPCNR=${this.batch}|` +
      `EXTCNR=${this.dateCode}|` +
      `STA=F|` +
      `KLASSE=G|` +
      `ZLO=${this.materialBuffer}|`;
  }
}
