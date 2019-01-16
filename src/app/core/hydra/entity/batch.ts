export class MaterialBatch {
  name: string;
  bufferName: string;
  bufferDescription: string;
  parentBuffer: string;
  startQty: number;
  quantity: number;
  material: string;
  materialType: string;
  status: string;
  unit: string;
  SAPBatch: string;
  dateCode: string;
  lastChanged: Date;
  barCode: string;
  get display(): string {
    if (this.bufferDescription) {
      return `${this.name}, ${this.material}, ${this.quantity}, ${this.bufferDescription}`;
    } else {
      return `${this.name}, ${this.material}, ${this.quantity}`;
    }
  }
}

export class MaterialBuffer {
  name: string;
  description: string;
  bufferLevel: number;
  parentBuffer: string;
  parentBuffers: string[] = [];
  leadBuffer: string;
  get display(): string {
    return `${this.description}`;
  }
}
