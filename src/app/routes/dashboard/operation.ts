import { Operation } from '@core/hydra/entity/operation';
import { format } from 'date-fns';

export class OperationExt extends Operation {

  get yieldTrend() {
    const yields = new Array<{
      x: string; y: number
    }>();
    this.output.forEach((value, key) => {
      yields.push({
        x: format(key, 'HH:mm'),
        y: value.yield
      });
    });

    return yields.slice(((yields.length + 1) / 2), yields.length);
  }

  get scrapTrend() {
    const scraps = new Array<{
      x: string; y: number
    }>();
    this.output.forEach((value, key) => {
      scraps.push({
        x: format(key, 'HH:mm'),
        y: value.scrap
      });
    });

    return scraps.slice(((scraps.length + 1) / 2), scraps.length);
  }

  get hourlyPerformance() {
    const performance = new Array<{ x: string, y: number }>();
    this.output.forEach((value, key) => {
      performance.push({
        x: format(key, 'HH:mm'),
        y: value.performance
      });
    });

    return performance.slice(((performance.length + 1) / 2), performance.length);
  }








}
