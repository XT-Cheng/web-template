import { Component, OnInit, Inject } from '@angular/core';
import { _HttpClient, ALAIN_I18N_TOKEN } from '@delon/theme';
import { NzMessageService } from 'ng-zorro-antd';
import { STColumn, STColumnTag } from '@delon/abc';
import { I18NService } from '@core/i18n/i18n.service';
import { Machine } from '@core/hydra/interface/machine.interface';
import { format } from 'date-fns';
import { interval } from 'rxjs';
import { MachineReportService } from '@core/hydra/report/machine.report.service';
import { Router, ActivationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';

const TAG: STColumnTag = {
  1: { text: 'Success', color: 'green' },
  2: { text: 'Error', color: 'red' },
  3: { text: 'Ongoing', color: 'blue' },
  4: { text: 'Default', color: '' },
  5: { text: 'Warn', color: 'orange' },
};

const MAT_TAG: STColumnTag = {
  1: { text: 'In Use', color: 'green' },
  2: { text: 'No Mat.', color: 'red' },
  3: { text: 'Need Replenish', color: 'blue' },
};

@Component({
  selector: 'fw-machine-summary',
  templateUrl: './machine.summary.component.html',
  styleUrls: ['./machine.summary.component.less']
})
export class MachineSummaryComponent implements OnInit {
  //#region Check List

  prepareData = [{
    name: 'Fix. Prep.',
    desc: `Fix. Prep.`,
    finished: 1,
  }, {
    name: 'Mat. Prep.',
    desc: `Mat. Prep.`,
    finished: 2,
  }, {
    name: 'WI Prep.',
    desc: `WI Prep.`,
    finished: 5,
  }, {
    name: 'Leader Confirm.',
    desc: `Leader Confirm.`,
    finished: 3,
  }];

  prepareCols: STColumn[] = [
    { title: 'Name', index: 'name' },
    {
      title: 'Desc',
      index: 'desc',
    },
    { title: 'Status', index: 'finished', type: 'tag', tag: TAG },
  ];

  //#endregion

  //#region Material Prpare

  materialCols: STColumn[] = [
    { title: 'Batch', index: 'batchName' },
    {
      title: 'Material',
      index: 'material',
    },
    { title: 'Qty', index: 'batchQty' },
    { title: 'Remain.', render: 'percentages' },
    { title: 'Status', index: 'loaded', type: 'tag', tag: MAT_TAG },
  ];

  //#endregion

  machine: Machine = new Machine();
  machineName = '';

  constructor(
    private _machineRptService: MachineReportService,
    public msg: NzMessageService,
    private router: Router,
    private route: ActivatedRoute,
    @Inject(ALAIN_I18N_TOKEN) private i18n: I18NService,
  ) {
    // this.router.events
    //   .pipe(filter(e => e instanceof ActivationEnd))
    //   .subscribe(() => {
    //     this.machineName = this.router.url.substr(this.router.url.lastIndexOf('?') + 1);
    //     this._machineRptService.getMachine(this.machineName).subscribe((machine: any) => {
    //       this.machine = machine;
    //     });
    //   });
  }

  ngOnInit() {
    this.machineName = this.route.snapshot.paramMap.get('machineName');
    this._machineRptService.getMachine(this.machineName).subscribe((machine: any) => {
      this.machine = machine;
    });

    // interval(10000).subscribe(() => {
    //   if (this.machineName) {
    //     this._machineRptService.getMachine(this.machineName).subscribe((machine: any) => {
    //       this.machine = machine;
    //     });
    //   }
    // });
  }

  getMaterialLimit(material: string) {
    return Machine.COMP_REMAIN_PERCENTAGE;
  }

  getMaterialStatusColor(percentage: number) {
    if (percentage && percentage > Machine.COMP_REMAIN_PERCENTAGE) return 'green';

    return 'red';
  }

  getPerformanceComparedToLastHalfHour(machine: Machine) {
    return Math.abs(machine.performanceComparedToLastHalfHour);
  }

  getPerformanceFlag(machine: Machine) {
    if (machine.performanceComparedToLastHalfHour > 0) return 'up';

    return 'down';
  }

  getScrapComparedToLastHalfHour(machine: Machine) {
    return Math.abs(machine.scrapComparedToLastHalfHour);
  }

  getScrapFlag(machine: Machine) {
    if (machine.scrapComparedToLastHalfHour > 0) return 'up';

    return 'down';
  }

  getProgressColor(actual, expected) {
    if (actual > expected) {
      return 'lime';
    }
    return 'red';
  }

  getTrendFlag(actual, expected) {
    if (actual > expected) return 'down';

    return 'up';
  }

  format(date) {
    if (!date) return ``;

    return format(date, 'MM-DD HH:MM');
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
}
