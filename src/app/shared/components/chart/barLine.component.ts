import {
  Component,
  Input,
  HostBinding,
  ViewChild,
  ElementRef,
  OnDestroy,
  OnChanges,
  NgZone,
  TemplateRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { Subscription, fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { toBoolean, toNumber } from '@delon/util';

declare var G2: any;

@Component({
  selector: 'fw-g2-bar-line',
  template: `
  <ng-container *ngIf="_title; else _titleTpl"><h4 style="margin-bottom:20px">{{_title}}</h4></ng-container>
  <div #container></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  preserveWhitespaces: false,
})
export class ChartBarLineComponent implements OnDestroy, OnChanges {
  private autoHideXLabels = false;
  private resize$: Subscription = null;
  private chart: any;

  // #region fields
  _title = '';
  _titleTpl: TemplateRef<any>;
  @Input()
  set title(value: string | TemplateRef<any>) {
    if (value instanceof TemplateRef) {
      this._title = null;
      this._titleTpl = value;
    } else {
      this._title = value;
    }
    this.cd.detectChanges();
  }

  @Input() color = 'rgba(24, 144, 255, 0.85)';
  @Input() colorBelowLimit = 'red';
  @Input() colorOverLimit = 'lime';

  @HostBinding('style.height.px')
  @Input()
  get height() {
    return this._height;
  }
  set height(value: any) {
    this._height = toNumber(value);
  }
  private _height = 0;

  @Input() limit = 1000;

  @Input() padding: number[];
  @Input() data: Array<{
    x: any; y: any;
    [key: string]: any
  }>;

  @Input()
  set autoLabel(value: any) {
    this._autoLabel = toBoolean(value);
  }
  private _autoLabel = true;

  // #endregion

  @ViewChild('container') private node: ElementRef;

  constructor(
    private el: ElementRef,
    private cd: ChangeDetectorRef,
    private zone: NgZone,
  ) { }

  private runInstall() {
    this.zone.runOutsideAngular(() => setTimeout(() => this.install()));
  }

  private install() {
    const canvasWidth = this.el.nativeElement.clientWidth;
    const minWidth = this.data.length * 30;

    if (canvasWidth <= minWidth) {
      if (!this.autoHideXLabels) {
        this.autoHideXLabels = true;
      }
    } else if (this.autoHideXLabels) {
      this.autoHideXLabels = false;
    }

    if (!this.data || (this.data && this.data.length < 1)) return;
    this.node.nativeElement.innerHTML = '';

    const chart = new G2.Chart({
      container: this.node.nativeElement,
      forceFit: true,
      height: this._title || this._titleTpl ? this.height - 41 : this.height,
      // legend: null,
      padding: this.padding || 'auto',
    });

    // chart.axis('x', !this.autoHideXLabels);
    chart.axis('x', true);
    chart.axis('y', {
      title: false,
      line: false,
      tickLine: false,
    });

    chart.source(this.data, {
      x: {
        type: 'cat',
      },
      y: {
        min: 0,
      },
    });

    chart.tooltip({
      showTitle: false,
    });
    chart
      .interval()
      .position('x*y')
      // .color('y')
      // .color(this.color)
      .color('y', (y) => { // 通过回调函数
        if (y > this.limit) {
          return this.colorOverLimit;
        }
        return this.colorBelowLimit;
      })
      .tooltip('x*y', (x, y) => {
        return {
          name: x,
          value: y,
        };
      })
      .label('y', {
        textStyle: {
          textAlign: 'center', // 文本对齐方向，可取值为： start middle end
          // fill: '#404040', // 文本的颜色
          // fontSize: '12', // 文本大小
          // fontWeight: 'bold', // 文本粗细
          // rotate: 30,
          textBaseline: 'top' // 文本基准线，可取 top middle bottom，默认为middle
        }
      });
    if (this.limit > 0) {
      chart.guide().line({
        top: true, // 指定 guide 是否绘制在 canvas 最上层，默认为 false, 即绘制在最下层
        start: ['start', this.limit], // 辅助线起始位置
        end: ['end', this.limit], // 辅助线结束位置
        lineStyle: {
          strokeStyle: '#975FE4',
          lineWidth: 2,
          lineCap: 'round'
        }
      });
    }

    chart.render();
    this.chart = chart;
  }

  private installResizeEvent() {
    if (!this._autoLabel || this.resize$) return;

    this.resize$ = fromEvent(window, 'resize')
      .pipe(debounceTime(200))
      .subscribe(() => this.runInstall());
  }

  ngOnChanges(): void {
    this.installResizeEvent();
    this.runInstall();
  }

  ngOnDestroy(): void {
    if (this.resize$) this.resize$.unsubscribe();
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
}
