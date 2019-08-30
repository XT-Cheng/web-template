import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { _HttpClient, ALAIN_I18N_TOKEN } from '@delon/theme';
import { NzMessageService, NzCarouselComponent } from 'ng-zorro-antd';
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
import { ProcessType } from '@core/hydra/entity/checkList';
import { getComponentStatus } from '@core/hydra/utils/operationHelper';
import { MaterialPreparationComponent } from './widget/materialPreparation.component';
import { MACHINE_STATUS_PRODUCTION } from '@core/hydra/bapi/constants';
import { MaintenanceStatusEnum } from '@core/hydra/entity/tool';

@Component({
  selector: 'fw-machine-summary',
  templateUrl: './machine.summary.component.html',
  styleUrls: ['./machine.summary.component.less']
})
export class MachineSummaryComponent implements OnInit {
  private REFRESH_INTERVAL = 15000;

  //#region Private field

  private toolCycles: Map<string, { pre: number, now: number }> = new Map<string, { pre: number, now: number }>();

  //#endregion

  //#region Material Prpare

  //#endregion

  //#region Fields
  @ViewChild(ChartGaugeComponent)
  oeeGauge: ChartGaugeComponent;

  @ViewChild(NzCarouselComponent)
  warningComp: NzCarouselComponent;

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

