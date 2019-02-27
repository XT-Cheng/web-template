import { DialogTypeEnum } from '@core/hydra/bapi/constants';
import { DialogBase } from '@core/hydra/bapi/dialog.base';

export class DeletePerson extends DialogBase {
  constructor() {
    super(DialogTypeEnum.HR_DELETE_PERSON);
  }

  public dialogString(): string {
    throw Error(`not implemented`);
  }
}
