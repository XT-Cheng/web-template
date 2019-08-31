import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NzMessageService, toNumber, NzTreeNode, NzTreeNodeOptions } from 'ng-zorro-antd';
import { BatchService } from '@core/hydra/service/batch.service';
import { STColumn } from '@delon/abc';
import { MaterialBatch, BatchBuffer, BatchConnection } from '@core/hydra/entity/batch';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { format } from 'date-fns';
import { BehaviorSubject, forkJoin, of } from 'rxjs';
import { map, switchMap, finalize, catchError } from 'rxjs/operators';
import { BatchWebApi } from '@core/webapi/batch.webapi';

@Component({
  selector: 'app-batch-trace',
  templateUrl: './batch.trace.component.html',
  styleUrls: ['./batch.trace.component.less']
})
export class BatchTraceabilityComponent implements OnInit {
  //#region View Children

  @ViewChild('batch', { read: ElementRef })
  batchElem: ElementRef;

  //#endregion

  //#region Private fields

  private _isChartActive = false;
  private _isTableActive = false;
  private _isConditionActive = true;

  //#endregion

  //#region Public fields
  onlyHighestBatch = true;
  treeNodes$: BehaviorSubject<NzTreeNodeOptions[]> = new BehaviorSubject([]);
  batchDatas$: BehaviorSubject<any[]> = new BehaviorSubject([]);

  searchForm: FormGroup;
  columns: STColumn[] = [
    { title: 'Name', index: 'name', i18n: 'app.report.batch.name' },
    // { title: 'Buffer', index: 'bufferDescription', i18n: 'app.report.batch.buffer' },
    // {
    //   title: 'Qty',
    //   index: 'quantity',
    //   type: 'number',
    //   className: 'text-left',
    //   sort: {
    //     compare: (a, b) => a.quantity - b.quantity,
    //   },
    //   i18n: 'app.report.batch.remainQty'
    // },
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

  loading = false;

  //#endregion

  //#region Constructor

  constructor(public msg: NzMessageService, private fb: FormBuilder,
    private _batchWebApi: BatchWebApi,
    // private _batchService: BatchService
  ) {
    this.searchForm = this.fb.group({
      direction: [true, []],
      batch: [null, []],
      batches: [[], []],
    });
  }

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
    setTimeout(_ => {
      this.batchElem.nativeElement.focus();
    }, 0);
  }

  //#endregion

  //#region Public methods

  submitForm(): void {
    this.batchDatas$.next([]);
    this.treeNodes$.next([]);
    const data$ = this.searchForm.value.direction ?
      this._batchWebApi.getForwardBatchConnection(this.searchForm.value.batch) :
      this._batchWebApi.getBackwardBatchConnection(this.searchForm.value.batch);
    data$.pipe(
      map(connection => {
        if (this.searchForm.value.direction) {
          return [connection, this.buildForwardBatches(connection)];
        } else {
          return [connection, this.buildBackwardBatches(connection)];
        }
      }),
      switchMap((array: any[]) => {
        const [connection, batches] = array;
        return forkJoin(of(connection), of(batches), this._batchWebApi.getBatches(batches.map(batch => batch.batchName)));
      }),
      finalize(() => {
        this.searchForm.controls.batch.setValue(``);
      })
    ).subscribe(array => {
      const [connection, batchesWithHighest, batches] = array;
      if (this.searchForm.value.direction) {
        this.buildFowardTreeNode(connection);
      } else {
        this.buildBackwardTreeNode(connection);
      }
      const batchData: any[] = batches.map(batch => {
        const batchWithHightest = batchesWithHighest.find(b => b.batchName === batch.name);
        if (batchWithHightest) {
          return Object.assign(batch, {
            isHighest: batchWithHightest.isHighest
          });
        } else {
          return Object.assign(batch, {});
        }
      });
      this.searchForm.controls.batches.setValue(batchData);
      this.batchDatas$.next(batchData.filter(b => {
        if (this.onlyHighestBatch) {
          return b.isHighest;
        }
        return true;
      }));
      this._isChartActive = true;
      this._isConditionActive = false;
      this._isTableActive = true;
    }, _ => { });
  }

