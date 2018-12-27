import { DialogTypeEnum } from '@core/hydra/bapi/constants';
import { DialogBase } from '@core/hydra/bapi/dialog.base';

export class CreateBufferBapi extends DialogBase {
  constructor(private name: string, private description: string,
    private type: string, private plant: string, private area: string,
    private storageLocation: string, private parent: string, private level: number
  ) {
    super(DialogTypeEnum.MPL_CREATE_BUFFER);
  }

  public dialogString(): string {
    return `${super.dialogString()}` +
      `MATPUF.MATPUF=${this.name}|` +
      `MATPUF.HARCID=${this.level}|` +
      `MATPUF.HARCMATPUF=${this.parent}|` +
      `MATPUF.TYP=${this.type}|` +
      `MATPUF.BER=${this.area}|` +
      `MATPUF.LAGORT=${this.storageLocation}|` +
      `MATPUF.BEZ=${this.description}|` +
      `MATPUF.OPT:PKORB=N|` +
      `MATPUF.OPT:INBESTVERB=J|` +
      `MATPUF.OPT:VIRTLAG=N|` +
      `MATPUF.FIR=${this.plant}|`;
  }
}
