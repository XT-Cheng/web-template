import { DialogBase } from '@core/hydra/bapi/dialog.base';
import { DialogTypeEnum } from '@core/hydra/bapi/constants';

export class LogonInputBatch extends DialogBase {
  constructor(private operation: string, private machineName: string, private badgeName: string,
    private batchId: string, private material: string, private pos: number) {
    super(DialogTypeEnum.LOGON_INPUT_BATCH);
  }

  public dialogString(): string {
    return `${super.dialogString()}` +
      `ANR=${this.operation}|` +
      `SLP=${this.pos}|` +
      `MNR=${this.machineName}|` +
      `KNR=${this.badgeName}|` +
      `ATK=${this.material}|` +
      `CNR=${this.batchId}|`;
  }
}
