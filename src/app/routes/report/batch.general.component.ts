import { Component, OnInit, Inject } from '@angular/core';
import { _HttpClient, ALAIN_I18N_TOKEN } from '@delon/theme';
import { NzMessageService, toNumber } from 'ng-zorro-antd';
import { I18NService } from '@core/i18n/i18n.service';
import { Batch, Buffer } from '@core/hydra/interface/batch.interface';
import { STColumn } from '@delon/abc';
import { BatchReportService } from '@core/hydra/report/batch.report.service';
import { finalize } from 'rxjs/operators';
import { forkJoin, interval } from 'rxjs';

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
    { title: '存储位置', index: 'bufferDescription' },
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
  chartDataView: any = new DataSet().createView();
  level = 0;
  loading = false;

  currentBufferName = '';
  currentBufferDescription = '';
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
          type: 'map',
          callback(row) { // 加工数据后返回新的一行，默认返回行数据本身
            row.total = toNumber((<number>row.total).toFixed(2), 0);
            return row;
          }
        })
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
          if (chartData.find(d => d.bufferName === toAddBuffer.name)) {
            const found = chartData.find(d => d.bufferName === toAddBuffer.name);
            found.y += batch.quantity;
          } else {
            chartData.push({
              bufferName: toAddBuffer.name,
              x: toAddBuffer.description,
              y: batch.quantity
            });
          }
        }
        toAddBuffer = null;
      });

      chartData.forEach(d => {
        d.y = toNumber((<number>d.y).toFixed(2), 0);
      });
      return new DataSet().createView().source(chartData);
    }
  }

  //#endregion

  //#region Implemented methods

  ngOnInit(): void {
    this.level = 0;
    this.currentBufferDescription = this.currentBufferName = this.currentMaterial = '';

    forkJoin(this.batchRptService.getMaterialBuffers(), this.batchRptService.getBatches()).pipe(
      finalize(() => this.loading = false)
    ).subscribe(array => {
      [this.buffers, this.originalData] = array;

      this.tableData = this.generateTableData(this.currentMaterial, this.currentBufferName);
      this.chartDataView = this.generateChartData(this.level, null);
    });

    interval(10000).subscribe(() => {
      forkJoin(this.batchRptService.getMaterialBuffers(), this.batchRptService.getBatches()).pipe(
        finalize(() => this.loading = false)
      ).subscribe(array => {
        [this.buffers, this.originalData] = array;

        this.tableData = this.generateTableData(this.currentMaterial, this.currentBufferName);
        this.chartDataView = this.generateChartData(this.level, null);
      });
    });
  }

  //#endregion

  //#region Public methods
  gotoUpperLevel() {
    this.level--;
    const buffer = this.buffers.find(b => b.name === this.currentBufferName);

    if (this.level === 0) {
      this.currentMaterial = this.currentBufferName = this.currentBufferDescription = '';
    } else {
      this.currentBufferName = buffer ? buffer.parentBuffer : '';
      this.currentBufferDescription = buffer ? this.getBufferDescription(buffer.parentBuffer) : '';
    }

    this.tableData = this.generateTableData(this.currentMaterial, this.currentBufferName);
    this.chartDataView = this.generateChartData(this.level, this.currentBufferName);
  }

  barClicked(item) {
    let directChildren: Buffer[];

    if (this.level === 0) {
      this.currentMaterial = item.x;
    }

    if (this.level > 0) {
      // Find Direct Children Buffers
      directChildren = this.buffers.filter(b => {
        if (b.parentBuffer === item.bufferName) {
          return b;
        }
      });

      if (directChildren.length === 0) return;

      this.currentBufferName = item.bufferName;
      this.currentBufferDescription = this.getBufferDescription(this.currentBufferName);
    }

    this.level++;
    this.tableData = this.generateTableData(this.currentMaterial, this.currentBufferName);
    this.chartDataView = this.generateChartData(this.level, this.currentBufferName);
  }

  //#endregion

  //#region Private methods
  private getBufferDescription(bufferName: string) {
    const found = this.buffers.find(buffer => buffer.name === bufferName);

    if (found) return found.description;

    return '';
  }
  //#endregion
}
