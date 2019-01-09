import { DialogTypeEnum } from '@core/hydra/bapi/constants';
import { DialogBase } from '@core/hydra/bapi/dialog.base';

export class CopyBatch extends DialogBase {
  constructor(private oriBatchName: string, private newBatchName: string,
    private qty: number, private badge: string, private status?: string) {
    super(DialogTypeEnum.COPY_BATCH);
  }

  public dialogString(): string {
    let dialog = `${super.dialogString()}` +
      `CNR.CNR=${this.oriBatchName}|` +
      `CNR.CNR:Z=${this.newBatchName}|` +
      `CNR.CNR:ALT1=${this.newBatchName}|` +
      `CNR.SGR:GUT=${this.qty}|` +
      `CNR.MCNR=${this.oriBatchName}|` +
      `CNR.OPT:MBEW=J|` +
      `CNR.SGR:REST=${this.qty}|` +
      `KNR=${this.badge}|`;

    if (this.status && this.status !== '') {
      dialog += `CNR.STA=${this.status}|`;
    }

    return dialog;
  }
}
