import { Component, OnInit } from '@angular/core';
import { MachineReportService } from '@core/hydra/report/machine.report.service';

@Component({
  selector: 'fw-widget-hour-scrap',
  templateUrl: './scrapPerHour.component.html',
  styleUrls: ['./scrapPerHour.component.less']
})
export class ScrapPerHourComponent {
  constructor(
    public machineRptService: MachineReportService
  ) {

  }
}
