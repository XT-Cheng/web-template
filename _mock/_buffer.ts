import { MockRequest } from '@delon/mock';

const buffers = [];

const buffers3 = [];
const buffers2 = [];
const buffers1 = [];

const batchs = [];

for (let i = 0; i < 3; i += 1) {
  const buffer = {
    name: `3-Buffer-${i}`,
    description: `3-Buffer-${i}`,
    parentBuffer: ``,
    bufferLevel: 4,
  };

  buffers.push(buffer);
  buffers3.push(buffer);
}

for (let i = 0; i < 10; i += 1) {
  const buffer = {
    name: `2-Buffer-${i}`,
    description: `2-Buffer-${i}`,
    parentBuffer: buffers3[Math.floor(Math.random() * 3)].name,
    bufferLevel: 3,
  };

  buffers.push(buffer);
  buffers2.push(buffer);
}

for (let i = 0; i < 50; i += 1) {
  const buffer = {
    name: `1-Buffer-${i}`,
    description: `1-Buffer-${i}`,
    parentBuffer: buffers2[Math.floor(Math.random() * 10)].name,
    bufferLevel: 2,
  };

  buffers.push(buffer);
  buffers1.push(buffer);
}

for (let i = 0; i < 200; i += 1) {
  const buffer = {
    name: `0-Buffer-${i}`,
    description: `0-Buffer-${i}`,
    parentBuffer: buffers1[Math.floor(Math.random() * 50)].name,
    bufferLevel: 1,
  };

  buffers.push(buffer);
}

export const BUFFER = {
  '/buffers': (req: MockRequest) => {
    return buffers;
  },
};
