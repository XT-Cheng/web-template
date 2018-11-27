import { MockRequest } from '@delon/mock';
import { IScrapStatistics } from '@shared/report/interface';

const beginDay = new Date().getTime();

const data: IScrapStatistics[] = [{
  machine: 'KOMAX001',
  order: '2002002033223230',
  startFrom: new Date(beginDay - 1000 * 60 * 60 * 24),
  endAt: new Date(),
  scrapDetails: [
    { code: 'Reason_1', quantity: 12 },
    { code: 'Reason_2', quantity: 22 },
    { code: 'Reason_3', quantity: 2 },
    { code: 'Reason_4', quantity: 4 },
    { code: 'Reason_5', quantity: 9 },
  ]
},
{
  machine: 'KOMAX002',
  order: '2002002033223231',
  startFrom: new Date(beginDay - 1000 * 60 * 60 * 24),
  endAt: new Date(),
  scrapDetails: [
    { code: 'Reason_1', quantity: 33 },
    { code: 'Reason_2', quantity: 946 },
    { code: 'Reason_3', quantity: 21 },
    { code: 'Reason_4', quantity: 12 },
  ]
}];

export const SCRAP = {
  '/scrap': (req: MockRequest) => {
    return data;
  },
};
