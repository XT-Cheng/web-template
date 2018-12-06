import { Menu } from '@delon/theme';

const menuInfo: Menu[] = [{
  text: '主导航',
  group: true,
  /** 图标 */
  icon: `anticon anticon-rocket`,
  children: [{
    text: 'Sample',
    group: false,
    /** 图标 */
    icon: `anticon anticon-rocket`,
    /** 路由 */
    link: `/passport/login`,
    /** ACL */
    acl: `access_1`
  }]
}];

export const MENUINFO = {
  '/menuInfo': menuInfo
};
