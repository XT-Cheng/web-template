import { Injectable } from '@angular/core';
import { FetchService } from '../fetch.service';
import { _HttpClient } from '@delon/theme';
import { map } from 'rxjs/operators';
import { Batch, Buffer } from '../interface/batch.interface';
import { Observable } from 'rxjs';

@Injectable()
export class BatchReportService {
  //#region Private members

  //#endregion

  //#region Constructor

  constructor(protected _http: _HttpClient) { }

  //#endregion

  //#region Public methods

  getBatches(): Observable<Batch[]> {
    // const batchSql =
    //   `SELECT BATCH.LOSNR, (BATCH.BEARB_DATE + BATCH.BEARB_TIME) AS LASTCHANGED, BUFFER.H_MAT_PUF AS PARENTBUFFER ` +
    //   `FROM LOS_BESTAND BATCH, MAT_PUFFER BUFFER ` +
    //   `WHERE BATCH.STATUS IN ('F','L') AND BATCH.MAT_PUF = BUFFER.MAT_PUF`;
    return this._http.get('/batches').pipe(
      map((res: any) => {
        return res as Batch[];
      }));
  }

  getMaterialBuffers(): Observable<Buffer[]> {
    return this._http.get('/buffers').pipe(
      map((res: any) => {
        const buffers = res as Buffer[];

        buffers.forEach(buffer => {
          buffer.parentBuffers = [];
          if (buffer.parentBuffer) {
            buffer.leadBuffer = this.findLeadBuffer(buffers, buffer, buffer).name;
          }
        });

        return buffers;
      }));
  }
  //#endregion

  //#region Private methods

  findLeadBuffer(buffers: Buffer[], buffer: Buffer, source: Buffer) {
    const found = buffers.find(target => {
      return target.name === buffer.parentBuffer;
    });

    if (found) {
      source.parentBuffers.unshift(found.name);
      return this.findLeadBuffer(buffers, found, source);
    }

    return buffer;
  }

  //#endregion
}
