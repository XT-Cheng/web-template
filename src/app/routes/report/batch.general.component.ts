import { Component, OnInit, Inject } from '@angular/core';
import { _HttpClient, ALAIN_I18N_TOKEN } from '@delon/theme';
import { NzMessageService } from 'ng-zorro-antd';
import { I18NService } from '@core/i18n/i18n.service';
import { Batch, Buffer } from '@core/hydra/interface/batch.interface';
import { STColumn } from '@delon/abc';
import { BatchReportService } from '@core/hydra/report/batch.report.service';
import { finalize } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { BPClient } from 'blocking-proxy';

@Component({
  selector: 'app-batch-general',
  templateUrl: './batch.general.component.html',
  styleUrls: ['./batch.general.component.less']
})
export class BatchGeneralComponent implements OnInit {

  //#region Private fields

  //#endregion

  //#region Public fields

  columns: STColumn[] = [
    { title: '批次号', index: 'name' },
    { title: '存储位置', index: 'bufferName' },
    {
      title: '数量',
      index: 'quantity',
      type: 'number',
      sorter: (a: any, b: any) => a.callNo - b.callNo,
    },
    {
      title: '料号',
      index: 'material',
    },
    {
      title: 'SAP批号',
      index: 'SAPBatch',
    },
    {
      title: 'Date Code',
      index: 'dateCode',
    },
  ];

  originalData: Batch[] = [];
  buffers: Buffer[] = [];
  tableData: Batch[] = [];
  chartDataView: any;
  level = 0;
  loading = false;

  currentBufferName = '';
  currentMaterial = '';

  //#endregion

  //#region Constructor

  constructor(private http: _HttpClient,
    public msg: NzMessageService,
    private batchRptService: BatchReportService,
    @Inject(ALAIN_I18N_TOKEN) private i18n: I18NService) { }

  //#endregion

  //#region Public methods

  generateTableData(material: string, bufferName: string) {
    let intervalData: Batch[] = this.originalData;

    if (material) {
      intervalData = this.originalData.filter((value) => {
        return value.material === material;
      });
    }

    if (bufferName) {
      intervalData = intervalData.filter(batch => {
        const buffer = this.buffers.find(b => b.name === batch.bufferName);
        if (buffer.parentBuffers.includes(bufferName)) return true;
        return false;
      });
    }

    return intervalData;
  }

  generateChartData(level: number, bufferName: string) {
    if (level === 0) {
      return new DataSet().createView().source(this.tableData).transform(
        {
          type: 'aggregate', // 别名summary
          fields: ['quantity'],        // 统计字段集
          operations: ['sum'],    // 统计操作集
          as: ['total'],            // 存储字段集
          groupBy: ['material']        // 分组字段集
        }
      )
        .transform({
          type: 'rename',
          map: {
            material: 'x', // row.xxx 会被替换成 row.yyy
            total: 'y'
          }
        });
    } else {
      const chartData = [];
      // Find Direct Children Buffers
      const directChildren = this.buffers.filter(b => {
        if (b.parentBuffer === bufferName) {
          return b;
        }
      });

      if (directChildren.length === 0) return;

      let toAddBuffer: Buffer;
      this.tableData.forEach(batch => {
        // 1. Find Batch Buffer's Parents
        const buffer = this.buffers.find(b => b.name === batch.bufferName);
        directChildren.some(c => {
          if (buffer.parentBuffers.find(p => p === c.name)) {
            toAddBuffer = c;
            return true;
          }

          if (buffer.name === c.name) {
            toAddBuffer = c;
            return true;
          }
        });

        if (toAddBuffer) {
          // 2. Chart Data handle
          if (chartData.find(d => d.x === toAddBuffer.name)) {
            const found = chartData.find(d => d.x === toAddBuffer.name);
            found.y += batch.quantity;
          } else {
            chartData.push({
              x: toAddBuffer.name,
              y: batch.quantity
            });
          }
        }
        toAddBuffer = null;
      });

      return new DataSet().createView().source(chartData);
    }
  }

  //#endregion

  //#region Implemented methods

  ngOnInit(): void {
    forkJoin(this.batchRptService.getMaterialBuffers(), this.batchRptService.getBatches()).pipe(
      finalize(() => this.loading = false)
    ).subscribe(array => {
      [this.buffers, this.originalData] = array;

      this.level = 0;
      this.currentBufferName = this.currentMaterial = '';

      this.tableData = this.generateTableData(this.currentMaterial, this.currentBufferName);
      this.chartDataView = this.generateChartData(this.level, null);
    });
  }

  //#endregion

  //#region Private methods
  gotoUpperLevel() {
    this.level--;
    const buffer = this.buffers.find(b => b.name === this.currentBufferName);

    if (this.level === 0) {
      this.currentMaterial = this.currentBufferName = '';
    } else {
      this.currentBufferName = buffer ? buffer.parentBuffer : '';
    }

    this.tableData = this.generateTableData(this.currentMaterial, this.currentBufferName);
    this.chartDataView = this.generateChartData(this.level, this.currentBufferName);
  }

  barClicked(item) {
    let directChildren: Buffer[];

    if (this.level === 0) {
      this.currentMaterial = item.x;
    } else {
      this.currentBufferName = item.x;
    }

    if (this.level > 0) {
      // Find Direct Children Buffers
      directChildren = this.buffers.filter(b => {
        if (b.parentBuffer === this.currentBufferName) {
          return b;
        }
      });

      if (directChildren.length === 0) return;
    }

    this.level++;
    this.tableData = this.generateTableData(this.currentMaterial, this.currentBufferName);
    this.chartDataView = this.generateChartData(this.level, this.currentBufferName);
  }

  //#endregion
}
