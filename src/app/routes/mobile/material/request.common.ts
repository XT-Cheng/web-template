import { of, MonoTypeOperatorFunction } from 'rxjs';
import { MaterialBatch, BatchBuffer } from '@core/hydra/entity/batch';
import { switchMap, map, tap } from 'rxjs/operators';
import { FormGroup } from '@angular/forms';
import { BatchService } from '@core/hydra/service/batch.service';

export const requestBatchData = (form: FormGroup, batchService: BatchService) => () => {
  if (!form.value.batch) {
    return of(null);
  }

  let barCodeInfo: MaterialBatch;
  return batchService.getBatchInfoFrom2DBarCode(form.value.batch).pipe(
    switchMap((barCodeData: MaterialBatch) => {
      barCodeInfo = barCodeData;
      return batchService.getBatchInformation(barCodeData.name).pipe(
        map((batch: MaterialBatch) => {
          if (batch) {
            batch.barCode = barCodeData.barCode;
          }
          return batch;
        })
      );
    }),
    tap((batch: MaterialBatch) => {
      if (!batch) {
        throw Error(`${barCodeInfo.name} not exist!`);
      }
    }));
};

export const requestMaterialBufferData = (form: FormGroup, batchService: BatchService,
  operator: MonoTypeOperatorFunction<any> = null) => () => {
    if (!form.value.materialBuffer) {
      return of(null);
    }

    const check = operator ? operator : tap(_ => _);

    return batchService.getMaterialBuffer(form.value.materialBuffer).pipe(
      tap((buffer: BatchBuffer) => {
        if (!buffer) {
          throw Error(`${form.value.materialBuffer} not exist!`);
        }
      }),
      check
    );
  };
