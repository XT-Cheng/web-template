import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { IActionResult, replaceAll } from '@core/utils/helpers';
import { environment } from '@env/environment';
import { switchMap } from 'rxjs/operators';
import { BatchService } from './batch.service';
import { FetchService } from './fetch.service';
import { SettingsService } from '@delon/theme';

@Injectable()
export class PrintService {
  //#region Private members
  static SAPBatchTBR = '$SAPBatchTBR';
  static dateCodeTBR = '$dateCodeTBR';
  static ltNumbersTBR = '$ltNumbersTBR';

  static updateBartenderLabelTable = `UPDATE U_TE_MMLP_BARTENDER_LABEL
   SET BATCH_NUMBER = '${PrintService.SAPBatchTBR}', PRINT_DATE_CODE = '${PrintService.dateCodeTBR}'
   WHERE LICENSE_TAG_NUMBER IN (${PrintService.ltNumbersTBR})`;

  static availablePrinterSQL = `SELECT PRINTER_NAME FROM U_TE_MMLP_PARAM_PRINTER WHERE DELETE_FLAG = 'N' AND
   PRINTER_ENABLED = 'Y'`;

  private materialBatchPrintMachine = 'LPZMAT';

  private materialBatchLabelFile = 'Incoming';
  private outputBatchLabelFile = 'Outgoing';

  //#endregion

  //#region Constructor

  constructor(protected _http: HttpClient, protected _settingService: SettingsService,
    protected _batchService: BatchService, protected _fetchService: FetchService) { }

  //#endregion

  //#region Public methods
  printoutBatchLabel(batchNames: string[], machineName?: string): Observable<IActionResult> {
    if (batchNames.length === 0) {
      return of({
        isSuccess: true,
        error: ``,
        content: ``,
        description: `Empty batchNames`,
      });
    }

    return this._batchService.getBatchInformationWithRunning(batchNames[0]).pipe(
      switchMap(batch => {
        return this.printBatchLabel(batchNames, batch.SAPBatch, batch.dateCode,
          machineName ? machineName : this.materialBatchPrintMachine, this.materialBatchLabelFile);
      })
    );
  }

  getAvailablePrinterNames(): Observable<string[]> {
    return this._fetchService.query(PrintService.availablePrinterSQL).pipe(
      switchMap(recs => {
        return of(recs.map(rec => rec.PRINTER_NAME));
      })
    );
  }

  //#endregion

  //#region Private methods
  private updateBardtenderLabelTable(batchNames: string[], SAPBatch: string, dateCode: string): Observable<IActionResult> {
    const joined = [];
    batchNames.map((name) => joined.push(`'` + name + `'`));

    return this._fetchService.query(replaceAll(PrintService.updateBartenderLabelTable
      , [PrintService.SAPBatchTBR, PrintService.dateCodeTBR, PrintService.ltNumbersTBR]
      , [SAPBatch, dateCode, joined.join(',')])).pipe(
        switchMap(_ => {
          return of({
            isSuccess: true,
            error: ``,
            content: ``,
            description: `Bartender Table altered!`,
          });
        }));
  }

  private printBatchLabel(batchNames: string[], SAPBatch: string, dateCode: string,
    machineName: string, tagTypeName: string): Observable<IActionResult> {
    const flat = batchNames.join(`;`);

    let data = ``;

    // TODO: Should allow provide Printer Name directly
    if (this._settingService.app.printer) {
      data = `{"LicenseTag":"${flat}","MachineName":"${machineName}",
         "PrinterName":"${this._settingService.app.printer}","TagTypeName":"${tagTypeName}",
         "BatchNo" : "${SAPBatch}", "DateCode" : "${dateCode}"}`;
    } else {
      data = `{"LicenseTag":"${flat}","MachineName":"${machineName}","TagTypeName":"${tagTypeName}",
       "BatchNo" : "${SAPBatch}", "DateCode" : "${dateCode}"}`;
    }

    return this._http.get(environment.PRINTER_SERVICE_URL, {
      params: {
        data: data
      }
    }).pipe(
      switchMap(_ => {
        return of({
          isSuccess: true,
          error: ``,
          content: ``,
          description: `Batch ${flat} Label Printed!`,
        });
      })
    );
  }
  //#endregion
}
