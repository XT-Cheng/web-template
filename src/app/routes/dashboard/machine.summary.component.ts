import { Component, OnInit, Inject } from '@angular/core';
import { _HttpClient, ALAIN_I18N_TOKEN } from '@delon/theme';
import { NzMessageService } from 'ng-zorro-antd';
import { getTimeDistance } from '@delon/util';
import { STColumn, STColumnTag } from '@delon/abc';
import { I18NService } from '@core/i18n/i18n.service';

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
  constructor(
    private http: _HttpClient,
    public msg: NzMessageService,
    @Inject(ALAIN_I18N_TOKEN) private i18n: I18NService,
  ) { }

  prepareCols: STColumn[] = [
    { title: 'Name', index: 'name' },
    {
      title: 'Desc',
      index: 'desc',
    },
    { title: 'Status', index: 'finished', type: 'tag', tag: TAG },
  ];

  materialCols: STColumn[] = [
    { title: 'Batch', index: 'batch' },
    {
      title: 'Material',
      index: 'material',
    },
    { title: 'Qty', index: 'qty' },
    { title: 'Remain.', render: 'percentages' },
    { title: 'Status', index: 'loaded', type: 'tag', tag: MAT_TAG },
  ];
  salesType = 'all';
  salesPieData: any;
  salesTotal = 0;
  data: any = {
    salesData: [],
    offlineData: [],
    visitData: []
  };
  rankingListData: any[] = Array(7)
    .fill({})
    .map((item, i) => {
      return {
        title: '测试',
        total: 323234,
      };
    });

  date_range: Date[] = [];
  setDate(type: any) {
    this.date_range = getTimeDistance(type);
  }

  changeSaleType() {
    this.salesPieData =
      this.salesType === 'all'
        ? this.data.salesTypeData
        : this.salesType === 'online'
          ? this.data.salesTypeDataOnline
          : this.data.salesTypeDataOffline;
    if (this.salesPieData)
      this.salesTotal = this.salesPieData.reduce((pre, now) => now.y + pre, 0);
  }

  ngOnInit() {
    this.http.get('/chart').subscribe((res: any) => {
      res.offlineData.forEach((item: any) => {
        item.chart = Object.assign([], res.offlineChartData);
      });
      this.data = res;
      this.changeSaleType();
    });
  }

  getMaterialLimit(material: string) {
    return 80;
  }

  getMaterialStatusColor(percentage: number) {
    if (percentage > 80) return 'green';

    return 'red';
  }
}
