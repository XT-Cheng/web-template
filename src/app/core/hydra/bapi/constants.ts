export enum DialogTypeEnum {
  LOGON_USER = 'P_AN',
}

export const DIALOG_USER = 2500;

export interface IBapiResult {
  isSuccess: boolean;
  error: string;
  description: string;
  content: string;
}
