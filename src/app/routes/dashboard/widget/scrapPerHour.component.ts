import { Component, OnInit } from '@angular/core';
import { MachineService } from '@core/hydra/service/machine.service';
import { Machine } from '@core/hydra/entity/machine';
import { format } from 'date-fns';

@Component({
  selector: 'fw-widget-hour-scrap',
  templateUrl: './scrapPerHour.component.html',
  styleUrls: ['./scrapPerHour.component.less']
})
export class ScrapPerHourComponent implements OnInit {
  //#region Fields

  machine: Machine;

  //#endregion

  //#region Constructor

  constructor(
    public machineService: MachineService
  ) {

  }

  //#endregion

  //#region Implemented interface

  ngOnInit() {
    this.machineService.machine$.subscribe((machine) => {
      this.machine = machine;
    });
  }

  //#endregion

  //#region Machine related properties

  //#region Machine based Scrap trend of 48 hours

  get scrapTrend() {
    const scraps = new Array<{
      x: string; y: number
    }>();
    this.machine.output.forEach((value, key) => {
      scraps.push({
        x: format(key, 'HH:mm'),
        y: value.scrap
      });
    });

    return scraps.slice(((scraps.length + 1) / 2), scraps.length);
  }

  //#endregion

  //#endregion
}
