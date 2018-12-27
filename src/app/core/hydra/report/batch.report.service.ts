import { Injectable } from '@angular/core';
import { FetchService } from '../service/fetch.service';
import { _HttpClient } from '@delon/theme';
import { map } from 'rxjs/operators';
import { Batch, Buffer } from '../interface/batch.interface';
import { Observable } from 'rxjs';

@Injectable()
export class BatchReportService {
  //#region Private members

  //#endregion

  //#region Constructor

  constructor(protected _fetchService: FetchService) { }

  //#endregion

  //#region Public methods

  getBatches(): Observable<Batch[]> {
    const batchSql =
      `SELECT BATCH.LOSNR AS BATCHNAME, BUFFER.BEZ AS DESCRIPTION, (BATCH.BEARB_DATE %2B BATCH.BEARB_TIME / 24 / 3600) AS LASTCHANGED,` +
      ` BATCH.MAT_PUF AS BUFFERNAME, ` +
      ` BUFFER.H_MAT_PUF AS PARENT_BUFFERNAME, BATCH.ARTIKEL AS MATERIAL, BATCH.RESTMENGE AS QUANTITY, SAP_CHARGE AS SAPBATCH, ` +
      ` LOT_NR AS DATECODE FROM LOS_BESTAND BATCH, MAT_PUFFER BUFFER ` +
      ` WHERE BATCH.STATUS IN ('F','L') AND BATCH.RESTMENGE > 0 AND BATCH.MAT_PUF = BUFFER.MAT_PUF AND BUFFER.WERK = '0916'`;

    return this._fetchService.query(batchSql).pipe(
      map((batches) => {
        const ret: Batch[] = [];

        batches.forEach(batch => {
          const data = Object.assign(new Batch(), {
            name: batch.BATCHNAME,
            bufferName: batch.BUFFERNAME,
            bufferDescription: batch.DESCRIPTION,
            parentBuffer: batch.PARENT_BUFFERNAME,
            quantity: batch.QUANTITY,
            material: batch.MATERIAL,
            SAPBatch: batch.SAPBATCH,
            dateCode: batch.DATECODE,
          });

          ret.push(data);
        });

        return ret;
      }));
  }

  getMaterialBuffers(): Observable<Buffer[]> {
    const batchBufferSql =
      `SELECT MAT_PUF AS BUFFER_NAME, BEZ AS BUFFER_DESC, HIERARCHIE_ID AS BUFFER_LEVEL, H_MAT_PUF AS PARENT_BUFFER ` +
      `FROM MAT_PUFFER ` +
      `WHERE WERK = '0916'`;

    return this._fetchService.query(batchBufferSql).pipe(
      map((buffers) => {
        const ret: Buffer[] = [];
        buffers.forEach(buffer => {
          const data = Object.assign(new Buffer(), {
            name: buffer.BUFFER_NAME,
            description: buffer.BUFFER_DESC,
            bufferLevel: buffer.BUFFER_LEVEL,
            parentBuffer: buffer.PARENT_BUFFER ? buffer.PARENT_BUFFER : ``,
          });

          ret.push(data);
        });

        ret.forEach(buffer => {
          buffer.parentBuffers = [];
          if (buffer.parentBuffer) {
            buffer.leadBuffer = this.findLeadBuffer(ret, buffer, buffer).name;
          }
        });

        return ret;
      })
    );
  }
  //#endregion

  //#region Private methods

  private findLeadBuffer(buffers: Buffer[], buffer: Buffer, source: Buffer) {
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
