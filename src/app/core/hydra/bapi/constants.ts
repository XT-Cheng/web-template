export enum DialogTypeEnum {
  LOGON_USER = 'P_AN',
  LOGOFF_USER = 'P_AB',
  CREATE_BATCH = 'C_GEN',
  MOVE_BATCH = 'C_UMB',
  SPLIT_BATCH = 'CNR.SPLITCREATE',
  GOODS_MOVMENT = 'C_MBEW',
  UPDATE_BATCH = 'CNR.UPDATE',
  SCRAP_BATCH = '',
  BONUS_BATCH = '',
  COPY_BATCH = 'CNR.COPY',
  MERGE_BATCH = 'CNR.SUMMARIZE',
  LOGON_OPERATION = 'A_AN',
  INTERRUPT_OPERATION = 'A_UN',
  PARTIAL_CONFIRM_OPERATION = 'A_TR',
  LOGOFF_OPERATION = 'A_AB',
  LOGON_INPUT_BATCH = 'CE_AN',
  LOGOFF_INPUT_BATCH = 'CE_AB',
  GENERATE_BATCH_NAME = 'CNRGEN.CREATENR',
  GENERATE_BATCH_CONNECTION = 'CNRBAUM.INSERT',
  CHANGE_OUTPUT_BATCH = 'CA_WL',
  CHANGE_INPUT_BATCH = 'CE_WL',
  LOGON_TOOL = 'RES_AN',
  LOGOFF_TOOL = 'RES_AB',
  CHANGE_MACHINE_STATUS = 'M_MST',
  STROKE_POST = 'M_AST',
  DELETE_BATCH = 'CNR.DELETE',
  UPDATE_TERMINAL = 'SCMD;53',

  SET_ORDER_STATUS = 'ANR.SETSTATUS',

  CREATE_NETWORK = 'ANETZ.INSERT',
  //#region MPL Master

  MPL_CREATE_BUFFER = 'MATPUF.INSERT',
  MPL_DELETE_BUFFER = 'MATPUF.DELETE',

  //#endregion

  //#region HR Master

  HR_CREATE_PERSON = 'HR_CREATE_PERSON',
  HR_DELETE_PERSON = 'HR_DELETE_PERSON',

  //#endregion
}

export const DIALOG_USER = 2500;

export interface IBapiResult {
  isSuccess: boolean;
  error: string;
  description: string;
  content: string;
}
