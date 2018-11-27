import { IMaterialBatch } from '@shared/report/interface';
import { addDays } from 'date-fns';
import { MockRequest } from '@delon/mock';
const beginDay = new Date().getTime();

const data: IMaterialBatch[] = [
  {
    batchName: 'Batch20020001',
    qty: 920,
    buffer: 'Buffer0001',
    material: 'Mat0001',
    lastChanged: new Date(beginDay - 1000 * 60 * 60 * 24 * 1)
  },
  {
    batchName: 'Batch20020001',
    qty: 120,
    buffer: 'Buffer0001',
    material: 'Mat0001',
    lastChanged: new Date(beginDay - 1000 * 60 * 60 * 24 * 2)
  },
  {
    batchName: 'Batch20020001',
    qty: 100,
    buffer: 'Buffer0001',
    material: 'Mat0001',
    lastChanged: new Date(beginDay - 1000 * 60 * 60 * 24 * 2)
  },
  {
    batchName: 'Batch20020002',
    qty: 500,
    buffer: 'Buffer0001',
    material: 'Mat0002',
    lastChanged: new Date(beginDay - 1000 * 60 * 60 * 24 * 3)
  },
  {
    batchName: 'Batch20020003',
    qty: 9000,
    buffer: 'Buffer0002',
    material: 'Mat0002',
    lastChanged: new Date(beginDay - 1000 * 60 * 60 * 24 * 5)
  },
  {
    batchName: 'Batch20020004',
    qty: 320,
    buffer: 'Buffer0001',
    material: 'Mat0001',
    lastChanged: new Date(beginDay - 1000 * 60 * 60 * 24 * 7)
  },
  {
    batchName: 'Batch20020005',
    qty: 50,
    buffer: 'Buffer0001',
    material: 'Mat0001',
    lastChanged: new Date(beginDay - 1000 * 60 * 60 * 12)
  },
  {
    batchName: 'Batch20020006',
    qty: 920,
    buffer: 'Buffer0003',
    material: 'Mat0003',
    lastChanged: new Date(beginDay - 1000 * 60 * 60 * 24 * 8)
  },
  {
    batchName: 'Batch20020007',
    qty: 20000,
    buffer: 'Buffer0004',
    material: 'Mat0004',
    lastChanged: new Date(beginDay - 1000 * 60 * 60 * 24 * 30)
  },
  {
    batchName: 'Batch20020008',
    qty: 920,
    buffer: 'Buffer0004',
    material: 'Mat0002',
    lastChanged: new Date(beginDay - 1000 * 60 * 60 * 24 * 15)
  },
  {
    batchName: 'Batch20020009',
    qty: 200,
    buffer: 'Buffer0005',
    material: 'Mat0002',
    lastChanged: new Date(beginDay - 1000 * 60 * 60 * 24 * 1)
  },
  {
    batchName: 'Batch20020010',
    qty: 120,
    buffer: 'Buffer0001',
    material: 'Mat0004',
    lastChanged: new Date(beginDay - 1000 * 60 * 60 * 24 * 1)
  }
];

function getMaterial(params: any) {
  let ret = [...data];

  if (params.material) {
    ret = ret.filter(item => item.material.indexOf(params.material) > -1);
  }

  if (params.buffer) {
    ret = ret.filter(item => item.buffer.indexOf(params.buffer) > -1);
  }

  if (params.changedBefore > 0) {
    ret = ret.filter(item => {
      return item.lastChanged < addDays(new Date(), -params.changedBefore);
    });
  }

  return ret;
}

export const MATERIALS = {
  '/sluggish-material': (req: MockRequest) => getMaterial(req.queryString),
};