  resetForm(): void {
    this.searchForm.reset();
  }

  checkChanged() {
    this.onlyHighestBatch = !this.onlyHighestBatch;
    this.batchDatas$.next(this.searchForm.value.batches.filter(b => {
      if (this.onlyHighestBatch) {
        return b.isHighest;
      }
      return true;
    }));
  }
  //#endregion

  //#region Private methods
  private buildForwardBatches(connection: BatchConnection) {
    const batchesFound = [];
    connection.nodes.forEach(node => {
      if (!connection.nodes.find(n => node.inputBatch === n.outputBatch)) {
        if (!batchesFound.find(b => b.batchName === node.inputBatch)) {
          batchesFound.push({
            batchName: node.inputBatch,
            isHighest: true
          });
        }
      } else {
        if (!batchesFound.find(b => b.batchName === node.inputBatch)) {
          batchesFound.push({
            batchName: node.inputBatch,
            isHighest: false
          });
        }
      }
    });
    return batchesFound;
  }

  private buildBackwardBatches(connection: BatchConnection) {
    const batchesFound = [];
    connection.nodes.forEach(node => {
      if (!connection.nodes.find(n => node.outputBatch === n.inputBatch)) {
        if (!batchesFound.find(b => b.batchName === node.outputBatch)) {
          batchesFound.push({
            batchName: node.outputBatch,
            isHighest: true
          });
        }
      } else {
        if (!batchesFound.find(b => b.batchName === node.outputBatch)) {
          batchesFound.push({
            batchName: node.outputBatch,
            isHighest: false
          });
        }
      }
    });
    return batchesFound;
  }

  private buildFowardTreeNode(connection: BatchConnection) {
    const treeNodes: NzTreeNodeOptions[] = [];
    let key = connection.nodes.length;
    // Create All Nodes first
    treeNodes.push({
      title: `${connection.root},${connection.nodes[key - 1].outputBatchMaterial}`,
      key: `0`,
      level: 0,
      children: [],
      node: {
        inputBatch: connection.root
      }
    });
    connection.nodes.forEach(node => {
      treeNodes.push({
        title: `${node.inputBatch}, ${node.inputBatchMaterial}`,
        key: `${key--}`,
        level: node.level,
        children: [],
        node: node
      });
    });

    this.appendForwardTreeNodes(treeNodes[0], treeNodes);
    this.treeNodes$.next([treeNodes[0]]);
  }

  private buildBackwardTreeNode(connection: BatchConnection) {
    const treeNodes: NzTreeNodeOptions[] = [];
    let key = connection.nodes.length;
    // Create All Nodes first
    treeNodes.push({
      title: `${connection.root},${connection.nodes[key - 1].inputBatchMaterial}`,
      key: `0`,
      level: 0,
      children: [],
      node: {
        outputBatch: connection.root
      }
    });
    connection.nodes.forEach(node => {
      treeNodes.push({
        title: `${node.outputBatch}, ${node.outputBatchMaterial}`,
        key: `${key--}`,
        level: node.level,
        children: [],
        node: node
      });
    });

    this.appendBackwardTreeNodes(treeNodes[0], treeNodes);
    this.treeNodes$.next([treeNodes[0]]);
  }

  private appendBackwardTreeNodes(parentNode: NzTreeNodeOptions, allNodes: NzTreeNodeOptions[]) {
    allNodes.map(node => {
      if (node.node.inputBatch === parentNode.node.outputBatch && node.level === parentNode.level + 1) {
        parentNode.children.push(node);
        this.appendBackwardTreeNodes(node, allNodes);
      }
    });
  }

  private appendForwardTreeNodes(parentNode: NzTreeNodeOptions, allNodes: NzTreeNodeOptions[]) {
    allNodes.map(node => {
      if (node.node.outputBatch === parentNode.node.inputBatch && node.level === parentNode.level + 1) {
        parentNode.children.push(node);
        this.appendForwardTreeNodes(node, allNodes);
      }
    });
  }
  //#endregion
}
