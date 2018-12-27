import { NgModule, Optional, SkipSelf } from '@angular/core';
import { throwIfAlreadyLoaded } from './module-import-guard';

import { I18NService } from './i18n/i18n.service';
import { AuthService } from './auth/providers/auth.service';
import { FetchService } from './hydra/service/fetch.service';
import { BapiService } from './hydra/service/bapi.service';
import { VBoardService } from './hydra/service/vBoard.service';
import { BatchReportService } from './hydra/report/batch.report.service';
import { MachineService } from './hydra/service/machine.service';

@NgModule({
  providers: [
    I18NService,
    AuthService,
    FetchService,
    BapiService,
    MachineService,
    BatchReportService,
    VBoardService
  ]
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    throwIfAlreadyLoaded(parentModule, 'CoreModule');
  }
}
