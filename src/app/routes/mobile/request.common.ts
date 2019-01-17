import { of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { FormGroup } from '@angular/forms';
import { OperatorService } from '@core/hydra/service/operator.service';

export const requestBadgeData = (form: FormGroup, operatorService: OperatorService) => () => {
  if (!form.value.badge) {
    return of(null);
  }

  return operatorService.getOperatorByBadge(form.value.badge).pipe(
    tap(operator => {
      if (!operator) {
        throw Error(`${form.value.badge} not exist!`);
      }
    }));
};
