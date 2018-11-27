import { NgModule, Optional, SkipSelf } from '@angular/core';
import { throwIfAlreadyLoaded } from './module-import-guard';

import { I18NService } from './i18n/i18n.service';
import { AuthService } from './auth/providers/auth.service';
import { FetchService } from './hydra/fetch.service';
import { BapiService } from './hydra/bapi.service';
import { MachineReportService } from './hydra/report/machine.report.service';
import { VBoardService } from './hydra/webService/vBoard.service';

@NgModule({
  providers: [
    I18NService,
    AuthService,
    FetchService,
    BapiService,
    MachineReportService,
    VBoardService
  ]
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    throwIfAlreadyLoaded(parentModule, 'CoreModule');
  }
}
