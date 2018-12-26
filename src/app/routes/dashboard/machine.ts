import { Machine } from '@core/hydra/entity/machine';
import { OperationExt } from './operation';
import { format } from 'date-fns';

export class MachineExt extends Machine {
  get currentOperationsExt(): OperationExt[] {
    const ops = [];
    this.currentOperations.map((op) => {
      ops.push(Object.assign(new OperationExt(), op));
    });

    return ops;
  }

  get nextOperationsExt(): OperationExt[] {
    const ops = [];
    this.nextOperations.map((op) => {
      ops.push(Object.assign(new OperationExt(), op));
    });

    return ops;
  }

  get currentOperationExt(): OperationExt {
    if (this.currentOperationsExt.length === 0) return null;

    return this.currentOperationsExt.sort((a, b) => a.lastLoggedOn > b.lastLoggedOn ? 1 : 0)[0];
  }

  get nextOperationExt(): OperationExt {
    if (this.nextOperationsExt.length === 0) return null;

    return this.nextOperationsExt.sort((a, b) => a.lastLoggedOn > b.lastLoggedOn ? 1 : 0)[0];
  }


}
