import { DialogTypeEnum, DIALOG_USER } from '@core/hydra/bapi/constants';
import { Observable, throwError, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map, tap, switchMap } from 'rxjs/operators';
import { IActionResult, leftPad } from '@core/utils/helpers';

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
      `DAT=${leftPad(this._dialogDate.getMonth() + 1, 2)}/${leftPad(this._date.getDate(), 2)}/${this._date.getFullYear()}|` +
      `ZEI=${this.seconds}|` +
      `USR=${DIALOG_USER}|` +
      // tslint:disable-next-line:max-line-length
      `DLGDAT=${leftPad(this._dialogDate.getMonth() + 1, 2)}/${leftPad(this._dialogDate.getDate(), 2)}/${this._dialogDate.getFullYear()}|` +
      `DLGZEI=${this.dialogSeconds}|`;
  }

  public execute(http: HttpClient): Observable<IActionResult> {
    return http.post(`/${this._url}`, { dialog: this.dialogString() }).pipe(
      map((res: any) => {
        return this.getResult(res);
      }),
      switchMap((ret: IActionResult) => {
        if (!ret.isSuccess) {
          return throwError(`BAPI Error: ${ret.description}`);
        }
        return of(ret);
      }));
  }

  //#endregion
}
