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
import { MPLBapiService } from './hydra/bapi/mpl/bapi.service';
import { BDEBapiService } from './hydra/bapi/bde/bapi.service';
import { MasterBapiService } from './hydra/bapi/master/bapi.service';
import { MPLMasterBapiService } from './hydra/bapi/mpl/master/bapi.service';
import { ToolService } from './hydra/service/toolService';
import { WRMBapiService } from './hydra/bapi/wrm/bapi.service';

@NgModule({
  providers: [
    I18NService,
    AuthService,
    FetchService,
    BapiService,
    MachineService,
    ToolService,
    OperationService,
    BatchService,
    OperatorService,
    VBoardService,
    WebAPIService,
    PrintService,

    MasterBapiService,
    MPLBapiService,
    MPLMasterBapiService,
    BDEBapiService,
    WRMBapiService,
  ]
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    throwIfAlreadyLoaded(parentModule, 'CoreModule');
  }
}
