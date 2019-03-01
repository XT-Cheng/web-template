import { DialogBase } from '@core/hydra/bapi/dialog.base';
import { DialogTypeEnum } from '@core/hydra/bapi/constants';

export class ChangeMachineStatus extends DialogBase {
  constructor(private machine: string, private newStatus: number, private badge: string) {
    super(DialogTypeEnum.CHANGE_MACHINE_STATUS);
  }

  public dialogString(): string {
    return `${super.dialogString()}` +
      `MNR=${this.machine}|` +
      `KNR=${this.badge}|` +
      `MST=${this.newStatus}|`;
  }
}
