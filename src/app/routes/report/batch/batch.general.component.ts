import { Component, OnInit } from '@angular/core';
import { NzMessageService, toNumber } from 'ng-zorro-antd';
import { BatchService } from '@core/hydra/service/batch.service';
import { STColumn } from '@delon/abc';
import { MaterialBatch, BatchBuffer } from '@core/hydra/entity/Batch';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { format } from 'date-fns';

@Component({
  selector: 'app-batch-general',
  templateUrl: './batch.general.component.html',
  styleUrls: ['./batch.general.component.less']
})
export class BatchGeneralComponent implements OnInit {

  //#region Private fields

  private originalData: MaterialBatch[] = [];
  private currentBufferName = '';

  private _isChartActive = false;
  private _isTableActive = false;
  private _isConditionActive = true;

  //#endregion

  //#region Public fields
  searchForm: FormGroup;
  columns: STColumn[] = [
    { title: 'Name', index: 'name', i18n: 'app.report.batch.name' },
    { title: 'Buffer', index: 'bufferDescription', i18n: 'app.report.batch.buffer' },
    {
      title: 'Qty',
      index: 'quantity',
      type: 'number',
      className: 'text-left',
      sort: {
        compare: (a, b) => a.quantity - b.quantity,
      },
      i18n: 'app.report.batch.remainQty'
    },
    {
      title: 'Material',
      index: 'material',
      i18n: 'app.report.batch.material'
    },
    {
      title: 'SAP Batch',
      index: 'SAPBatch',
      i18n: 'app.report.batch.SAPBatch'
    },
    {
      title: 'Date Code',
      index: 'dateCode',
      i18n: 'app.report.batch.dateCode'
    },
    {
      title: 'Last Changed',
      index: 'lastChanged',
      i18n: 'app.report.batch.lastChanged',
      format: (value) => {
        if (value.lastChanged) {
          return format(value.lastChanged, 'YYYY-MM-DD HH:mm:ss');
        }
        return ``;
      },
      sort: {
        compare: (a, b) => a.lastChanged - b.lastChanged,
      },
    },
  ];

  tableData: MaterialBatch[] = [];
  chartDataView: any = new DataSet().createView();
  currentBufferDescription = '';
  currentMaterial = '';
  level = 0;

  matList = [];
  buffers: BatchBuffer[] = [];

  loading = false;

  //#endregion

  //#region Constructor

  constructor(public msg: NzMessageService, private fb: FormBuilder,
    private batchService: BatchService) { }

  //#endregion

  //#region Private properties
  get isConditionActive(): boolean {
    return this._isConditionActive;
  }

  get isChartActive(): boolean {
    return this._isChartActive;
  }

  get isTableActive(): boolean {
    return this._isTableActive;
  }

  //#endregion

  //#region Implemented methods

  ngOnInit(): void {
    this.level = 0;
    this.currentBufferDescription = this.currentBufferName = this.currentMaterial = '';

    this.searchForm = this.fb.group({
      material: new FormControl(),
      buffer: new FormControl(),
      lastChanged: new FormControl()
    });

    this.batchService.getAllMaterialNames().subscribe(materialNames => {
      this.matList = materialNames;
    });

    this.batchService.getMaterialBuffers().subscribe(buffers => {
      this.buffers = buffers;
    });
  }

  //#endregion

  //#region Public methods

  submitForm(): void {
    this.batchService.getBatches(this.searchForm.value.material, this.searchForm.value.buffer, this.searchForm.value.lastChanged)
      .subscribe(batches => {
        this.originalData = batches;
        this.level = 0;
        this.currentMaterial = this.currentBufferName = this.currentBufferDescription = ``;
        this.tableData = this.generateTableData(this.currentMaterial, this.currentBufferName);
        this.chartDataView = this.generateChartData(this.level, null);
        this._isChartActive = true;
        this._isConditionActive = false;
        this._isTableActive = false;
      });
  }

  resetForm(): void {
    this.searchForm.reset();
  }

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
    let directChildren: BatchBuffer[];

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

  private generateTableData(material: string, bufferName: string) {
    let intervalData: MaterialBatch[] = this.originalData;

    if (material) {
      intervalData = this.originalData.filter((value) => {
        return value.material === material;
      });
    }

    if (bufferName) {
      intervalData = intervalData.filter(batch => {
        const buffer = this.buffers.find(b => b.name === batch.bufferName);
        // if (buffer.parentBuffers.includes(bufferName)) return true;
        return false;
      });
    }

    return intervalData.slice();
  }

  private generateChartData(level: number, bufferName: string) {
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

      let toAddBuffer: BatchBuffer;
      this.tableData.forEach(batch => {
        // 1. Find Batch Buffer's Parents
        const buffer = this.buffers.find(b => b.name === batch.bufferName);
        directChildren.some(c => {
          // if (buffer.parentBuffers.find(p => p === c.name)) {
          //   toAddBuffer = c;
          //   return true;
          // }

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
}
