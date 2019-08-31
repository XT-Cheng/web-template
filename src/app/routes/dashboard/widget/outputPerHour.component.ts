import { Component, OnInit, Input } from '@angular/core';
import { MachineService } from '@core/hydra/service/machine.service';
import { Machine } from '@core/hydra/entity/machine';
import { format } from 'date-fns';

@Component({
  selector: 'fw-widget-hour-output',
  templateUrl: './outputPerHour.component.html',
  styleUrls: ['./outputPerHour.component.less']
})
export class OutputPerHourComponent implements OnInit {
  //#region Fields
  private _machine: Machine = new Machine();

  @Input()
  set machine(value: Machine) {
    this._machine = value;
  }

  //#endregion

  //#region Constructor

  constructor(
    // public machineService: MachineService
  ) {

  }

  //#endregion

  //#region Implemented interface

  ngOnInit() {
  }

  //#endregion

  //#region Machine related properties

  //#region Machine based Yield trend of 48 hours

  get yieldTrend() {
    const yields = new Array<{
      x: string; y: number
    }>();
    this._machine.output.forEach((value, key) => {
      yields.push({
        x: format(key, 'HH:mm'),
        y: value.output
      });
    });

    return yields.slice(((yields.length + 1) / 2), yields.length);
  }

  //#endregion

  //#endregion
}
