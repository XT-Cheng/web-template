export class Batch {
  name: string;
  bufferName: string;
  bufferDescription: string;
  parentBuffer: string;
  quantity: number;
  material: string;
  SAPBatch: string;
  dateCode: string;
  lastChanged: Date;
}

export class Buffer {
  name: string;
  description: string;
  bufferLevel: number;
  parentBuffer: string;
  parentBuffers: string[] = [];
  leadBuffer: string;
}
