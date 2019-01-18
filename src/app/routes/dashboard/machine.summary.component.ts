import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { _HttpClient, ALAIN_I18N_TOKEN } from '@delon/theme';
import { NzMessageService } from 'ng-zorro-antd';
import { format } from 'date-fns';
import { ActivatedRoute } from '@angular/router';
import { MachineService } from '@core/hydra/service/machine.service';
import { Machine } from '@core/hydra/entity/machine';
import { toNumber } from '@delon/util';
import { Operation } from '@core/hydra/entity/operation';
import { finalize } from 'rxjs/operators';
import { I18NService } from '@core/i18n/i18n.service';
import { ReuseTabService } from '@shared/components/reuse-tab/reuse-tab.service';
import { ChartGaugeComponent } from '@shared/components/chart/gauge.component';

@Component({
  selector: 'fw-machine-summary',
  templateUrl: './machine.summary.component.html',
  styleUrls: ['./machine.summary.component.less']
})
export class MachineSummaryComponent implements OnInit {
  //#region Check List

  //#endregion

  //#region Material Prpare

  //#endregion

  //#region Fields
  @ViewChild(ChartGaugeComponent)
  oeeGauge: ChartGaugeComponent;

  machine: Machine = new Machine();
  machineName = '';
  isLoading = true;

  //#endregion

  //#region Constructor

  constructor(
    public machineService: MachineService,
    public msg: NzMessageService,
    private route: ActivatedRoute,
    private reuseTabService: ReuseTabService,
    @Inject(ALAIN_I18N_TOKEN) private i18n: I18NService,
  ) {
  }

  //#endregion

  //#region Implemented interface

  ngOnInit() {
    this.route.paramMap.subscribe(param => {
      this.machineName = param.get('machineName');
      this.reuseTabService.title = `${this.i18n.fanyi('app.route.line-summary')} - ${this.machineName}`;

      // this.machineService.getMachineWithMock(this.machineName);
      this.machineService.getMachineWithStatistic(this.machineName).pipe(finalize(() => this.isLoading = false)).subscribe((machine) => {
        this.machine = machine;
      });
    });
  }

  _onReuseInit() {
    this.oeeGauge.runInstall();
  }

  //#endregion

  //#region Machine related properties

  //#region Average Yield / Scrap by Hour

  get averageHourYield() {
    if (this.machine.output.size === 0) return 0;

    let totalYield = 0;
    this.machine.output.forEach(item => {
      totalYield += item.yield;
    });

    return (totalYield / this.machine.output.size * 2).toFixed(Machine.FRACTION_DIGIT);
  }

  get averageHourScrap() {
    if (this.machine.output.size === 0) return 0;

    let totalScrap = 0;
    this.machine.output.forEach(item => {
      totalScrap += item.scrap;
    });

    return (totalScrap / this.machine.output.size * 2).toFixed(Machine.FRACTION_DIGIT);
  }

  //#endregion

  //#region Machine based Yield / Scrap trend of 48 hours

  get yieldTrend() {
    const yields = new Array<{
      x: string; y: number
    }>();
    this.machine.output.forEach((value, key) => {
      yields.push({
        x: format(key, 'HH:mm'),
        y: value.yield
      });
    });

    return yields.slice(((yields.length + 1) / 2), yields.length);
  }

  get scrapTrend() {
    const scraps = new Array<{
      x: string; y: number
    }>();
    this.machine.output.forEach((value, key) => {
      scraps.push({
        x: format(key, 'HH:mm'),
        y: value.scrap
      });
    });

    return scraps.slice(((scraps.length + 1) / 2), scraps.length);
  }

  //#endregion

  //#region Machine based Performance trend of 48 hours

  get performanceTrend() {
    const performances = new Array<{
      x: string; y: number
    }>();
    this.machine.output.forEach((value, key) => {
      performances.push({
        x: format(key, 'HH:mm'),
        y: value.performance
      });
    });

    return performances.slice(((performances.length + 1) / 2), performances.length);
  }

  //#endregion

  //#region Compare Scrap to last half hour

  get absoluteScrapComparedToLastHalfHour(): string {
    if (this.scrapComparedToLastHalfHour === 0 ||
      this.scrapComparedToLastHalfHour === Number.MAX_SAFE_INTEGER) return `-`;

    if (this.scrapComparedToLastHalfHour === 0) return `-`;

    return Math.abs(this.scrapComparedToLastHalfHour).toString();
  }

  get scrapComparedToLastHalfHour(): number {
    if (this.scrapTrend.length < 2) return 0;

    if (this.scrapTrend[this.scrapTrend.length - 2].y === 0) return Number.MAX_SAFE_INTEGER;

    const perc = toNumber((this.scrapTrend[this.scrapTrend.length - 1].y
      / this.scrapTrend[this.scrapTrend.length - 2].y * 100).toFixed(Operation.FRACTION_DIGIT));

    return toNumber((perc - 100).toFixed(Operation.FRACTION_DIGIT));
  }

  get scrapFlag() {
    if (this.scrapComparedToLastHalfHour === 0 ||
      this.scrapComparedToLastHalfHour === Number.MAX_SAFE_INTEGER) return '';

    if (this.scrapComparedToLastHalfHour > 0) return 'up';

    return 'down';
  }

  //#endregion

  //#region Compare Performance to last half hour
  get absolutePerformanceComparedToLastHalfHour(): string {
    if (this.performanceComparedToLastHalfHour === 0
      || this.performanceComparedToLastHalfHour === Number.MAX_SAFE_INTEGER) return `-`;

    return Math.abs(this.performanceComparedToLastHalfHour).toString();
  }

  get performanceComparedToLastHalfHour(): number {
    if (this.performanceTrend.length < 2) return 0;

    if (this.performanceTrend[this.performanceTrend.length - 2].y === 0) return Number.MAX_SAFE_INTEGER;

    const perc = toNumber((this.performanceTrend[this.performanceTrend.length - 1].y
      / this.performanceTrend[this.performanceTrend.length - 2].y * 100).toFixed(Operation.FRACTION_DIGIT));

    return toNumber((perc - 100).toFixed(Operation.FRACTION_DIGIT));
  }

  get performanceFlag() {
    if (this.performanceComparedToLastHalfHour === 0 ||
      this.performanceComparedToLastHalfHour === Number.MAX_SAFE_INTEGER) return '';

    if (this.performanceComparedToLastHalfHour > 0) return 'up';

    return 'down';
  }

  //#endregion

  //#endregion

  //#region Public methods
  get isChangeOverCheckListVisible(): boolean {
    if (!this.machine.currentOperation) return false;

    if (this.machine.previousArticle === this.machine.currentOperation.article) {
      return false;
    }

    return true;
  }

  format(date) {
    if (!date) return ``;

    return format(date, 'MM-DD HH:MM');
  }

  getTrendFlag(actual, expected) {
    if (actual < expected) return 'up';

    return 'down';
  }

  getProgressColor(actual, expected) {
    if (actual < expected) {
      return 'red';
    }
    return 'lime';
  }

  getMachineColor(machine: Machine) {
    let color;

    switch (machine.currentStatusNr) {
      case 200:
        color = '#52c41a';
        break;
      case 399:
        color = '#BEB2B0';
        break;
      case 110:
        color = '#BADFEC';
        break;
      default:
        color = '#F63B25';
        break;
    }

    return { 'background-color': color };
  }

  //#endregion
}
