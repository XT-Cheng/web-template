import { DialogTypeEnum } from '@core/hydra/bapi/constants';
import { DialogBase } from '../dialog.base';

export class TestBapi extends DialogBase {
  constructor(type: DialogTypeEnum, private content: string) {
    super(type);
  }

  public dialogString(): string {
    return `${super.dialogString()}${this.content}`;
  }
}
