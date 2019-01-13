import { Injectable } from '@angular/core';
import { FetchService } from './fetch.service';
import { map } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';
import { MaterialBatch, MaterialBuffer } from '@core/hydra/entity/batch';
import { format } from 'date-fns';
import { dateFormat, dateFormatOracle } from '@core/utils/helpers';

@Injectable()
export class BatchService {

  static materialNameTBR = '$materialName';
  static lastChangedTBR = '$lastChanged';
  static buffersTBR = '$buffers';
  static batchNameTBR = '$batchName';

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

  static batchByNameSql =
    `SELECT BATCH.LOSNR AS BATCHNAME, BUFFER.BEZ AS DESCRIPTION, ` +
    ` (BATCH.STAT_UPD_DAT + BATCH.STAT_UPD_ZEIT / 24 / 3600) AS LASTCHANGED, ` +
    ` BATCH.MAT_PUF AS BUFFERNAME, ` +
    ` BUFFER.H_MAT_PUF AS PARENT_BUFFERNAME, BATCH.ARTIKEL AS MATERIAL, BATCH.RESTMENGE AS QUANTITY, SAP_CHARGE AS SAPBATCH, ` +
    ` LOT_NR AS DATECODE FROM LOS_BESTAND BATCH, MAT_PUFFER BUFFER ` +
    ` WHERE BATCH.STATUS IN ('F','L') AND BATCH.RESTMENGE > 0 AND BATCH.MAT_PUF = BUFFER.MAT_PUF AND BUFFER.WERK = '0916' ` +
    ` AND BATCH.LOSNR = '${BatchService.batchNameTBR}' `;

  static batchBufferSql =
    `SELECT MAT_PUF AS BUFFER_NAME, BEZ AS BUFFER_DESC, HIERARCHIE_ID AS BUFFER_LEVEL, H_MAT_PUF AS PARENT_BUFFER ` +
    `FROM MAT_PUFFER WHERE WERK = '0916'`;

  //#endregion
  //#region Private members

  private buffers: MaterialBuffer[];

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

  getBatches(materialName: string = '', buffer: MaterialBuffer = null, lastChanged: Date = null)
    : Observable<MaterialBatch[]> {
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
        ` TO_DATE('${format(lastChanged, dateFormat)}', '${dateFormatOracle}') `);
    } else {
      sql = sql.replace(BatchService.lastChangedTBR, ``);
    }

    return this._fetchService.query(sql).pipe(
      map((batches) => {
        const ret: MaterialBatch[] = [];

        batches.forEach(batch => {
          const data = Object.assign(new MaterialBatch(), {
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

  getMaterialBuffers(): Observable<MaterialBuffer[]> {
    if (this.buffers) return of(this.buffers);

    return this._fetchService.query(BatchService.batchBufferSql).pipe(
      map((records) => {
        this.buffers = [];
        records.forEach(rec => {
          const data = Object.assign(new MaterialBuffer(), {
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

  getBatchInfoFrom2DBarCode(barCodeOf2D: string): Observable<MaterialBatch> {
    // Sample: 1573290-1$Z181006J21$25$10$18407$3SH53Y22001293
    //         Material$Batch$Qty$Reel$DateCode$3S
    const batchInfo: MaterialBatch = new MaterialBatch();

    const ret = barCodeOf2D.split('$');

    if (ret.length !== 6) {
      return throwError('Batch Label format in-correct');
    }

    batchInfo.name = ret[5];
    batchInfo.barCode = barCodeOf2D;
    batchInfo.material = ret[0];
    batchInfo.dateCode = ret[4];
    batchInfo.SAPBatch = ret[1];
    batchInfo.quantity = batchInfo.startQty = parseInt(ret[2], 10);
    return of(batchInfo);
  }

  getBatchInformation(batchName: string): Observable<MaterialBatch> {
    let sql = BatchService.batchByNameSql;
    sql = sql.replace(BatchService.batchNameTBR, batchName);

    return this._fetchService.query(sql).pipe(
      map((batches) => {
        let ret: MaterialBatch = null;
        batches.forEach(batch => {
          ret = new MaterialBatch();
          ret.name = batch.BATCHNAME;
          ret.bufferName = batch.BUFFERNAME;
          ret.lastChanged = new Date(batch.LASTCHANGED);
          ret.bufferDescription = batch.DESCRIPTION;
          ret.parentBuffer = batch.PARENT_BUFFERNAME;
          ret.quantity = batch.QUANTITY;
          ret.material = batch.MATERIAL;
          ret.SAPBatch = batch.SAPBATCH;
          ret.dateCode = batch.DATECODE;
        });

        return ret;
      }));
  }

  getMaterialBuffer(bufferName: string): Observable<MaterialBuffer> {
    return this.getMaterialBuffers().pipe(
      map(buffers => {
        const ret = buffers.find(b => b.name === bufferName);
        return ret ? ret : null;
      })
    );
  }
  //#endregion

  //#region Private methods

  private findLeadBuffer(buffers: MaterialBuffer[], buffer: MaterialBuffer, source: MaterialBuffer) {
    const found = buffers.find(target => {
      return target.name === buffer.parentBuffer;
    });

    if (found) {
      source.parentBuffers.unshift(found.name);
      return this.findLeadBuffer(buffers, found, source);
    }

    return buffer;
  }

  private getLowerLevelBuffers(buffer: MaterialBuffer): string[] {
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
