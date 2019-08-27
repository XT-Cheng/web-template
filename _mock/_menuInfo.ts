import { Menu } from '@delon/theme';
import { MockRequest } from '@delon/mock';
import { toBoolean } from '@delon/util';

const menuInfo: Menu[] = [{
  text: '主导航',
  i18n: `menu.main`,
  group: true,
  /** 图标 */
  icon: `anticon anticon-rocket`,
  children: [{
    text: '仪表盘',
    i18n: `menu.dashboard`,
    group: true,
    icon: `anticon anticon-dashboard`,
    children: [{
      text: '产线概况',
      // i18n: `app.route.line-summary`,
      group: true,
      /** 图标 */
      icon: `anticon anticon-rocket`,
      children: [{
        text: '潍柴',
        group: false,
        /** 路由 */
        link: `/dashboard/lineGeneral/SG-00001`
      },
      {
        text: 'LCC-01',
        group: false,
        /** 路由 */
        link: `/dashboard/lineGeneral/SG-00002`,
      },
      {
        text: 'LCC-02',
        group: false,
        /** 路由 */
        link: `/dashboard/lineGeneral/SG-00003`,
      },
      {
        text: 'LCC-03',
        group: false,
        /** 路由 */
        link: `/dashboard/lineGeneral/SG-00004`,
      },
      {
        text: 'LCC-04',
        group: false,
        /** 路由 */
        link: `/dashboard/lineGeneral/SG-00005`,
      },
      {
        text: 'LCC-05',
        group: false,
        /** 路由 */
        link: `/dashboard/lineGeneral/SG-00006`,
      },
      {
        text: 'LCC-06',
        group: false,
        /** 路由 */
        link: `/dashboard/lineGeneral/SG-00007`,
      },
      {
        text: 'LCC-07',
        group: false,
        /** 路由 */
        link: `/dashboard/lineGeneral/SG-00008`,
      },
      {
        text: 'LCC-08',
        group: false,
        /** 路由 */
        link: `/dashboard/lineGeneral/SG-00009`,
      },
      {
        text: 'LCC-09',
        group: false,
        /** 路由 */
        link: `/dashboard/lineGeneral/SG-00010`,
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
    i18n: `app.route.line-summary`,
    group: true,
    icon: `anticon anticon-area-chart`,
    children: [{
      text: '物料批次概览',
      i18n: `app.report.batch.general`,
      group: false,
      /** 图标 */
      icon: `anticon anticon-rocket`,
      /** 路由 */
      link: `/reports/batchSummary`,
    },
    {
      text: '物料批次追溯',
      i18n: `app.report.batch.trace`,
      group: false,
      /** 图标 */
      icon: `anticon anticon-rocket`,
      /** 路由 */
      link: `/reports/batchTrace`,
    }]
  }]
}];

// }];

const mobileMenuInfo: Menu[] = [{
  text: '主导航',
  i18n: `menu.main`,
  group: true,
  /** 图标 */
  icon: `anticon anticon-rocket`,
  children: [{
    text: '物料相关',
    group: false,
    icon: `anticon anticon-area-chart`,
    i18n: `app.mobile.material.functions`,
    link: `/material/list`,
  },
  {
    text: '工单相关',
    group: false,
    icon: `anticon anticon-area-chart`,
    i18n: `app.mobile.operation.functions`,
    link: `/operation/list`,
  },
  {
    text: '设备相关',
    group: false,
    icon: `anticon anticon-area-chart`,
    i18n: `app.mobile.machine.functions`,
    link: `/machine/list`,
  },
  {
    text: '工夹具相关',
    group: false,
    icon: `anticon anticon-area-chart`,
    i18n: `app.mobile.tool.functions`,
    link: `/tool/list`,
  },
  {
    text: '人员相关',
    group: false,
    icon: `anticon anticon-area-chart`,
    i18n: `app.mobile.operator.functions`,
    link: `/operator/list`,
  },
  {
    text: '配置',
    group: false,
    icon: `anticon anticon-area-chart`,
    i18n: `app.mobile.setup.functions`,
    link: `/setup/list`,
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
