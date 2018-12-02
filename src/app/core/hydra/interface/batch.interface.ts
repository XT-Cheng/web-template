export class Batch {
  name: string;
  bufferName: string;
  parentBuffer: string;
  quantity: number;
  material: string;
  SAPBatch: string;
  dateCode: string;
}

export class Buffer {
  name: string;
  description: string;
  bufferLevel: number;
  parentBuffer: string;
  parentBuffers: string[] = [];
  leadBuffer: string;
}
