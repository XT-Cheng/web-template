import { of } from 'rxjs';
import { MaterialBatch, MaterialBuffer } from '@core/hydra/entity/batch';
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

export const requestMaterialBufferData = (form, batchService) => () => {
  if (!form.value.materialBuffer) {
    return of(null);
  }

  return batchService.getMaterialBuffer(form.value.materialBuffer).pipe(
    tap((buffer: MaterialBuffer) => {
      if (!buffer) {
        throw Error(`${form.value.materialBuffer} not exist!`);
      }
      if (buffer.name === form.value.batchData.bufferName) {
        throw Error(`Batch alreaday in Location ${form.value.batchData.bufferName}`);
      }
    })
  );
};
