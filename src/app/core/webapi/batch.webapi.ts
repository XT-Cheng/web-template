import { Injectable } from "@angular/core";

import { HttpClient } from "@angular/common/http";
import { MaterialBatch, BatchBuffer } from "@core/hydra/entity/batch";
import { Observable, throwError, of } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { Operator } from "@core/hydra/entity/operator";
import { IActionResult } from "@core/utils/helpers";

@Injectable()
export class BatchWebApi {
    constructor(protected _http: HttpClient) {
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
        } else if (barCodeOf2D.startsWith(`[)>06`)) {
            // [)>06 LT3SDE1B00990065 PN2137699-1 RVA QT72 PO2705416447 BT180902M BX38 DC18361
            const special = barCodeOf2D.split(` `);
            special.map(segment => {
                if (segment.startsWith(`LT`)) {
                    batchInfo.name = segment.substring(2);
                }

                if (segment.startsWith(`PN`)) {
                    batchInfo.material = segment.substring(2);
                }

                if (segment.startsWith(`QT`)) {
                    batchInfo.quantity = parseInt(segment.substring(2), 10);
                }

                if (segment.startsWith(`BT`)) {
                    batchInfo.SAPBatch = segment.substring(2);
                }

                if (segment.startsWith(`DC`)) {
                    batchInfo.dateCode = segment.substring(2);
                }

                if (segment.startsWith(`LT`)) {
                    batchInfo.name = segment.substring(2);
                }
            });
            batchInfo.barCode = barCodeOf2D;
        } else if (barCodeOf2D.startsWith(`3S`) && !requireFullData) {
            // Sample: 3SH53Y22001293
            batchInfo.name = barCodeOf2D;
            batchInfo.barCode = barCodeOf2D;
        } else {
            return throwError('Batch Label format in-correct');
        }
        return of(batchInfo);
    }

    isBatchNameExist(batchName: string, ignoreSAP: boolean = true): Observable<boolean> {
        return this._http.get(`/api/batchService/isBatchNameExist/${batchName}/${ignoreSAP}`).pipe(
            map((exist: any) => {
                return exist;
            })
        )
    }

    isBatchInSAP(batchName: string): Observable<boolean> {
        return this._http.get(`/api/batchService/isBatchInSAP/${batchName}`).pipe(
            map((inSAP: any) => {
                return inSAP;
            })
        )
    }

    getMaterialBuffer(batchBufferName: string): Observable<BatchBuffer> {
        return this._http.get(`/api/batchService/batchBuffer/${batchBufferName}`).pipe(
            map((batchBuffer: any) => {
                if (!batchBuffer) {
                    throw Error(`${batchBufferName} not exist!`);
                }

                return BatchWebApi.translateBatchBuffer(batchBuffer);
            })
        )
    }

    createBatch(batch: MaterialBatch, batchBuffer: BatchBuffer, numberOfSplits: number,
        isReturnFromSAP: boolean, operator: Operator): Observable<any> {
        return this._http.post(`/api/batchService/createBatch`, {
            BatchName: batch.name,
            MaterialName: batch.material,
            MaterialType: batch.materialType,
            Unit: batch.unit,
            Quantity: batch.quantity,
            MaterialBuffer: batchBuffer.name,
            SAPBatch: batch.SAPBatch,
            DateCode: batch.dateCode,
            IsReturnFromSAP: isReturnFromSAP,
            NumberOfSplit: numberOfSplits,
            Badge: operator.badge
        }).pipe(
            map((ltsToPrint: any) => {
                return ltsToPrint;
            })
        )
    }

    public static translateBatchBuffer(batchBuffer: any): BatchBuffer {
        let ret = new BatchBuffer();

        ret.name = batchBuffer.Name;
        ret.description = batchBuffer.Description;
        ret.bufferLevel = batchBuffer.BufferLevel;
        ret.parentBuffer = batchBuffer.ParentBuffer;
        ret.allowedMaterials = batchBuffer.AllowedMaterials.map(x => x);

        return ret;
    }
}