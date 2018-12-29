import { JWTTokenModel } from '@delon/auth';
import { MockRequest, MockStatusError } from '@delon/mock';

// TIPS: mockjs 一些优化细节见：https://ng-alain.com/docs/mock
// import * as Mock from 'mockjs';

const list = [];
const total = 5;

for (let i = 0; i < total; i += 1) {
  list.push({
    id: i + 1,
    accessStrings: ['access_1', 'access_2'],
  });
}

function genData(params: any) {
  let ret = [...list];
  const pi = +params.pi,
    ps = +params.ps,
    start = (pi - 1) * ps;

  if (params.no) {
    ret = ret.filter(data => data.no.indexOf(params.no) > -1);
  }

  return { total: ret.length, list: ret.slice(start, ps * pi) };
}

function saveData(id: number, value: any) {
  const item = list.find(w => w.id === id);
  if (!item) {
    return { msg: '无效用户信息' };
  }
  Object.assign(item, value);
  return { msg: 'ok' };
}

const model = new JWTTokenModel();
// from: https://jwt.io/
// tslint:disable-next-line:max-line-length
model.token = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZXhwIjo0NjcwNDA5NjAwLCJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6Inh5ekBhYmMuY29tIiwiYXZhdGFyIjoiYXNzZXRzL3Blb3BsZS5wbmcifQ.0SmeW63Ijc5LUp3fBD2Fz_0Ye-InhMwXHdlaypiHf3eAKAO1URPFvqZ3JMXgBePCvfNCszMem417HHAZVvSWm7y3GBxZ8Wf2Mgj0Kv713HdbO58iHrGW7VYscMVsb4iRv2je7gzWyYM6QFYiVj4C7E-TgkskLR7edktHKmePw94`;
const payloadDATA = {
  id: 1,
  name: 'admin',
  exp: 4670409600,
  avatar: 'assets/people.png',
  email: 'xyz@abc.com'
};

export const USERS = {
  '/userAccess/:id': (req: MockRequest) => {
    const found = list.find(w => w.id === +req.params.id);
    if (found) {
      return found.accessStrings;
    }

    return [];
  },
};
