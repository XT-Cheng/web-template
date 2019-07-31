import { DialogTypeEnum } from '@core/hydra/bapi/constants';
import { DialogBase } from '@core/hydra/bapi/dialog.base';

export class CopyMachine extends DialogBase {
    constructor(private fromMachine: string, private toMachine: string
    ) {
        super(DialogTypeEnum.COPY_MACHINE);
    }

    public dialogString(): string {
        return `${super.dialogString()}` +
            `MNR.MNR=${this.fromMachine}|` +
            `MNR.MNR:Z=${this.toMachine}|`;
    }
}
