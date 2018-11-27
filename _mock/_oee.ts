import { MockRequest } from '@delon/mock';
import { IMachineOEE } from '@shared/report/interface';

const beginDay = new Date().getTime();

const data: IMachineOEE[] = [{
  machine: 'KOMAX001',
  availability: 0.89,
  quality: 0.99,
  efficiency: 0.97,
  oee: 0.89 * 0.99 * 0.97,
  startFrom: new Date(beginDay - 1000 * 60 * 60 * 24),
  endAt: new Date(),
}];


export const OEE = {
  '/machine-oee': (req: MockRequest) => {
    return data;
  },
};
