import { MockRequest, MockStatusError } from '@delon/mock';

function importData(value: any) {
  return {
    value: value
  };
}

export const FAKEAPIS = {
  // 'POST /passport/login': { _token: model.token },
  // 'POST /passport/login': () => {
  //   throw new MockStatusError(404);
  // },
  'POST /import': (req: MockRequest) => importData(req.body)
};
