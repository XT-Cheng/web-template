import { Injectable } from "@angular/core";

import { HttpClient } from "@angular/common/http";
import { MaterialBatch, BatchBuffer } from "@core/hydra/entity/batch";
import { Observable, throwError, of } from "rxjs";
import { map } from "rxjs/operators";
import { Operator } from "@core/hydra/entity/operator";
import { ComponentToBeChangeQty } from "@core/hydra/utils/operationHelper";
import { ComponentLoggedOn, Operation } from "@core/hydra/entity/operation";
import { Machine } from "@core/hydra/entity/machine";
import { format } from "date-fns";

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
        } else if ((barCodeOf2D.startsWith(`3S`) || barCodeOf2D.startsWith(`MT`)) && !requireFullData) {
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

    searchBatchMaterial(materialName: string): Observable<string[]> {
        return this._http.get(`/api/batchService/material/${materialName}`).pipe(
            map((mats: string[]) => {
                return mats;
            })
        )
    }

    searchBatch(materialName: string, bufferName: string = '', lastChangedDateTime: Date = null): Observable<MaterialBatch[]> {
        let params = {
            materialName: materialName
        };

        if (bufferName != '') {
            params[`bufferName`] = bufferName;
        }

        if (lastChangedDateTime != null) {
            params[`lastChangedDateTime`] = format(lastChangedDateTime, 'YYYY-MM-DD HH:mm:ss');
        }

        return this._http.get(`/api/batchService/searchBatchs`, {
            params: params
        }).pipe(
            map((batches: []) => {
                return batches.map(batch => BatchWebApi.translateBatch(batch));
            }));
    }

    getBatch(batchName: string): Observable<MaterialBatch> {
        return this._http.get(`/api/batchService/batch//${batchName}`).pipe(
            map((batch: any) => {
                if (!batch) {
                    throw Error(`${batchName} not exist!`);
                }

                return BatchWebApi.translateBatch(batch);
            })
        )
    }

    getRecentlyUpdatedBatch(onlyComponent: boolean): Observable<MaterialBatch[]> {
        return this._http.get(`/api/batchService/recentlyUpdatedBatch/${onlyComponent}`).pipe(
            map((batches: []) => {
                return batches.map(batch => BatchWebApi.translateBatch(batch))
            })
        )
    }

    splitBatch(batch: MaterialBatch, childCount: number, childQty: number, operator: Operator) {
        return this._http.post(`/api/batchService/splitBatch`, {
            BatchName: batch.name,
            MaterialName: batch.material,
            MaterialType: batch.materialType,
            Quantity: batch.quantity,
            MaterialBuffer: batch.bufferName,
            SAPBatch: batch.SAPBatch,
            DateCode: batch.dateCode,
            NumberOfSplit: childCount,
            ChildQty: childQty,
            Badge: operator.badge
        }).pipe(
            map((ltsToPrint: string[]) => {
                return ltsToPrint;
            })
        )
    }

    createBatch(batch: MaterialBatch, batchBuffer: BatchBuffer, numberOfSplits: number,
        isReturnFromSAP: boolean, operator: Operator): Observable<string[]> {
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
            map((ltsToPrint: string[]) => {
                return ltsToPrint;
            })
        )
    }

    moveBatchs(batchs: MaterialBatch[], destination: BatchBuffer | { name: string }, operator: Operator): Observable<string[]> {
        let reqs = batchs.map(batch => {
            return {
                BatchName: batch.name,
                Destination: destination.name,
                Status: batch.status,
                Class: batch.class,
                MaterialType: batch.materialType,
                Badge: operator.badge
            }
        });

        return this._http.post(`/api/batchService/moveBatchs`, reqs).pipe(
            map((moved: string[]) => {
                return moved;
            })
        )
    }

    logoffInputBatch(operation: Operation | { name: string }, machine: Machine | { machineName: string }, operator: Operator,
        batch: MaterialBatch | { name: string }, pos: number) {
        return this._http.post(`/api/batchService/logoffInputBatch`, {
            Badge: operator.badge,
            OperationName: operation.name,
            MachineName: machine.machineName,
            BatchName: batch.name,
            Position: pos
        }).pipe(
            map((loggedOff: string) => {
                return loggedOff;
            })
        );
    }

    logonInputBatch(operation: Operation | { name: string }, machine: Machine | { machineName: string }, operator: Operator,
        batch: MaterialBatch, pos: number) {
        return this._http.post(`/api/batchService/logonInputBatch`, {
            Badge: operator.badge,
            OperationName: operation.name,
            MachineName: machine.machineName,
            BatchMaterial: batch.material,
            BatchName: batch.name,
            Quantity: batch.quantity,
            Position: pos
        }).pipe(
            map((loggedOn: string) => {
                return loggedOn;
            })
        );
    }

    replenishInputBatch(machine: Machine | { machineName: string },
        batch: MaterialBatch, operator: Operator) {
        return this._http.post(`/api/batchService/replenishInputBatch`, {
            Badge: operator.badge,
            MachineName: machine.machineName,
            BatchMaterial: batch.material,
            BatchName: batch.name,
            Quantity: batch.quantity,
        }).pipe(
            map((loggedOn: string) => {
                return loggedOn;
            })
        );
    }

    changeBatchQuantity(batch: MaterialBatch, newQuantity: number, operator: Operator) {
        return this._http.post(`/api/batchService/changeBatchQuantity`, {
            Badge: operator.badge,
            BatchName: batch.name,
            MaterialType: batch.materialType,
            Quantity: newQuantity,
            Status: batch.status,
            Class: batch.class,
            SAPBatch: batch.SAPBatch,
            DateCode: batch.dateCode,
        }).pipe(
            map((changed: string) => {
                return changed;
            })
        );
    }

    getBatchLoggedOnContext(batch: MaterialBatch): Observable<ComponentToBeChangeQty> {
        return this._http.get(`/api/batchService/batchLoggedOn/${batch.name}`).pipe(
            map((batchLoggedOn: any) => {
                if (!batchLoggedOn) {
                    return null;
                }

                return BatchWebApi.translateComponentLoggedOn(batchLoggedOn);
            })
        );
    }

    public static translateComponentLoggedOn(batchLoggedOn: any): ComponentLoggedOn {
        let ret: ComponentLoggedOn = {
            batchName: batchLoggedOn.BatchName,
            material: batchLoggedOn.Material,
            allowLogoff: batchLoggedOn.AllowLogoff,
            batchQty: batchLoggedOn.BatchQty,
            machine: batchLoggedOn.Machine,
            operations: batchLoggedOn.OperationPos.map(op => {
                return {
                    name: op.Operation,
                    pos: op.Pos
                }
            })
        };

        return ret;
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

    public static translateBatch(batch: any): MaterialBatch {
        let ret = new MaterialBatch();

        ret.name = batch.Name;
        ret.bufferName = batch.BufferName;
        ret.parentBuffer = batch.ParentBuffer;
        ret.startQty = batch.StartQty;
        ret.quantity = batch.Quantity;
        ret.material = batch.Material;
        ret.materialType = batch.MaterialType;
        ret.status = batch.Status;
        ret.class = batch.BatchClass;
        ret.unit = batch.Unit;
        ret.SAPBatch = batch.SapBatch;
        ret.dateCode = batch.DateCode;
        ret.lastChanged = new Date(batch.LastChanged);
        ret.bufferDescription = batch.BufferDescription;
        return ret;
    }
}