import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { FetchService } from './fetch.service';
import { IActionResult } from '@core/utils/helpers';
import { environment } from '@env/environment';
import { switchMap } from 'rxjs/operators';

@Injectable()
export class PrintService {
  //#region Private members

  private materialBatchPrintMachine = 'LPZMAT';

  private materialBatchLabelFile = 'Incoming';
  private outputBatchLabelFile = 'Outgoing';

  //#endregion

  //#region Constructor

  constructor(protected _http: HttpClient, protected _fetchService: FetchService) { }

  //#endregion

  //#region Public methods
  printMaterialBatchLabel(batchName: string, machineName?: string): Observable<IActionResult> {
    return this.printBatchLabel(batchName, machineName ? machineName : this.materialBatchPrintMachine, this.materialBatchLabelFile);
  }

  printOutputBatchLabel(batchName: string, machineName: string): Observable<IActionResult> {
    return this.printBatchLabel(batchName, machineName, this.outputBatchLabelFile);
  }

  //#endregion

  //#region Private methods
  private printBatchLabel(batchName: string, machineName: string, tagTypeName: string): Observable<IActionResult> {
    return this._http.get(environment.PRINTER_SERVICE_URL, {
      params: {
        data: `{"LicenseTag":"${batchName}","MachineName":"${machineName}","TagTypeName":"${tagTypeName}"}`
      }
    }).pipe(
      switchMap(ret => {
        console.log(`Lable ${batchName} Printed Out from ${machineName}!`);
        return of({
          isSuccess: true,
          error: ``,
          content: ``,
          description: `Batch ${batchName} Label Printed!`,
        });
      })
    );
  }
  //#endregion
}
