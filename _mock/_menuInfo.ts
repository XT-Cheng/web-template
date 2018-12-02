import { Menu } from '@delon/theme';

const menuInfo: Menu[] = [{
  text: '主导航',
  group: true,
  /** 图标 */
  icon: `anticon anticon-rocket`,
  children: [{
    text: 'Dashboard',
    group: true,
    icon: `anticon anticon-dashboard`,
    children: [{
      text: 'Line Summary',
      group: false,
      /** 图标 */
      icon: `anticon anticon-rocket`,
      /** 路由 */
      link: `/dashboard/lineGeneral`,
    }]
  },
  {
    text: 'Reports',
    group: true,
    icon: `anticon anticon-area-chart`,
    children: [{
      text: 'Batch Summary',
      group: false,
      /** 图标 */
      icon: `anticon anticon-rocket`,
      /** 路由 */
      link: `/reports/batchSummary`,
    }]
  }]
}];

export const MENUINFO = {
  '/menuInfo': menuInfo
};
