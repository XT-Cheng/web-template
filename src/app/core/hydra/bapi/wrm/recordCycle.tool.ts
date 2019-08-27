import { DialogTypeEnum } from '@core/hydra/bapi/constants';
import { DialogBase } from '@core/hydra/bapi/dialog.base';

export class RecordToolCycle extends DialogBase {
  constructor(private machineName, private cycles: number, private badgeName: string) {
    super(DialogTypeEnum.STROKE_POST);
  }

  public dialogString(): string {
    return `${super.dialogString()}` +
      `MNR=${this.machineName}|` +
      `AGR:HUB=${this.cycles}|` +
      `KNR=${this.badgeName}|`;
  }
}
