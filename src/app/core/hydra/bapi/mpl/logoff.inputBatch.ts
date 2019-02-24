import { DialogBase } from '@core/hydra/bapi/dialog.base';
import { DialogTypeEnum } from '@core/hydra/bapi/constants';

export class LogoffInputBatch extends DialogBase {
    constructor(private operation: string, private machineName: string, private badgeName: string,
        private batchId: string, private pos: number) {
        super(DialogTypeEnum.LOGOFF_INPUT_BATCH);
    }

    public dialogString(): string {
        return `${super.dialogString()}` +
                `ANR=${this.operation}|` +
                `MNR=${this.machineName}|` +
                `KNR=${this.badgeName}|` +
                `CNR=${this.batchId}|`;
    }
}
