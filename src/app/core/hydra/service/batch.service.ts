import { Injectable } from '@angular/core';
import { FetchService } from './fetch.service';
import { map, switchMap, filter } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';
import {
  MaterialBatch, MaterialBuffer, BatchConnection,
  BatchConnectionNode, BatchConsumeConnectionNode, BatchMergeConnectionNode, BatchSplitConnectionNode
} from '@core/hydra/entity/batch';
import { format } from 'date-fns';
import { dateFormat, dateFormatOracle, replaceAll, leftPad } from '@core/utils/helpers';
import { BUFFER_SAP, BUFFER_PLANT } from 'app/routes/mobile/material/constants';

@Injectable()
export class BatchService {
  static MAX_RECENTLY_CREATED_COUNT = 51;
  static INPUT_BATCH_MAT_TYPE = 'Comp';

  static materialNameTBR = '$materialName';
  static lastChangedTBR = '$lastChanged';
  static buffersTBR = '$buffers';
  static batchNameTBR = '$batchName';
  static batchNamesTBR = '$batchNames';

  //#region SQL
  static allMaterialNameSql =
    `SELECT DISTINCT(ARTIKEL) AS ARTIKEL FROM LOS_BESTAND WHERE ARTIKEL LIKE '${BatchService.materialNameTBR}%' `;

  static batchNameExistanceIgnoreSAP =
    `SELECT LOSNR FROM LOS_BESTAND WHERE LOSNR = '${BatchService.batchNameTBR}' AND MAT_PUF <> '${BUFFER_SAP}'
     UNION SELECT LOSNR FROM A_LOS_BESTAND WHERE LOSNR = '${BatchService.batchNameTBR}' `;

  static batchNameExistance =
    `SELECT LOSNR FROM LOS_BESTAND WHERE LOSNR = '${BatchService.batchNameTBR}' AND MAT_PUF <> '${BUFFER_SAP}'
     UNION SELECT LOSNR FROM A_LOS_BESTAND WHERE LOSNR = '${BatchService.batchNameTBR}' `;

  static batchSql =
    `SELECT BATCH.LOSNR AS BATCHNAME, BUFFER.BEZ AS DESCRIPTION, BATCH.HZ_TYP AS MATTYPE, BATCH.EINHEIT AS UNIT, BATCH.STATUS AS STATUS,
      BATCH.KLASSE AS CLASS,(BATCH.STAT_UPD_DAT + BATCH.STAT_UPD_ZEIT / 24 / 3600) AS LASTCHANGED,
      BATCH.MAT_PUF AS BUFFERNAME,
      BUFFER.H_MAT_PUF AS PARENT_BUFFERNAME, BATCH.ARTIKEL AS MATERIAL, BATCH.RESTMENGE AS QUANTITY, SAP_CHARGE AS SAPBATCH,
      LOT_NR AS DATECODE FROM LOS_BESTAND BATCH, MAT_PUFFER BUFFER
      WHERE BATCH.STATUS IN ('F','L','A') AND BATCH.MAT_PUF = BUFFER.MAT_PUF AND BUFFER.WERK = '${BUFFER_PLANT}'
      AND BUFFER.PUFFER_TYP IN ('F','H') AND SUBSTR(BUFFER.KFG_KZ01,1,1) = 'N'
      ${BatchService.materialNameTBR}
      ${BatchService.lastChangedTBR}
      ${BatchService.buffersTBR}`;

  static batchInSAPSql =
    `SELECT BATCH.LOSNR AS BATCHNAME FROM LOS_BESTAND BATCH
     WHERE BATCH.MAT_PUF = '${BUFFER_SAP}' AND BATCH.LOSNR = '${BatchService.batchNameTBR}' `;

