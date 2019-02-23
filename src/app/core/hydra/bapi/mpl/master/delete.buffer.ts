import { DialogTypeEnum } from '@core/hydra/bapi/constants';
import { DialogBase } from '@core/hydra/bapi/dialog.base';

export class DeleteBuffer extends DialogBase {
  constructor(private name: string) {
    super(DialogTypeEnum.MPL_DELETE_BUFFER);
  }

  public dialogString(): string {
    return `${super.dialogString()}` +
      `MATPUF.MATPUF=${this.name}|`;
  }
}
