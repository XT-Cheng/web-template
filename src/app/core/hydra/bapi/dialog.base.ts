import { DialogTypeEnum, DIALOG_USER, IBapiResult } from '@core/hydra/bapi/constants';
import { Observable, throwError, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map, tap, switchMap } from 'rxjs/operators';

export abstract class DialogBase {
  //#region Private members

  private _url = 'bapi';
  private _dialogDate: Date;
  private _date: Date;

  //#endregion

  //#region Constructor

  constructor(protected _type: DialogTypeEnum) {
    this._dialogDate = this._date = new Date();
  }

  //#endregion

  //#region Private properties

  private get seconds(): number {
    return this._date.getHours() * 3600 + this._date.getMinutes() * 60 + this._date.getSeconds();
  }

  private get dialogSeconds(): number {
    return this._dialogDate.getHours() * 3600 + this._dialogDate.getMinutes() * 60 + this._dialogDate.getSeconds();
  }

  //#endregion

  //#region Private methods

  private leftPad(str: any, len: number, ch: any = '0') {
    str = String(str);

    let i = -1;

    if (!ch && ch !== 0) {
      ch = ' ';
    }

    len = len - str.length;

    while (++i < len) {
      str = ch + str;
    }

    return str;
  }

  private getResult(res: any) {
    return {
      isSuccess: res.isSuccess,
      error: res.error,
      description: res.description,
      content: res.content
    };
  }


  //#endregion

  //#region Public methods
  public dialogString(): string {
    return `DLG=${this._type}|` +
      `DAT=${this.leftPad(this._dialogDate.getMonth() + 1, 2)}/${this.leftPad(this._date.getDate(), 2)}/${this._date.getFullYear()}|` +
      `ZEI=${this.seconds}|` +
      `USR=${DIALOG_USER}|` +
      // tslint:disable-next-line:max-line-length
      `DLGDAT=${this.leftPad(this._dialogDate.getMonth() + 1, 2)}/${this.leftPad(this._dialogDate.getDate(), 2)}/${this._dialogDate.getFullYear()}|` +
      `DLGZEI=${this.dialogSeconds}|`;
  }

  public execute(http: HttpClient): Observable<IBapiResult> {
    return http.post(`/${this._url}`, { dialog: this.dialogString() }).pipe(
      map((res: any) => {
        return this.getResult(res);
      }),
      switchMap((ret: IBapiResult) => {
        if (!ret.isSuccess) {
          return throwError(`BAPI Error: ${ret.description}`);
        }
        return of(ret);
      }));
  }

  //#endregion
}
