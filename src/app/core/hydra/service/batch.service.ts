import { Injectable } from '@angular/core';
import { FetchService } from './fetch.service';
import { map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { Batch, Buffer } from '@core/hydra/entity/batch';
import { format } from 'date-fns';

@Injectable()
export class BatchService {

  static materialNameTBR = '$materialName';
  static lastChangedTBR = '$lastChanged';
  static buffersTBR = '$buffers';

  static dateFormatOracle = 'YYYY-MM-DD HH24:MI:ss';
  static dateFormat = 'YYYY-MM-DD HH:mm:ss';

  //#region SQL
  static allMaterialNameSql =
    `SELECT DISTINCT(ARTIKEL) AS ARTIKEL FROM LOS_BESTAND WHERE ARTIKEL LIKE '${BatchService.materialNameTBR}%' `;

  static batchSql =
    `SELECT BATCH.LOSNR AS BATCHNAME, BUFFER.BEZ AS DESCRIPTION, ` +
    ` (BATCH.STAT_UPD_DAT + BATCH.STAT_UPD_ZEIT / 24 / 3600) AS LASTCHANGED, ` +
    ` BATCH.MAT_PUF AS BUFFERNAME, ` +
    ` BUFFER.H_MAT_PUF AS PARENT_BUFFERNAME, BATCH.ARTIKEL AS MATERIAL, BATCH.RESTMENGE AS QUANTITY, SAP_CHARGE AS SAPBATCH, ` +
    ` LOT_NR AS DATECODE FROM LOS_BESTAND BATCH, MAT_PUFFER BUFFER ` +
    ` WHERE BATCH.STATUS IN ('F','L') AND BATCH.RESTMENGE > 0 AND BATCH.MAT_PUF = BUFFER.MAT_PUF AND BUFFER.WERK = '0916' ` +
    ` ${BatchService.materialNameTBR} ` +
    ` ${BatchService.lastChangedTBR} ` +
    ` ${BatchService.buffersTBR}`;

  static batchBufferSql =
    `SELECT MAT_PUF AS BUFFER_NAME, BEZ AS BUFFER_DESC, HIERARCHIE_ID AS BUFFER_LEVEL, H_MAT_PUF AS PARENT_BUFFER ` +
    `FROM MAT_PUFFER WHERE WERK = '0916'`;

  //#endregion
  //#region Private members

  private buffers: Buffer[];

  //#endregion

  //#region Constructor

  constructor(protected _fetchService: FetchService) { }

  //#endregion

  //#region Public methods
  getAllMaterialNames(value: string = ``): Observable<string[]> {
    return this._fetchService.query(BatchService.allMaterialNameSql.replace(BatchService.materialNameTBR, value)).pipe(
      map(mats => {
        const materialNames = [];
        mats.forEach(rec => {
          materialNames.push(rec.ARTIKEL);
        });
        return materialNames;
      })
    );
  }

  getBatches(materialName: string = '', buffer: Buffer = null, lastChanged: Date = null): Observable<Batch[]> {
    let sql = BatchService.batchSql;
    if (materialName) {
      sql = sql.replace(BatchService.materialNameTBR, `AND BATCH.ARTIKEL = '${materialName}'`);
    } else {
      sql = sql.replace(BatchService.materialNameTBR, ``);
    }

    if (buffer) {
      const buffers = this.getLowerLevelBuffers(buffer);
      buffers.push(buffer.name);
      sql = sql.replace(BatchService.buffersTBR, `AND BATCH.MAT_PUF IN (${buffers.map(b => `'${b}'`).join(',')})`);
    } else {
      sql = sql.replace(BatchService.buffersTBR, ``);
    }

    if (lastChanged) {
      sql = sql.replace(BatchService.lastChangedTBR,
        `AND (BATCH.STAT_UPD_DAT + BATCH.STAT_UPD_ZEIT / 24 / 3600) < ` +
        ` TO_DATE('${format(lastChanged, BatchService.dateFormat)}', '${BatchService.dateFormatOracle}') `);
    } else {
      sql = sql.replace(BatchService.lastChangedTBR, ``);
    }

    return this._fetchService.query(sql).pipe(
      map((batches) => {
        const ret: Batch[] = [];

        batches.forEach(batch => {
          const data = Object.assign(new Batch(), {
            name: batch.BATCHNAME,
            bufferName: batch.BUFFERNAME,
            lastChanged: new Date(batch.LASTCHANGED),
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
    if (this.buffers) return of(this.buffers);

    return this._fetchService.query(BatchService.batchBufferSql).pipe(
      map((records) => {
        this.buffers = [];
        records.forEach(rec => {
          const data = Object.assign(new Buffer(), {
            name: rec.BUFFER_NAME,
            description: rec.BUFFER_DESC,
            bufferLevel: rec.BUFFER_LEVEL,
            parentBuffer: rec.PARENT_BUFFER ? rec.PARENT_BUFFER : ``,
          });

          this.buffers.push(data);
        });

        this.buffers.forEach(buffer => {
          buffer.parentBuffers = [];
          if (buffer.parentBuffer) {
            buffer.leadBuffer = this.findLeadBuffer(this.buffers, buffer, buffer).name;
          }
        });

        return this.buffers;
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

  private getLowerLevelBuffers(buffer: Buffer): string[] {
    const bufferNames: string[] = [];
    this.buffers.map(b => {
      if (b.parentBuffers.some(name => name === buffer.name)) {
        bufferNames.push(b.name);
      }
    });

    return bufferNames;
  }

  //#endregion
}
