export class MaterialBatch {
  name: string;
  bufferName: string;
  bufferDescription: string;
  parentBuffer: string;
  quantity: number;
  material: string;
  materialType: string;
  SAPBatch: string;
  dateCode: string;
  lastChanged: Date;
  barCode: string;
}

export class MaterialBuffer {
  name: string;
  description: string;
  bufferLevel: number;
  parentBuffer: string;
  parentBuffers: string[] = [];
  leadBuffer: string;
}
