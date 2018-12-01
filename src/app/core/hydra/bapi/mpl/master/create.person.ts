import { DialogTypeEnum } from '@core/hydra/bapi/constants';
import { DialogBase } from '@core/hydra/dialog.base';

export class CreatePersonBapi extends DialogBase {
  constructor() {
    super(DialogTypeEnum.HR_CREATE_PERSON);
  }

  public dialogString(): string {
    throw Error(`not implemented`);
  }
}