      setInterval(() => {
        this.isLoading = true;
        this.machineService.getMachineWithStatistic(this.machineName).pipe(
          finalize(() => this.isLoading = false)).subscribe((machine) => {
            this.machine = machine;

            this.machine.toolsLoggedOn.forEach(logon => {
              const exist = this.toolCycles.get(logon.toolName);
              if (exist) {
                exist.pre = exist.now;
                exist.now = logon.currentCycle;
              } else {
                this.toolCycles.set(logon.toolName, { pre: logon.currentCycle, now: logon.currentCycle });
              }
            });

          });
      }, this.REFRESH_INTERVAL);
      this.machineService.getMachineWithStatistic(this.machineName).pipe(finalize(() => this.isLoading = false)).subscribe((machine) => {
        this.machine = machine;

        this.machine.toolsLoggedOn.forEach(logon => {
          const exist = this.toolCycles.get(logon.toolName);
          if (exist) {
            exist.pre = exist.now;
            exist.now = logon.currentCycle;
          } else {
            this.toolCycles.set(logon.toolName, { pre: logon.currentCycle, now: logon.currentCycle });
          }
        });
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
    // if (this.machine.output.size === 0) return 0;

    // let totalYield = 0;
    // this.machine.output.forEach(item => {
    //   totalYield += item.yield;
    // });

    // return (totalYield / this.machine.output.size * 2).toFixed(Machine.FRACTION_DIGIT);

    if (this.machine.currentShiftOEE.operationTime === 0) return `-`;

    return (this.machine.currentShiftOutput.yield / (this.machine.currentShiftOEE.operationTime / 3600)).toFixed(Machine.FRACTION_DIGIT_1);
  }

  get averageHourScrap() {
    if (this.machine.output.size === 0) return 0;

    let totalScrap = 0;
    this.machine.output.forEach(item => {
      totalScrap += item.scrap;
    });

    return (totalScrap / this.machine.output.size * 2).toFixed(Machine.FRACTION_DIGIT_0);
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
        y: value.output
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
  get currentOPDisplay(): string {
    if (this.machine.currentOperation) {
      return this.machine.currentOperation.leadOrder + ' / ' + this.machine.currentOperation.order;
    }

    return ``;
  }

  get machineStatusSpan(): number {
    if (this.warningMessages.length > 0) return 18;

    return 24;
  }

  get warningMessages(): string[] {
    const messages = [];

    // Material Shortage
    const matShortage = this.checkMaterialShortage(this.machine);
    matShortage.forEach(element => {
      if (element.remainTime <= 0) {
        messages.push(`物料报警, ${element.material}已经耗尽`);
      } else {
        messages.push(`物料报警, ${element.material}仅可使用${element.remainTime.toFixed(1)}分钟`);
      }
    });

    // Change Over
    const changeOverResult = this.ifChangeOverCheckListFinished(this.machine);
    if (changeOverResult.notFinished > 0) {
      messages.push(`换型点检未完成, 已完成${changeOverResult.finished}，未完成${changeOverResult.notFinished}`);
    }

    // Change Shift
    const changeShiftResult = this.ifChangeShiftCheckListFinished(this.machine);
    if (changeShiftResult.notFinished > 0) {
      messages.push(`换班点检未完成, 已完成${changeShiftResult.finished}，未完成${changeShiftResult.notFinished}`);
    }

    // Tool Maintennace
    const toolWarning = this.checkToolMaintennace(this.machine);

    toolWarning.forEach(warning => {
      messages.push(`工夹具${warning.toolName}需要维护`);
    });

    // Tool Cycle
    Array.from(this.toolCycles.entries()).forEach(kvp => {
      if (this.machine.currentStatusNr !== MACHINE_STATUS_PRODUCTION && kvp[1].pre !== kvp[1].now) {
        messages.push(`工夹具${kvp[0]}异常启动`);
      }
    });

    if (messages.length > 0 && this.warningComp) {
      this.warningComp.renderContent();
    }

    return messages;
  }

  get isMaterailRequired(): boolean {
    if (!this.machine.currentOperation) return false;

    if (this.machine.currentOperation.bomItems.size === 0) {
      return false;
    }

    return true;
  }

  get isShiftChangeCheckListVisible(): boolean {
    if (!this.machine.currentOperation) return false;

    if (!this.machine.checkLists.has(ProcessType.CHANGESHIFT)) {
      return false;
    }

    return true;
  }

  get isChangeOverCheckListVisible(): boolean {
    if (!this.machine.currentOperation) return false;

    if (!this.machine.checkLists.has(ProcessType.CHANGEOVER)) {
      return false;
    }

    if (this.machine.lastArticle === this.machine.currentOperation.article) {
      return false;
    }

    return true;
  }

  get isToolListVisible(): boolean {
    if (!this.machine.currentOperation) return false;

    if (this.machine.currentOperation.toolItems.size === 0) {
      return false;
    }

    return true;
  }

  format(date) {
    if (!date) return ``;

    return format(date, 'MM-DD HH:mm');
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

  //#region Private methods
  private checkToolMaintennace(machine: Machine) {
    const result = [];
    if (machine.currentOperation) {
      this.machine.toolsLoggedOn.forEach(logon => {
        if (logon.toolStatus && logon.toolStatus === MaintenanceStatusEnum.RED) {
          result.push({
            toolName: logon.toolName,
          });
        }
      });
    }
    return result;
  }


  private checkMaterialShortage(machine: Machine): any[] {
    const result = [];

    if (machine.currentOperation) {
      const op = machine.currentOperation;
      const componentStatus = getComponentStatus(op, machine);
      componentStatus.forEach((comp) => {
        // 1: 'In Use',
        // 2: 'No Mat.',
        // 3: 'Need Replenish',
        let percentage = 0;
        let loaded = -1;
        if (!comp.isReady) {
          loaded = 2;
        } else {
          const bomItem = op.bomItems.get(comp.pos);
          const remainTime = toNumber((comp.quantity / bomItem.quantity * op.targetCycleTime).toFixed());
          percentage = toNumber(((remainTime / MaterialPreparationComponent.COMP_REMAIN_TIME) * 100).toFixed());
          if (percentage > MaterialPreparationComponent.COMP_REMAIN_PERCENTAGE) {
            loaded = 1;
          } else {
            loaded = 3;
          }

          if (loaded === 3) {
            result.push({
              material: bomItem.material,
              remainTime: remainTime / 60
            });
          }
        }
      });
    }

    return result;
  }

  private ifChangeOverCheckListFinished(machine: Machine): { finished: number, notFinished: number } {
    const result = {
      finished: 0,
      notFinished: 0
    };

    if (!this.isChangeOverCheckListVisible) return result;

    if (machine.checkListResultsOfChangeOver.size === 0) {
      return Object.assign(result, {
        notFinished: machine.checkLists.get(ProcessType.CHANGEOVER).items.length
      });
    }

    let finished = 0;

    Array.from(machine.checkListResultsOfChangeOver.values()).forEach(ret => {
      if (!!ret.finishedAt && ret.answer === ret.criticalAnswer) {
        finished++;
      }
    });

    return Object.assign(result, {
      notFinished: machine.checkLists.get(ProcessType.CHANGEOVER).items.length - finished,
      finished: finished
    });
  }

  private ifChangeShiftCheckListFinished(machine: Machine): { finished: number, notFinished: number } {
    const result = {
      finished: 0,
      notFinished: 0
    };

    if (!this.isShiftChangeCheckListVisible) return result;

    if (machine.checkListResultsOfCurrentShift.size === 0) {
      return Object.assign(result, {
        notFinished: machine.checkLists.get(ProcessType.CHANGESHIFT).items.length
      });
    }

    let finished = 0;

    Array.from(machine.checkListResultsOfCurrentShift.values()).forEach(ret => {
      if (!!ret.finishedAt && ret.answer === ret.criticalAnswer) {
        finished++;
      }
    });

    return Object.assign(result, {
      notFinished: machine.checkLists.get(ProcessType.CHANGESHIFT).items.length - finished,
      finished: finished
    });
  }

  //#endregion
}
