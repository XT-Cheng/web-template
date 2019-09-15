import { Component, OnInit, Input } from '@angular/core';
import { STColumn, STColumnTag } from '@delon/abc';
import { Machine } from '@core/hydra/entity/machine';
import { ProcessType } from '@core/hydra/entity/checkList';
import { format } from 'date-fns';

const CHECK_TAG: STColumnTag = {
  1: { text: 'Finished', color: 'green' },
  2: { text: 'Not Start', color: 'red' },
  3: { text: 'Not Finish', color: 'blue' },
};

@Component({
  selector: 'fw-widget-check-shift',
  templateUrl: './checkListOfShiftChange.component.html',
  styleUrls: ['./checkListOfShiftChange.component.less']
})
export class CheckListOfShiftChangeComponent implements OnInit {

  //#region static Fields

  //#endregion

  //#region Fields

  checkListCols: STColumn[] = [
    { title: 'Seq', index: 'sequence', i18n: 'app.checklist.sequence' },
    {
      title: 'Description',
      index: 'shortText', i18n: 'app.checklist.description'
    },
    { title: 'Answer', index: 'answer', i18n: 'app.checklist.answer' },
    { title: 'Finished By', index: 'finishedBy', i18n: 'app.checklist.finishedBy' },
    {
      title: 'Finished At.', index: 'finishedAt', i18n: 'app.checklist.finishedAt', format: (value) => {
        if (value.finishedAt) {
          return format(value.finishedAt, 'YYYY-MM-DD HH:mm:ss');
        }
        return ``;
      }
    },
    { title: 'Comment', index: 'comment', i18n: 'app.checklist.comment' },
    { title: 'Status', index: 'completed', i18n: 'app.checklist.completed', type: 'tag', tag: CHECK_TAG },
  ];
  private _machine: Machine = new Machine();

  @Input()
  set machine(value: Machine) {
    this._machine = value;
    this.data = this.checkListResults;
  }
  data: any[];

  //#endregion

  //#region Constructor

  constructor(
    // public machineService: MachineService
  ) {

  }

  //#endregion

  //#region Implemented interface

  ngOnInit() {
  }

  //#endregion

  //#region Check List Results

  get checkListResults(): any[] {
    const ret: any[] = [];

    const shiftChange = this._machine.checkLists.get(ProcessType.CHANGESHIFT);

    if (shiftChange) {
      shiftChange.items.forEach(item => {
        if (this._machine.checkListResultsOfCurrentShift.get(item.sequence)) {
          const result = this._machine.checkListResultsOfCurrentShift.get(item.sequence);
          if (result.criticalAnswer === result.answer) {
            ret.push({
              sequence: result.sequence,
              shortText: item.shortText,
              answer: result.answer,
              finishedBy: result.finishedBy,
              finishedAt: result.finishedAt,
              comment: result.comment,
              completed: 1
            });
          } else {
            ret.push({
              sequence: result.sequence,
              shortText: item.shortText,
              answer: result.answer,
              finishedBy: result.finishedBy,
              finishedAt: result.finishedAt,
              comment: result.comment,
              completed: 3
            });
          }
        } else {
          ret.push({
            sequence: item.sequence,
            shortText: item.shortText,
            finishedBy: ``,
            finishedAt: null,
            comment: ``,
            completed: 2
          });
        }
      });
    }

    return ret.sort((a, b) => a.sequence - b.sequence);
  }

  //#endregion
}
