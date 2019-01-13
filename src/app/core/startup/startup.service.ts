import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, Injector } from '@angular/core';
import { ACLService } from '@delon/acl';
import { ALAIN_I18N_TOKEN, MenuService, SettingsService, TitleService } from '@delon/theme';
import { TranslateService } from '@ngx-translate/core';
import { NzIconService } from 'ng-zorro-antd';
import { zip } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ICONS } from '../../../style-icons';
import { ICONS_AUTO } from '../../../style-icons-auto';
import { I18NService } from '../i18n/i18n.service';
import { isMobile } from '@core/utils/helpers';

/**
 * 用于应用启动时
 * 一般用来获取应用所需要的基础数据等
 */
@Injectable()
export class StartupService {
  constructor(
    iconSrv: NzIconService,
    private menuService: MenuService,
    private translate: TranslateService,
    @Inject(ALAIN_I18N_TOKEN) private i18n: I18NService,
    private settingService: SettingsService,
    private aclService: ACLService,
    private titleService: TitleService,
    private httpClient: HttpClient) {
    iconSrv.addIcon(...ICONS_AUTO, ...ICONS);
  }

  private viaHttp(resolve: any) {
    zip(
      this.httpClient.get(`./assets/i18n/${this.i18n.defaultLang}.json`),
      this.httpClient.get(`/appInfo`),
      this.httpClient.get(`/menuInfo?isMobile=${isMobile()}`),
      this.httpClient.get(`/userAccess/${this.settingService.user.id}`)
    ).pipe(
      // 接收其他拦截器后产生的异常消息
      catchError(([langData, appData, menuData, userAccessData]) => {
        resolve(null);
        return [langData, appData, menuData, userAccessData];
      })
    ).subscribe(([langData, appData, menuData, userAccessData]) => {
      // setting language data
      this.translate.setTranslation(this.i18n.defaultLang, langData);
      this.translate.setDefaultLang(this.i18n.defaultLang);

      // 应用信息：包括站点名、描述、年份
      this.settingService.setApp(Object.assign(this.settingService.app, appData));
      // ACL：设置权限
      this.aclService.setRole(userAccessData);
      // 初始化菜单
      this.menuService.add(menuData);
      // 设置页面标题的后缀
      this.titleService.suffix = appData.name;
    },
      () => { },
      () => {
        resolve(null);
      });
  }

  load(): Promise<any> {
    // only works with promises
    // https://github.com/angular/angular/issues/15088
    return new Promise((resolve) => {
      G2.track(false);
      this.viaHttp(resolve);
    });
  }
}
