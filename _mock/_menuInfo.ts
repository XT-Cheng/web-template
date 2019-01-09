import { Menu } from '@delon/theme';
import { MockRequest } from '@delon/mock';

const menuInfo: Menu[] = [{
  text: '主导航',
  group: true,
  /** 图标 */
  icon: `anticon anticon-rocket`,
  children: [{
    text: '仪表盘',
    group: true,
    icon: `anticon anticon-dashboard`,
    children: [{
      text: 'Line Summary',
      group: true,
      /** 图标 */
      icon: `anticon anticon-rocket`,
      children: [{
        text: '成品线',
        group: false,
        /** 路由 */
        link: `/dashboard/lineGeneral/FG-00001`,
      },
      {
        text: '流量单元',
        group: false,
        /** 路由 */
        link: `/dashboard/lineGeneral/FU-00001`,
      },
      {
        text: '屏蔽线',
        group: false,
        /** 路由 */
        link: `/dashboard/lineGeneral/SW-00001`,
      },
      {
        text: '穿缸线-1',
        group: false,
        /** 路由 */
        link: `/dashboard/lineGeneral/CC-00001`,
      },
      {
        text: '穿缸线-1',
        group: false,
        /** 路由 */
        link: `/dashboard/lineGeneral/CC-00002`,
      },
      {
        text: '波纹管-1',
        group: false,
        /** 路由 */
        link: `/dashboard/lineGeneral/BC-00001`,
      },
      {
        text: '波纹管-2',
        group: false,
        /** 路由 */
        link: `/dashboard/lineGeneral/BC-00002`,
      },
      {
        text: 'KOMAX 1号机',
        group: false,
        /** 路由 */
        link: `/dashboard/lineGeneral/KM-00001`,
      },
      {
        text: 'KOMAX 2号机',
        group: false,
        /** 路由 */
        link: `/dashboard/lineGeneral/KM-00002`,
      },
      {
        text: 'KOMAX 3号机',
        group: false,
        /** 路由 */
        link: `/dashboard/lineGeneral/KM-00003`,
      },
      {
        text: 'KOMAX 4号机',
        group: false,
        /** 路由 */
        link: `/dashboard/lineGeneral/KM-00004`,
      },
      {
        text: '套管-1',
        group: false,
        /** 路由 */
        link: `/dashboard/lineGeneral/CT-00001`,
      },
      {
        text: '套管-2',
        group: false,
        /** 路由 */
        link: `/dashboard/lineGeneral/CT-00002`,
      }]
    }]
  },
  {
    text: '报表',
    group: true,
    icon: `anticon anticon-area-chart`,
    children: [{
      text: '物料批次概览',
      group: false,
      /** 图标 */
      icon: `anticon anticon-rocket`,
      /** 路由 */
      link: `/reports/batchSummary`,
    }]
  }]
}];

function getMenuInfo(params: any) {
  return menuInfo;
}

export const MENUINFO = {
  '/menuInfo': (req: MockRequest) => getMenuInfo(req.queryString) // menuInfo
};
