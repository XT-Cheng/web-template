import { Component, OnInit } from '@angular/core';
import { _HttpClient } from '@delon/theme';
import { NzMessageService } from 'ng-zorro-antd';
import { format } from 'date-fns';
import { ActivatedRoute } from '@angular/router';
import { MachineService } from '@core/hydra/service/machine.service';
import { Machine } from '@core/hydra/entity/machine';
import { toNumber } from '@delon/util';
import { Operation } from '@core/hydra/entity/operation';

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

  machine: Machine = new Machine();
  machineName = '';

  //#endregion

  //#region Constructor

  constructor(
    public machineService: MachineService,
    public msg: NzMessageService,
    private route: ActivatedRoute,
  ) {
  }

  //#endregion

  //#region Implemented interface

  ngOnInit() {
    this.route.paramMap.subscribe(param => {
      this.machineName = param.get('machineName');
      // this.machineService.getMachineWithMock(this.machineName);
      this.machineService.getMachine(this.machineName);
    });
    this.machineService.machine$.subscribe((machine) => {
      this.machine = machine;
    });
  }

  //#endregion

  //#region Machine related properties

  //#region Average Yield / Scrap by Hour

  get averageHourYield(): number {
    if (this.machine.output.size === 0) return 0;

    let totalYield = 0;
    this.machine.output.forEach(item => {
      totalYield += item.yield;
    });

    return toNumber((totalYield / this.machine.output.size * 2).toFixed(Machine.FRACTION_DIGIT));
  }

  get averageHourScrap(): number {
    if (this.machine.output.size === 0) return 0;

    let totalScrap = 0;
    this.machine.output.forEach(item => {
      totalScrap += item.scrap;
    });

    return toNumber((totalScrap / this.machine.output.size * 2).toFixed(Machine.FRACTION_DIGIT));
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
        y: value.scrap
      });
    });

    return performances.slice(((performances.length + 1) / 2), performances.length);
  }

  //#endregion

  //#region Compare Scrap to last half hour

  get absoluteScrapComparedToLastHalfHour(): number {
    return Math.abs(this.scrapComparedToLastHalfHour);
  }

  get scrapComparedToLastHalfHour(): number {
    if (this.scrapTrend.length < 2) return 0;

    const perc = toNumber((this.scrapTrend[this.scrapTrend.length - 1].y
      / this.scrapTrend[this.scrapTrend.length - 2].y * 100).toFixed(Operation.FRACTION_DIGIT));

    return toNumber((perc - 100).toFixed(Operation.FRACTION_DIGIT));
  }

  //#endregion

  //#region Compare Performance to last half hour
  get absolutePerformanceComparedToLastHalfHour(): number {
    return Math.abs(this.performanceComparedToLastHalfHour);
  }

  get performanceComparedToLastHalfHour(): number {
    if (this.performanceTrend.length < 2) return 0;

    const perc = toNumber((this.performanceTrend[this.performanceTrend.length - 1].y
      / this.performanceTrend[this.performanceTrend.length - 2].y * 100).toFixed(Operation.FRACTION_DIGIT));

    return toNumber((perc - 100).toFixed(Operation.FRACTION_DIGIT));
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

  get performanceFlag() {
    if (this.performanceComparedToLastHalfHour === 0) return '';

    if (this.performanceComparedToLastHalfHour > 0) return 'up';

    return 'down';
  }

  get scrapFlag() {
    if (this.scrapComparedToLastHalfHour === 0) return '';

    if (this.scrapComparedToLastHalfHour > 0) return 'up';

    return 'down';
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
