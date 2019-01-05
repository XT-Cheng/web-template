import {
  Component,
  Input,
  HostBinding,
  ViewChild,
  ElementRef,
  OnDestroy,
  OnChanges,
  ChangeDetectionStrategy,
  NgZone,
} from '@angular/core';
import { toNumber } from '@delon/util';
import { Subscription, fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

declare var G2: any;

@Component({
  selector: 'fw-g2-mini-bar',
  template: `<div #container></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartMiniBarComponent implements OnDestroy, OnChanges {
  // #region fields
  private resize$: Subscription = null;

  @Input()
  color = '#1890FF';

  @HostBinding('style.height.px')
  @Input()
  get height() {
    return this._height;
  }
  set height(value: any) {
    this._height = toNumber(value);
  }
  private _height = 0;

  @Input()
  set borderWidth(value: any) {
    this._borderWidth = toNumber(value);
  }
  private _borderWidth = 5;

  @Input()
  padding: number[] = [8, 8, 8, 8];

  @Input()
  data: Array<{
    x: number; y: number;
    [key: string]: any
  }>;

  @Input()
  yTooltipSuffix = '';

  // #endregion

  @ViewChild('container')
  private node: ElementRef;

  private chart: any;

  constructor(private zone: NgZone) { }

  private install() {
    if (!this.data) return;

    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    this.node.nativeElement.innerHTML = '';

    const chart = new G2.Chart({
      container: this.node.nativeElement,
      forceFit: true,
      height: +this.height,
      padding: this.padding,
      legend: null,
      animate: false, // 关闭图表动画
    });

    chart.axis(false);

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
      hideMarkders: false,
      crosshairs: false,
      'g2-tooltip': { padding: 4 },
      'g2-tooltip-list-item': { margin: `0px 4px` },
    });
    chart
      .interval()
      .position('x*y')
      .size(this._borderWidth)
      .color(this.color)
      .tooltip('x*y', (x, y) => {
        return {
          name: x,
          value: y + this.yTooltipSuffix,
        };
      });

    chart.render();

    this.chart = chart;
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

  private runInstall() {
    this.zone.runOutsideAngular(() => setTimeout(() => this.install()));
  }

  private installResizeEvent() {
    if (this.resize$) return;

    this.resize$ = fromEvent(window, 'resize')
      .pipe(debounceTime(200))
      .subscribe(() => this.runInstall());
  }
}
