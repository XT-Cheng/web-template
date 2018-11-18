import { JWTTokenModel } from '@delon/auth';
import { MockRequest, MockStatusError } from '@delon/mock';

// TIPS: mockjs 一些优化细节见：https://ng-alain.com/docs/mock
// import * as Mock from 'mockjs';

const list = [];
const total = 50;

for (let i = 0; i < total; i += 1) {
  list.push({
    id: i + 1,
    disabled: i % 6 === 0,
    href: 'https://ant.design',
    avatar: [
      'https://gw.alipayobjects.com/zos/rmsportal/eeHMaZBwmTvLdIwMfBpg.png',
      'https://gw.alipayobjects.com/zos/rmsportal/udxAbMEhpwthVVcjLXik.png',
    ][i % 2],
    no: `TradeCode ${i}`,
    title: `一个任务名称 ${i}`,
    owner: '曲丽丽',
    description: '这是一段描述',
    callNo: Math.floor(Math.random() * 1000),
    status: Math.floor(Math.random() * 10) % 4,
    updatedAt: new Date(`2017-07-${Math.floor(i / 2) + 1}`),
    createdAt: new Date(`2017-07-${Math.floor(i / 2) + 1}`),
    progress: Math.ceil(Math.random() * 100),
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
model.token = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiYWRtaW4iLCJleHAiOjQ2NzA0MDk2MDAsImF2YXRhciI6ImFzc2V0cy9wZW9wbGUucG5nIiwiZW1haWwiOiJ4eXpAYWJjLmNvbSJ9.XR3qOzgRm5-NTi0hWPaD8U2hCoLTN2vb0SAAM3aYj2akAmlLWbdYldSO8GUrThH4r8-rexMpzaVWkyByHjJhSB1_mJsAWlC5pE2Cup2sHcaWGLdl3_OO1wLwWvIJ-smCydExx8be5FZd3_DXElvuY1R-Y4WSOgpYv0m7ampqJbY`;
const payloadDATA = {
  name: 'admin',
  exp: 4670409600,
  avatar: 'assets/people.png',
  email: 'xyz@abc.com'
};

export const USERS = {
  // 'POST /passport/login': { _token: model.token },
  // 'POST /passport/login': () => {
  //   throw new MockStatusError(404);
  // },
  '/user': (req: MockRequest) => genData(req.queryString),
  '/user/:id': (req: MockRequest) => list.find(w => w.id === +req.params.id),
  'POST /user/:id': (req: MockRequest) => saveData(+req.params.id, req.body),
  // 支持值为 Object 和 Array
  'GET /users': { users: [1, 2], total: 2 },
  // GET 可省略
  // '/users/1': Mock.mock({ id: 1, 'rank|3': '★★★' }),
  // POST 请求
  'POST /users/1': { uid: 1 },
  // 获取请求参数 queryString、headers、body
  '/qs': (req: MockRequest) => req.queryString.pi,
  // 路由参数
  '/users/:id': (req: MockRequest) => req.params, // /users/100, output: { id: 100 }
  // 发送 Status 错误
  '/404': () => {
    throw new MockStatusError(404);
  },
};
