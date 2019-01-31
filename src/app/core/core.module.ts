import { NgModule, Optional, SkipSelf } from '@angular/core';
import { throwIfAlreadyLoaded } from './module-import-guard';

import { I18NService } from './i18n/i18n.service';
import { AuthService } from './auth/providers/auth.service';
import { FetchService } from './hydra/service/fetch.service';
import { BapiService } from './hydra/service/bapi.service';
import { VBoardService } from './hydra/service/vBoard.service';
import { BatchService } from './hydra/service/batch.service';
import { MachineService } from './hydra/service/machine.service';
import { OperatorService } from './hydra/service/operator.service';
import { WebAPIService } from './hydra/service/webapi.service';
import { PrintService } from './hydra/service/print.service';
import { OperationService } from './hydra/service/operation.service';

@NgModule({
  providers: [
    I18NService,
    AuthService,
    FetchService,
    BapiService,
    MachineService,
    OperationService,
    BatchService,
    OperatorService,
    VBoardService,
    WebAPIService,
    PrintService,
  ]
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    throwIfAlreadyLoaded(parentModule, 'CoreModule');
  }
}