  static batchByNameSql =
    `SELECT BATCH.LOSNR AS BATCHNAME, BUFFER.BEZ AS DESCRIPTION, BATCH.HZ_TYP AS MATTYPE, BATCH.EINHEIT AS UNIT, BATCH.STATUS AS STATUS,
      BATCH.KLASSE AS CLASS, (BATCH.STAT_UPD_DAT + BATCH.STAT_UPD_ZEIT / 24 / 3600) AS LASTCHANGED,
      BATCH.MAT_PUF AS BUFFERNAME,
      BUFFER.H_MAT_PUF AS PARENT_BUFFERNAME, BATCH.ARTIKEL AS MATERIAL, BATCH.RESTMENGE AS QUANTITY, SAP_CHARGE AS SAPBATCH,
      LOT_NR AS DATECODE FROM LOS_BESTAND BATCH, MAT_PUFFER BUFFER
      WHERE BATCH.STATUS IN ('F','L','A') AND BATCH.MAT_PUF = BUFFER.MAT_PUF AND BUFFER.WERK = '${BUFFER_PLANT}'
      AND BUFFER.PUFFER_TYP IN ('F','H') AND SUBSTR(BUFFER.KFG_KZ01,1,1) = 'N' AND BATCH.LOSNR = '${BatchService.batchNameTBR}' `;

  static batchInSAPByNameSql =
    `SELECT BATCH.LOSNR AS BATCHNAME, BUFFER.BEZ AS DESCRIPTION, BATCH.HZ_TYP AS MATTYPE, BATCH.EINHEIT AS UNIT, BATCH.STATUS AS STATUS,
      BATCH.KLASSE AS CLASS, (BATCH.STAT_UPD_DAT + BATCH.STAT_UPD_ZEIT / 24 / 3600) AS LASTCHANGED,
      BATCH.MAT_PUF AS BUFFERNAME,
      BUFFER.H_MAT_PUF AS PARENT_BUFFERNAME, BATCH.ARTIKEL AS MATERIAL, BATCH.RESTMENGE AS QUANTITY, SAP_CHARGE AS SAPBATCH,
      LOT_NR AS DATECODE FROM LOS_BESTAND BATCH, MAT_PUFFER BUFFER
      WHERE BATCH.STATUS IN ('F','L','A') AND BATCH.MAT_PUF = BUFFER.MAT_PUF AND BUFFER.WERK = '${BUFFER_PLANT}'
      AND BUFFER.MAT_PUF = '${BUFFER_SAP}' AND BATCH.LOSNR = '${BatchService.batchNameTBR}' `;

  static batchesByNamesSql =
    `SELECT BATCH.LOSNR AS BATCHNAME, BUFFER.BEZ AS DESCRIPTION, BATCH.HZ_TYP AS MATTYPE, BATCH.EINHEIT AS UNIT, BATCH.STATUS AS STATUS,
      BATCH.KLASSE AS CLASS, (BATCH.STAT_UPD_DAT + BATCH.STAT_UPD_ZEIT / 24 / 3600) AS LASTCHANGED,
      BATCH.MAT_PUF AS BUFFERNAME,
      BUFFER.H_MAT_PUF AS PARENT_BUFFERNAME, BATCH.ARTIKEL AS MATERIAL, BATCH.RESTMENGE AS QUANTITY, SAP_CHARGE AS SAPBATCH,
      LOT_NR AS DATECODE FROM LOS_BESTAND BATCH, MAT_PUFFER BUFFER
      WHERE BATCH.STATUS IN ('F','L','A') AND BATCH.MAT_PUF = BUFFER.MAT_PUF AND BUFFER.WERK = '${BUFFER_PLANT}'
      AND BUFFER.PUFFER_TYP IN ('F','H') AND SUBSTR(BUFFER.KFG_KZ01,1,1) = 'N' AND BATCH.LOSNR IN (${BatchService.batchNamesTBR})`;

  static unitByMaterialSql =
    `SELECT BASE_UOM FROM U_TE_MMLP_PRODUCT_MASTER WHERE PART_NUMBER = '${BatchService.materialNameTBR}'`;

  static matTypeByMaterialSql =
    `SELECT HYDRA_MAT_TYPE FROM U_TE_MMLP_PRODUCT_MASTER MAT_MASTER, U_TE_SAP_HYDRA_MAT_TYPE_REF TYPE_REF
     WHERE MAT_MASTER.PART_NUMBER = '${BatchService.materialNameTBR}' AND TYPE_REF.SAP_MRP_GROUP = MAT_MASTER.MRP_GROUP`;

