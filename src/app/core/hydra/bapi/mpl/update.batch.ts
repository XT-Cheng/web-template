import { DialogBase } from '@core/hydra/bapi/dialog.base';
import { DialogTypeEnum } from '@core/hydra/bapi/constants';

export class UpdateBatch extends DialogBase {
  constructor(private batchName: string, private badge: string, private qty: number,
    private materialDescription?: string, private status?: string) {
    super(DialogTypeEnum.UPDATE_BATCH);
  }

  public dialogString(): string {
    let dialog = `${super.dialogString()}` +
      `CNR.CNR=${this.batchName}|` +
      `CNR.OPT:MBEW=J|` +
      `KNR=${this.badge}|`;

    if (this.qty !== null && this.qty !== undefined) {
      dialog += `CNR.SGR:REST=${this.qty}|`;
    }

    if (this.materialDescription && this.materialDescription !== '') {
      dialog += `CNR.ATKBEZ=${this.materialDescription}|`;
    }

    if (this.status && this.status !== '') {
      dialog += `CNR.STA=${this.status}|`;
    }

    return dialog;
  }
}
