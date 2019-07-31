import { DialogTypeEnum } from '@core/hydra/bapi/constants';
import { DialogBase } from '@core/hydra/bapi/dialog.base';

export class ListBuffer extends DialogBase {
  constructor(private name: string) {
    super(DialogTypeEnum.MPL_SELECT_BUFFER);
  }

  public dialogString(): string {
    return `${super.dialogString()}` +
      `DATEI=./spool/mpuff_list.101|`;
  }
}
