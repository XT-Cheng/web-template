import { MockRequest } from '@delon/mock';

const batches = [];

for (let i = 0; i < 1000; i += 1) {
  batches.push({
    name: `Batch-${i}`,
    bufferName: `0-Buffer-${Math.floor(Math.random() * 200)}`,
    quantity: Math.floor(Math.random() * 100),
    material: `Material-${Math.floor(Math.random() * 20)}`,
    SAPBatch: `SAPBatch-${Math.floor(Math.random() * 20)}`,
    dateCode: `${Math.floor(Math.random() * 1000)}`
  });
}

export const BATCH = {
  '/batches': (req: MockRequest) => {
    return batches;
  },
};
