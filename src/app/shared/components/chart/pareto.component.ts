import {
  OnDestroy,
  OnChanges,
  ChangeDetectionStrategy, ElementRef, ChangeDetectorRef, NgZone, TemplateRef, Input, HostBinding, ViewChild, Component
} from '@angular/core';
import { Subscription, fromEvent } from 'rxjs';
import { toNumber, toBoolean } from '@delon/util';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'fw-g2-pareto',
  template: `
  <ng-container *ngIf="_title; else _titleTpl"><h4 style="margin-bottom:20px">{{_title}}</h4></ng-container>
  <div #container></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  preserveWhitespaces: false,
})
export class ParetoComponent implements OnDestroy, OnChanges {
  private autoHideXLabels = false;
  private resize$: Subscription = null;
  private chart: any;
  private dataSet: any;

  @ViewChild('container') private node: ElementRef;

  constructor(
    private el: ElementRef,
    private cd: ChangeDetectorRef,
    private zone: NgZone,
  ) { }

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
  set autoLabel(value: any) {
    this._autoLabel = toBoolean(value);
  }
  private _autoLabel = true;

  @Input() padding: number[];
  @Input() data: Array<{
    mark: string; value: number;
    [key: string]: any
  }>;

  private runInstall() {
    this.zone.runOutsideAngular(() => setTimeout(() => this.install()));
  }

  private install() {
    if (!this.data) return;

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

    let sumTotal = 0;
    let totalPer = 0;
    this.dataSet = new DataSet();
    const view = this.dataSet.createView().source(this.data)
      .transform({
        type: 'aggregate', // 别名summary
        fields: ['value'],        // 统计字段集
        operations: ['sum'],    // 统计操作集
        as: ['total'],            // 存储字段集
        groupBy: ['mark']
      })
      .transform({
        type: 'map',
        callback(row) { // 加工数据后返回新的一行，默认返回行数据本身
          sumTotal += row.total;
          return row;
        }
      })
      .transform({
        type: 'sort',
        callback(a, b) { // 排序依据，和原生js的排序callback一致
          return b.total - a.total;
        }
      })
      .transform({
        type: 'map',
        callback(row) { // 加工数据后返回新的一行，默认返回行数据本身
          totalPer = (row.total / sumTotal * 100) + totalPer;
          row.percent = totalPer.toFixed(1);
          row.percent = toNumber(row.percent);
          return row;
        }
      });

    const chart = new G2.Chart({
      container: this.node.nativeElement,
      forceFit: true,
      height: this._title || this._titleTpl ? this.height - 41 : this.height,
      padding: this.padding || 'auto',
    });

    // chart.axis('mark', true);
    chart.axis('total', {
      title: true,
      line: true,
      tickLine: true,
    });
    chart.axis('percent', {
      title: true,
      line: true,
      tickLine: true,
      label: {
        // 使用 formatter 回调函数
        formatter: val => {
          return val + '%';
        }
      },
      grid: null
    });

    chart.source(view, {
      // mark: {
      //   type: 'cat',
      // },
      total: {
        min: 0,
        alias: '总计'
      },
      percent: {
        min: 0,
        max: 100,
        alias: '占比'
      }
    });

    chart.tooltip({
      showTitle: false,
    });

    chart
      .interval()
      .position('mark*total')
      .color(this.color)
      .tooltip('mark*total', (mark, total) => {
        return {
          name: mark,
          value: total,
        };
      });
    chart.line().position('mark*percent').color('#90ed7d').size(2).shape('smooth');
    // if (this.limit > 0) {
    //   chart.guide().line({
    //     top: true, // 指定 guide 是否绘制在 canvas 最上层，默认为 false, 即绘制在最下层
    //     start: ['start', this.limit], // 辅助线起始位置
    //     end: ['end', this.limit], // 辅助线结束位置
    //     lineStyle: {
    //       strokeStyle: '#975FE4',
    //       lineWidth: 2,
    //       lineCap: 'round'
    //     }
    //   });
    // }

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

  private installResizeEvent() {
    if (!this._autoLabel || this.resize$) return;

    this.resize$ = fromEvent(window, 'resize')
      .pipe(debounceTime(200))
      .subscribe(() => this.runInstall());
  }
}
