import { DialogBase } from '@core/hydra/bapi/dialog.base';
import { DialogTypeEnum } from '@core/hydra/bapi/constants';

export class GenerateBatchName extends DialogBase {
    constructor(private type: string) {
        super(DialogTypeEnum.GENERATE_BATCH_NAME);
    }

    public dialogString(): string {
        return `${super.dialogString()}` +
                `CNRGEN.MATTYP=SYSTEM|` +
                `CNRGEN.TYP=${this.type}|`;
    }
}