  static batchBufferSql =
    `SELECT BUFFERAREA.MAT_PUF AS BUFFER_NAME, BUFFERAREA.BEZ AS BUFFER_DESC, BUFFERAREA.HIERARCHIE_ID AS BUFFER_LEVEL,
     BUFFERAREA.H_MAT_PUF AS PARENT_BUFFER,
     BUFFEREXT.ALLOWED_MAT
     FROM MAT_PUFFER BUFFERAREA, U_TE_MPL_BUFFER_EXT BUFFEREXT
     WHERE BUFFERAREA.WERK = '${BUFFER_PLANT}' AND BUFFERAREA.PUFFER_TYP IN ('F','H') AND SUBSTR(BUFFERAREA.KFG_KZ01,1,1) = 'N'
     AND BUFFERAREA.MAT_PUF = BUFFEREXT.MAT_PUF(+)`;

  static batchConnectionForwardSql =
    `SELECT CONNECT_BY_ROOT(AL_NR) AS ROOT,LEVEL,EL_NR AS INPUTBATCH, (EL_AN_DAT + EL_AN_ZEIT / 24 / 3600) AS INPUTLOGON ,
     (EL_AB_DAT + EL_AB_ZEIT / 24 / 3600) AS INPUTLOGOFF ,
     AL_NR AS OUTPUTBATCH, (AL_AN_DAT + AL_AN_ZEIT / 24 / 3600) AS OUTPUTLOGON,(AL_AB_DAT + AL_AB_ZEIT / 24 / 3600) AS OUTPUTLOGOFF,
     EL_MATNR AS INPUTMATERIAL, EL_HZTYP AS INPUTMATERIALTYPE,
     AL_MATNR AS OUTPUTMATERIAL, AL_HZTYP AS OUTPUTMATERIALTYPE,
     AUFTRAG_NR AS OPERATION, MASCH_NR AS MACHINE
     FROM LOS_ZUORDNUNG START WITH AL_NR = '${BatchService.batchNameTBR}'
     CONNECT BY AL_NR = PRIOR EL_NR ORDER BY LEVEL DESC`;

  static batchConnectionBackwardSql =
    `SELECT CONNECT_BY_ROOT(EL_NR) AS ROOT,LEVEL,EL_NR AS INPUTBATCH, (EL_AN_DAT + EL_AN_ZEIT / 24 / 3600) AS INPUTLOGON ,
     (EL_AB_DAT + EL_AB_ZEIT / 24 / 3600) AS INPUTLOGOFF ,
     AL_NR AS OUTPUTBATCH, (AL_AN_DAT + AL_AN_ZEIT / 24 / 3600) AS OUTPUTLOGON,(AL_AB_DAT + AL_AB_ZEIT / 24 / 3600) AS OUTPUTLOGOFF,
     EL_MATNR AS INPUTMATERIAL, EL_HZTYP AS INPUTMATERIALTYPE,
     AL_MATNR AS OUTPUTMATERIAL, AL_HZTYP AS OUTPUTMATERIALTYPE,
     AUFTRAG_NR AS OPERATION, MASCH_NR AS MACHINE
     FROM LOS_ZUORDNUNG START WITH EL_NR = '${BatchService.batchNameTBR}'
     CONNECT BY PRIOR AL_NR = EL_NR ORDER BY LEVEL DESC`;

  static batchInputRecentlyUpdatedSql = `SELECT BATCHNAME,DESCRIPTION, MATTYPE,UNIT, STATUS, CLASS, LASTCHANGED, BUFFERNAME,
   PARENT_BUFFERNAME, MATERIAL, QUANTITY, SAPBATCH,DATECODE
   FROM (SELECT BATCH.LOSNR AS BATCHNAME, BUFFER.BEZ AS DESCRIPTION, BATCH.HZ_TYP AS MATTYPE, BATCH.EINHEIT AS UNIT, BATCH.STATUS AS STATUS,
   BATCH.KLASSE AS CLASS, (BATCH.STAT_UPD_DAT + BATCH.STAT_UPD_ZEIT / 24 / 3600) AS LASTCHANGED,
   BATCH.MAT_PUF AS BUFFERNAME,
   BUFFER.H_MAT_PUF AS PARENT_BUFFERNAME, BATCH.ARTIKEL AS MATERIAL, BATCH.RESTMENGE AS QUANTITY, SAP_CHARGE AS SAPBATCH,
   LOT_NR AS DATECODE FROM LOS_BESTAND BATCH, MAT_PUFFER BUFFER
   WHERE STATUS IN ('F','L','A') AND BATCH.MAT_PUF = BUFFER.MAT_PUF AND HZ_TYP = '${BatchService.INPUT_BATCH_MAT_TYPE}'
   AND PUFFER_TYP IN ('F','H') AND SUBSTR(KFG_KZ01,1,1) = 'N' ORDER BY (STAT_UPD_DAT + STAT_UPD_ZEIT / 24 / 3600) DESC)
   WHERE ROWNUM < ${BatchService.MAX_RECENTLY_CREATED_COUNT}`;

