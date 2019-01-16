import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { FetchService } from './fetch.service';
import { map } from 'rxjs/operators';
import { leftPad, IActionResult } from '@core/utils/helpers';

@Injectable()
export class PrintService {
  //#region Private members

  //#endregion

  //#region Constructor

  constructor(protected http: HttpClient, protected _fetchService: FetchService) { }

  //#endregion

  //#region Public methods
  printMaterialBatchLabel(batchName: string, machineName: string, terminalNo: number): Observable<IActionResult> {
    console.log(`Lable ${batchName} Printed Out by ${terminalNo} from ${machineName}!`);
    return of({
      isSuccess: true,
      error: ``,
      content: ``,
      description: `Batch ${batchName} Label Printed!`,
    });
  }

  //#endregion
}
