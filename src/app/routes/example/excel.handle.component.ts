import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { XlsxService, STColumn, STColumnBadge, STComponent } from '@delon/abc';
import { OperatorFunction, Observable, of, pipe } from 'rxjs';
import { switchMap, concatMap, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { ImportHandleBase } from '@shared/components/import.handle.base';

const BADGE: STColumnBadge = {
  0: { text: '成功', color: 'success' },
  1: { text: '进行中', color: 'processing' },
};

@Component({
  selector: 'fw-xlsx',
  templateUrl: './excel.handle.component.html',
  styleUrls: [`./excel.handle.component.less`]
})
export class ExcelHandleComponent extends ImportHandleBase {
  importFile = '';

  constructor(xlsx: XlsxService, private http: HttpClient) {
    super(xlsx);
  }

  change(e: Event) {
    const file = (e.target as HTMLInputElement).files[0];
    this.importFile = file.name;
    this.loadFile(file);
  }

  import() {
    this.execute((records) => {
      return this.http.post(`/import`, records);
    });
    // const operations: OperatorFunction<any, any>[] = [];
    // let obs$: Observable<any> = of('start');
    // this.toBeProcess = this.allRecords.length;
    // this.processFailed = this.processSuccess = 0;
    // this.showProgress = true;
    // this.loading = true;
    // this.allRecords.forEach((rec) => {
    //   obs$ = obs$.pipe(map(() => {
    //     rec.badge = 0;
    //     this.processSuccess++;
    //     this.toBeProcess--;
    //   }));
    // });

    // obs$.subscribe(() => {
    //   console.log('end');
    //   // this.showProgress = false;
    //   this.loading = false;
    //   this.records = this.allRecords.filter((rec) => {
    //     return rec.badge === 1;
    //   });
    //   this.comp.reload();
    // });
    // const data = [this.columns.map(i => i.title)];
    // this.users.forEach(i =>
    //   data.push(this.columns.map(c => i[c.index as string])),
    // );
    // this.xlsx.export({
    //   sheets: [
    //     {
    //       data: data,
    //       name: 'sheet name',
    //     },
    //   ],
    // });
  }

  switchShowOnlyToBeProcess() {
    //   if (this.showOnlyToBeProcess) {
    //     this.records = this.allRecords.filter((rec) => {
    //       return rec.badge === 1;
    //     });
    //   } else {
    //     this.records = this.allRecords.slice();
    //   }
  }
}