  //#endregion

  //#region Private members

  private buffers: MaterialBuffer[];

  //#endregion

  //#region Constructor

  constructor(protected _fetchService: FetchService) { }

  //#endregion

  //#region Public methods
  searchBatchMaterial(materialName: string): Observable<string[]> {
    return this.getAllMaterialNames(materialName);
  }

  searchBatchBuffer(buffer: string): Observable<string[]> {
    return this.getMaterialBuffers().pipe(
      map(buffers => {
        return buffers.reduce((results, currentValue, currentIndex) => {
          if (currentValue.name.includes(buffer)) {
            results.push(currentValue.name);
          }
          return results;
        }, []);
      }));
  }

  searchBatch(materialName: string, bufferName: string = ''): Observable<MaterialBatch[]> {
    return this.getMaterialBuffer(bufferName).pipe(
      switchMap(buffer => {
        if (buffer || !bufferName) {
          return this.getBatches(materialName, buffer);
        }
        return this.getBatches(materialName);
      }));
  }

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
        `AND (BATCH.STAT_UPD_DAT + BATCH.STAT_UPD_ZEIT / 24 / 3600) <
        TO_DATE('${format(lastChanged, dateFormat)}', '${dateFormatOracle}')`);
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
            status: batch.STATUS,
            class: batch.CLASS,
            dateCode: batch.DATECODE,
            materialType: batch.MATTYPE,
            unit: batch.UNIT
          });

          ret.push(data);
        });

        return ret;
      }),
      map(batches => {
        return batches.filter(batch => {
          if (batch.status === 'F' && batch.quantity > 0) {
            return true;
          } else {
            return false;
          }
        });
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
            allowedMaterials: rec.ALLOWED_MAT ? rec.ALLOWED_MAT.split(`;`) : []
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

  getBatchInfoFrom2DBarCode(barCodeOf2D: string, requireFullData: boolean = false): Observable<MaterialBatch> {

    const batchInfo: MaterialBatch = new MaterialBatch();

    const ret = barCodeOf2D.split('$');

    if (ret.length === 6) {
      // Sample: 1573290-1$Z181006J21$25$10$18407$3SH53Y22001293
      //         Material$Batch$Qty$Reel$DateCode$3S
      batchInfo.name = ret[5];
      batchInfo.barCode = barCodeOf2D;
      batchInfo.material = ret[0];
      batchInfo.dateCode = ret[4];
      batchInfo.SAPBatch = ret[1];
      batchInfo.quantity = batchInfo.startQty = parseInt(ret[2], 10);
    } else if (barCodeOf2D.startsWith(`3S`) && !requireFullData) {
      // Sample: 3SH53Y22001293
      batchInfo.name = barCodeOf2D;
      batchInfo.barCode = barCodeOf2D;
    } else {
      return throwError('Batch Label format in-correct');
    }
    return of(batchInfo);
  }

  isBatchNameExist(batchName: string, ignoreRecycleBin: boolean = true): Observable<boolean> {
    let sql = ignoreRecycleBin ? BatchService.batchNameExistanceIgnoreSAP : BatchService.batchNameExistance;
    sql = replaceAll(sql, [BatchService.batchNameTBR], [batchName]);

    return this._fetchService.query(sql).pipe(
      map((batches) => {
        return batches.length > 0 ? true : false;
      })
    );
  }

  isBatchInSAP(batchName: string): Observable<boolean> {
    let sql = BatchService.batchInSAPSql;
    sql = replaceAll(sql, [BatchService.batchNameTBR], [batchName]);

    return this._fetchService.query(sql).pipe(
      map((batches) => {
        return batches.length > 0 ? true : false;
      })
    );
  }

  getRecentlyCreatedMaterialBatch(): Observable<MaterialBatch[]> {
    return this._fetchService.query(BatchService.batchInputRecentlyUpdatedSql).pipe(
      map((batches) => {
        const ret: MaterialBatch[] = [];
        batches.forEach(rec => {
          const batch = new MaterialBatch();
          batch.name = rec.BATCHNAME;
          batch.bufferName = rec.BUFFERNAME;
          batch.lastChanged = new Date(rec.LASTCHANGED);
          batch.bufferDescription = rec.DESCRIPTION;
          batch.parentBuffer = rec.PARENT_BUFFERNAME;
          batch.quantity = rec.QUANTITY;
          batch.material = rec.MATERIAL;
          batch.status = rec.STATUS;
          batch.class = rec.CLASS;
          batch.SAPBatch = rec.SAPBATCH;
          batch.dateCode = rec.DATECODE;
          batch.materialType = rec.MATTYPE;
          batch.unit = rec.UNIT;
          ret.push(batch);
        });

        return ret;
      }),
      map(batches => {
        return batches.filter(batch => {
          if (batch.status === 'F' && batch.quantity > 0) {
            return true;
          } else {
            return false;
          }
        });
      }));
  }

  getBatchesByNames(batchNames: string[]): Observable<MaterialBatch[]> {
    let sql = BatchService.batchesByNamesSql;
    sql = sql.replace(BatchService.batchNamesTBR, batchNames.map(b => `'` + b + `'`).join(','));

    return this._fetchService.query(sql).pipe(
      map((batches) => {
        const ret: MaterialBatch[] = [];
        batches.forEach(rec => {
          const batch = new MaterialBatch();
          batch.name = rec.BATCHNAME;
          batch.bufferName = rec.BUFFERNAME;
          batch.lastChanged = new Date(rec.LASTCHANGED);
          batch.bufferDescription = rec.DESCRIPTION;
          batch.parentBuffer = rec.PARENT_BUFFERNAME;
          batch.quantity = rec.QUANTITY;
          batch.material = rec.MATERIAL;
          batch.status = rec.STATUS;
          batch.class = rec.CLASS;
          batch.SAPBatch = rec.SAPBATCH;
          batch.dateCode = rec.DATECODE;
          batch.materialType = rec.MATTYPE;
          batch.unit = rec.UNIT;
          ret.push(batch);
        });

        return ret;
      }));
  }

  getBatchInSAPformation(batchName: string): Observable<MaterialBatch> {
    let sql = BatchService.batchInSAPByNameSql;
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
          ret.status = batch.STATUS;
          ret.class = batch.CLASS;
          ret.SAPBatch = batch.SAPBATCH;
          ret.dateCode = batch.DATECODE;
          ret.materialType = batch.MATTYPE;
          ret.unit = batch.UNIT;
        });

        return ret;
      }),
      map(batch => {
        if (batch !== null && batch.status === 'F' && batch.quantity > 0) {
          return batch;
        } else {
          return null;
        }
      }));
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
          ret.status = batch.STATUS;
          ret.class = batch.CLASS;
          ret.SAPBatch = batch.SAPBATCH;
          ret.dateCode = batch.DATECODE;
          ret.materialType = batch.MATTYPE;
          ret.unit = batch.UNIT;
        });

        return ret;
      }),
      map(batch => {
        if (batch !== null && batch.status === 'F' && batch.quantity > 0) {
          return batch;
        } else {
          return null;
        }
      }));
  }

  getBatchInformationWithRunning(batchName: string): Observable<MaterialBatch> {
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
          ret.status = batch.STATUS;
          ret.class = batch.CLASS;
          ret.SAPBatch = batch.SAPBATCH;
          ret.dateCode = batch.DATECODE;
          ret.materialType = batch.MATTYPE;
          ret.unit = batch.UNIT;
        });

        return ret;
      }),
      map(batch => {
        if (batch !== null && batch.quantity > 0 && (batch.status === 'F' || batch.status === 'L')) {
          return batch;
        } else {
          return null;
        }
      }));
  }

  getBatchInformationAllowNegativeQuantity(batchName: string): Observable<MaterialBatch> {
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
          ret.status = batch.STATUS;
          ret.class = batch.CLASS;
          ret.SAPBatch = batch.SAPBATCH;
          ret.dateCode = batch.DATECODE;
          ret.materialType = batch.MATTYPE;
          ret.unit = batch.UNIT;
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

  getMaterialUnit(materialName: string): Observable<string> {
    let sql = BatchService.unitByMaterialSql;
    sql = sql.replace(BatchService.materialNameTBR, materialName);

    return this._fetchService.query(sql).pipe(
      map((ret) => {
        if (ret.length > 0) {
          return ret[0].BASE_UOM ? ret[0].BASE_UOM : ``;
        }
        return ``;
      }));
  }

  getMaterialType(materialName: string): Observable<string> {
    let sql = BatchService.matTypeByMaterialSql;
    sql = sql.replace(BatchService.materialNameTBR, materialName);

    return this._fetchService.query(sql).pipe(
      map((ret) => {
        if (ret.length > 0) {
          return ret[0].HYDRA_MAT_TYPE ? ret[0].HYDRA_MAT_TYPE : ``;
        }
        return ``;
      }));
  }

  getBackwardBatchConnection(batchName: string): Observable<BatchConnection> {
    return this.getBatchInfoFrom2DBarCode(batchName).pipe(
      switchMap((batch: MaterialBatch) => {
        let sql = BatchService.batchConnectionBackwardSql;
        sql = sql.replace(BatchService.batchNameTBR, batch.name);
        return this.getBatchConnection(batch.name, sql);
      }
      ));
  }

  getForwardBatchConnection(batchName: string): Observable<BatchConnection> {
    return this.getBatchInfoFrom2DBarCode(batchName).pipe(
      switchMap((batch: MaterialBatch) => {
        let sql = BatchService.batchConnectionForwardSql;
        sql = sql.replace(BatchService.batchNameTBR, batch.name);
        return this.getBatchConnection(batch.name, sql);
      }
      ));
  }

  //#endregion

  //#region Private methods
  private getBatchConnection(batchName: string, sql: string): Observable<BatchConnection> {
    return this._fetchService.query(sql).pipe(
      map((ret: any[]) => {
        if (ret.length === 0) {
          return {
            totalLevel: 0,
            root: batchName,
            nodes: []
          };
        } else {
          const connection = {
            totalLevel: ret[ret.length - 1].LEVEL,
            root: batchName,
            nodes: []
          };
          ret.forEach(rec => {
            let node: BatchConnectionNode;
            if (rec.OPERATION && rec.MACHINE) {
              node = Object.assign<BatchConsumeConnectionNode, any>(new BatchConsumeConnectionNode(), {
                level: rec.LEVEL,
                inputBatch: rec.INPUTBATCH,
                inputBatchMaterial: rec.INPUTMATERIAL,
                inputBatchMaterialType: rec.INPUTMATERIALTYPE,
                outputBatch: rec.OUTPUTBATCH,
                outputBatchMaterial: rec.OUTPUTMATERIAL,
                outputBatchMaterialType: rec.OUTPUTMATERIALTYPE,
                machineName: rec.MACHINE,
                orderName: rec.OPERATION,
              });
            } else if (rec.MACHINE === '0') {
              node = Object.assign<BatchMergeConnectionNode, any>(new BatchMergeConnectionNode(), {
                level: rec.LEVEL,
                inputBatch: rec.INPUTBATCH,
                inputBatchMaterial: rec.INPUTMATERIAL,
                inputBatchMaterialType: rec.INPUTMATERIALTYPE,
                outputBatch: rec.OUTPUTBATCH,
                outputBatchMaterial: rec.OUTPUTMATERIAL,
                outputBatchMaterialType: rec.OUTPUTMATERIALTYPE,
              });
            } else {
              node = Object.assign<BatchSplitConnectionNode, any>(new BatchSplitConnectionNode(), {
                level: rec.LEVEL,
                inputBatch: rec.INPUTBATCH,
                inputBatchMaterial: rec.INPUTMATERIAL,
                inputBatchMaterialType: rec.INPUTMATERIALTYPE,
                outputBatch: rec.OUTPUTBATCH,
                outputBatchMaterial: rec.OUTPUTMATERIAL,
                outputBatchMaterialType: rec.OUTPUTMATERIALTYPE,
              });
            }

            connection.nodes.push(node);
          });
          return connection;
        }
      }));
  }

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
