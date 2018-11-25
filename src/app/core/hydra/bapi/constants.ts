export enum DialogTypeEnum {
  LOGON_USER = 'P_AN',

  //#region MPL Master

  MPL_CREATE_BUFFER = 'MATPUF.INSERT',
  MPL_DELETE_BUFFER = 'MATPUF.DELETE',

  //#endregion
}

export const DIALOG_USER = 2500;

export interface IBapiResult {
  isSuccess: boolean;
  error: string;
  description: string;
  content: string;
}
