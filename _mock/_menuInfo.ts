import { Menu } from '@delon/theme';
import { MockRequest } from '@delon/mock';
import { toBoolean } from '@delon/util';

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
        link: `/dashboard/lineGeneral/SG-00001`,
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
        text: '穿缸线-2',
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
        text: 'KOMAX 5号机',
        group: false,
        /** 路由 */
        link: `/dashboard/lineGeneral/KM-00005`,
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
    },
    {
      text: '物料批次追溯',
      group: false,
      /** 图标 */
      icon: `anticon anticon-rocket`,
      /** 路由 */
      link: `/reports/batchTrace`,
    }]
  }]
}];

const mobileMenuInfo: Menu[] = [{
  text: '主导航',
  group: true,
  /** 图标 */
  icon: `anticon anticon-rocket`,
  children: [{
    text: '物料相关',
    group: false,
    icon: `anticon anticon-area-chart`,
    link: `/material/list`,
  },
  {
    text: '工单相关',
    group: false,
    icon: `anticon anticon-area-chart`,
    link: `/operation/list`,
  },
  {
    text: '设备相关',
    group: false,
    icon: `anticon anticon-area-chart`,
    link: `/machine/list`,
  },
  {
    text: '工夹具相关',
    group: false,
    icon: `anticon anticon-area-chart`,
    link: `/tool/list`,
  },
  {
    text: '人员相关',
    group: false,
    icon: `anticon anticon-area-chart`,
    link: `/operator/list`,
  }]
}];

function getMenuInfo(params: any) {
  if (toBoolean(params.isMobile)) {
    return mobileMenuInfo;
  } else {
    return menuInfo;
  }
}

export const MENUINFO = {
  '/menuInfo': (req: MockRequest) => getMenuInfo(req.queryString) // menuInfo
};
