import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { IActionResult, replaceAll } from '@core/utils/helpers';
import { environment } from '@env/environment';
import { switchMap } from 'rxjs/operators';
import { MaterialBatch } from '../entity/batch';
import { BatchService } from './batch.service';
import { FetchService } from './fetch.service';

@Injectable()
export class PrintService {
  //#region Private members
  static SAPBatchTBR = '$SAPBatchTBR';
  static dateCodeTBR = '$dateCodeTBR';
  static ltNumbersTBR = '$ltNumbersTBR';

  static updateBartenderLabelTable = `UPDATE U_TE_MMLP_BARTENDER_LABEL
   SET BATCH_NUMBER = '${PrintService.SAPBatchTBR}', PRINT_DATE_CODE = '${PrintService.dateCodeTBR}'
   WHERE LICENSE_TAG_NUMBER IN (${PrintService.ltNumbersTBR})`;

  private materialBatchPrintMachine = 'LPZMAT';

  private materialBatchLabelFile = 'Incoming';
  private outputBatchLabelFile = 'Outgoing';

  //#endregion

  //#region Constructor

  constructor(protected _http: HttpClient, protected _batchService: BatchService, protected _fetchService: FetchService) { }

  //#endregion

  //#region Public methods
  printMaterialBatchLabel(batchNames: string[], machineName?: string): Observable<IActionResult> {
    if (batchNames.length === 0) {
      return of({
        isSuccess: true,
        error: ``,
        content: ``,
        description: `Empty batchNames`,
      });
    }

    return this._batchService.getBatchInformation(batchNames[0]).pipe(
      switchMap(batch => {
        return this.printBatchLabel(batchNames, batch.SAPBatch, batch.dateCode,
          machineName ? machineName : this.materialBatchPrintMachine, this.materialBatchLabelFile);
      })
    );
  }

  printOutputBatchLabel(batchNames: string[], machineName: string): Observable<IActionResult> {
    if (batchNames.length === 0) {
      return of({
        isSuccess: true,
        error: ``,
        content: ``,
        description: `Empty batchNames`,
      });
    }

    return this._batchService.getBatchInformation(batchNames[0]).pipe(
      switchMap(batch => {
        return this.printBatchLabel(batchNames, batch.SAPBatch, batch.dateCode,
          machineName, this.outputBatchLabelFile);
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
    return this._http.get(environment.PRINTER_SERVICE_URL, {
      params: {
        data: `{"LicenseTag":"${flat}","MachineName":"${machineName}","TagTypeName":"${tagTypeName}",` +
          `"BatchNo" : "${SAPBatch}", "DateCode" : "${dateCode}"}`
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
