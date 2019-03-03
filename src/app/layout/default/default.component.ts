import {
  Component,
  ViewChild,
  ComponentFactoryResolver,
  ViewContainerRef,
  AfterViewInit,
  OnInit,
  OnDestroy,
  ElementRef,
  Renderer2,
  Inject,
  TemplateRef,
  APP_INITIALIZER,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  Router,
  NavigationEnd,
  RouteConfigLoadStart,
  NavigationError,
  NavigationCancel,
} from '@angular/router';
import { NzMessageService, NzIconService } from 'ng-zorro-antd';
import { Subscription } from 'rxjs';
import { updateHostClass } from '@delon/util';
import { ScrollService, MenuService, SettingsService } from '@delon/theme';

// #region icons

import {
  MenuFoldOutline,
  MenuUnfoldOutline,
  SearchOutline,
  SettingOutline,
  FullscreenOutline,
  FullscreenExitOutline,
  BellOutline,
  LockOutline,
  PlusOutline,
  UserOutline,
  LogoutOutline,
  EllipsisOutline,
  GlobalOutline,
  ArrowDownOutline,
  // Optional
  GithubOutline,
  AppstoreOutline,
  UpSquareOutline,
} from '@ant-design/icons-angular/icons';
import { ReuseTabComponent } from '@shared/components/reuse-tab/reuse-tab.component';
import { StartupService } from '@core/startup/startup.service';
import { isMobile } from '@core/utils/helpers';
import { UtilityService } from '@core/utils/utility.service';

const ICONS = [
  MenuFoldOutline,
  MenuUnfoldOutline,
  UpSquareOutline,
  SearchOutline,
  SettingOutline,
  FullscreenOutline,
  FullscreenExitOutline,
  BellOutline,
  LockOutline,
  PlusOutline,
  UserOutline,
  LogoutOutline,
  EllipsisOutline,
  GlobalOutline,
  ArrowDownOutline,
  // Optional
  GithubOutline,
  AppstoreOutline,
];

// #endregion

@Component({
  selector: 'layout-default',
  templateUrl: './default.component.html',
  preserveWhitespaces: false,
  host: {
    '[class.alain-default]': 'true',
  },
})
export class LayoutDefaultComponent
  implements OnInit, AfterViewInit, OnDestroy {
  private notify$: Subscription;
  private savedSlideMode: boolean;
  isFetching = false;
  isSlideMode = false;
  isFullScreenMode = false;
  @ViewChild(ReuseTabComponent)
  reuseTabComp: ReuseTabComponent;
  @ViewChild('layoutHeader', { read: ElementRef })
  headerElem: ElementRef;
  @ViewChild('layoutSidebar', { read: ElementRef })
  siderbarElem: ElementRef;
  @ViewChild('section', { read: ElementRef })
  sectionElem: ElementRef;
  @ViewChild('reuseTab', { read: ElementRef })
  reuseTabElem: ElementRef;
  @ViewChild('routeOutlet', { read: ElementRef })
  routeOutletElem: ElementRef;
  constructor(
    iconSrv: NzIconService,
    private _utility: UtilityService,
    router: Router,
    scroll: ScrollService,
    _message: NzMessageService,
    private resolver: ComponentFactoryResolver,
    public menuSrv: MenuService,
    public settings: SettingsService,
    private el: ElementRef,
    private renderer: Renderer2,
    @Inject(APP_INITIALIZER) startUp: StartupService,
    @Inject(DOCUMENT) private doc: any,
  ) {
    iconSrv.addIcon(...ICONS);
    // scroll to top in change page
    router.events.subscribe(evt => {
      if (!this.isFetching && evt instanceof RouteConfigLoadStart) {
        this.isFetching = true;
      }
      if (evt instanceof NavigationError || evt instanceof NavigationCancel) {
        this.isFetching = false;
        if (evt instanceof NavigationError) {
          _message.error(`无法加载${evt.url}路由`, { nzDuration: 1000 * 3 });
        }
        return;
      }
      if (!(evt instanceof NavigationEnd)) {
        return;
      }
      setTimeout(() => {
        scroll.scrollToTop();
        this.isFetching = false;
      }, 100);
    });
  }

  private setClass() {
    const { el, renderer, settings } = this;
    const layout = settings.layout;
    updateHostClass(
      el.nativeElement,
      renderer,
      {
        ['alain-default']: true,
        [`alain-default__fixed`]: layout.fixed,
        [`alain-default__boxed`]: layout.boxed,
        [`alain-default__collapsed`]: layout.collapsed,
        ['mobile-layout']: isMobile()
      },
      true,
    );

    this.doc.body.classList[layout.colorWeak ? 'add' : 'remove']('color-weak');
  }

  ngAfterViewInit(): void {
  }

  ngOnInit() {
    this.notify$ = this.settings.notify.subscribe(() => this.setClass());
    this.setClass();
  }

  ngOnDestroy() {
    this.notify$.unsubscribe();
  }

  onActivate(compInstance: any) {
    this._utility.activeComponent = compInstance;
  }

  onDeactivate($event) {
    this._utility.activeComponent = null;
  }

  changeSlideMode() {
    this.isSlideMode = !this.isSlideMode;
    this.savedSlideMode = false;
  }

  changeFullScreenMode() {
    this.isFullScreenMode = !this.isFullScreenMode;
    this.adjustFullScreen();
  }

  onCountDownFinished() {
    let toPos = this.reuseTabComp.pos + 1;
    if (toPos === this.reuseTabComp.list.length) {
      toPos = 0;
    }
    this.savedSlideMode = this.isSlideMode;
    this.isSlideMode = false;
    this.reuseTabComp.to(null, toPos);
  }

  tabChanged() {
    if (this.savedSlideMode) {
      this.isSlideMode = true;
    }
  }

  isMobile() {
    return isMobile();
  }

  adjustFullScreen() {
    if (this.isFullScreenMode) {
      this.renderer.setStyle(
        this.headerElem.nativeElement,
        'display',
        'none'
      );
      this.renderer.setStyle(
        this.siderbarElem.nativeElement,
        'display',
        'none'
      );
      this.renderer.setStyle(
        this.sectionElem.nativeElement,
        'margin-left',
        '24px'
      );
      this.renderer.setStyle(
        this.routeOutletElem.nativeElement,
        'display',
        'inline'
      );
      this.renderer.setStyle(
        this.reuseTabElem.nativeElement,
        'width',
        '100%'
      );
      this.renderer.setStyle(
        this.reuseTabElem.nativeElement,
        'top',
        '0px'
      );
    } else {
      this.renderer.setStyle(
        this.headerElem.nativeElement,
        'display',
        'flex'
      );
      this.renderer.setStyle(
        this.siderbarElem.nativeElement,
        'display',
        'block'
      );
      this.renderer.setStyle(
        this.sectionElem.nativeElement,
        'margin-left',
        '88px'
      );
      this.renderer.setStyle(
        this.routeOutletElem.nativeElement,
        'display',
        'block'
      );
      this.renderer.setStyle(
        this.reuseTabElem.nativeElement,
        'width',
        '95%'
      );
      this.renderer.setStyle(
        this.reuseTabElem.nativeElement,
        'top',
        '40px'
      );
    }
  }
}
