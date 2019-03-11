export enum ProcessType {
  CHANGEOVER = 'CHANGEOVER',
  CHANGESHIFT = 'CHANGESHIFT'
}

export class CheckList {
  //#region Fields

  processType: ProcessType;
  headerId = -1;
  checkListType: '';
  items: CheckListItem[] = [];

  //#endregion
}

export class CheckListItem {
  //#region Fields

  sequence = -1;
  shortText = '';

  //#endregion
}

export class CheckListResult {
  //#region Fields

  sequence = -1;
  answer = '';
  criticalAnswer = '';
  checkListType: '';
  headerId = -1;
  operationName = '';
  finishedAt = new Date();
  finishedBy = '';
  comment = '';
  //#endregion
}
