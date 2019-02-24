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
  class: string;
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

export class BatchConnection {
  totalLevel: number;
  root: string;
  nodes: BatchConnectionNode[];
}

export class BatchConnectionNode {
  level: number;
  inputBatch: string;
  inputBatchMaterial: string;
  inputBatchMaterialType: string;
  outputBatch: string;
  outputBatchMaterial: string;
  outputBatchMaterialType: string;
}

export class BatchConsumeConnectionNode extends BatchConnectionNode {
  machineName: string;
  orderName: string;
}

export class BatchMergeConnectionNode extends BatchConnectionNode {
  get mergeFrom(): string {
    return this.inputBatch;
  }
  get mergeTo(): string {
    return this.outputBatch;
  }
  get material(): string {
    return this.inputBatchMaterial;
  }
  get materialType(): string {
    return this.inputBatchMaterialType;
  }
}

export class BatchSplitConnectionNode extends BatchConnectionNode {
  get splitFrom(): string {
    return this.inputBatch;
  }
  get splitTo(): string {
    return this.outputBatch;
  }
  get material(): string {
    return this.inputBatchMaterial;
  }
  get materialType(): string {
    return this.inputBatchMaterialType;
  }
}
