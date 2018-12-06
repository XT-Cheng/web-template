import { DialogTypeEnum } from '@core/hydra/bapi/constants';
import { DialogBase } from '@core/hydra/dialog.base';

export class DeleteBufferBapi extends DialogBase {
  constructor(private name: string) {
    super(DialogTypeEnum.MPL_DELETE_BUFFER);
  }

  public dialogString(): string {
    return `${super.dialogString()}` +
      `MATPUF.MATPUF=${this.name}|`;
  }
}
