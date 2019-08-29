import { NgModule, Optional, SkipSelf } from '@angular/core';
import { throwIfAlreadyLoaded } from './module-import-guard';

import { I18NService } from './i18n/i18n.service';
import { AuthService } from './auth/providers/auth.service';
import { FetchService } from './hydra/service/fetch.service';
import { BapiService } from './hydra/bapi/bapi.service';
import { VBoardService } from './hydra/service/vBoard.service';
import { BatchService } from './hydra/service/batch.service';
import { MachineService } from './hydra/service/machine.service';
import { OperatorService } from './hydra/service/operator.service';
import { WebAPIService } from './hydra/service/webapi.service';
import { PrintService } from './hydra/service/print.service';
import { OperationService } from './hydra/service/operation.service';
import { MPLBapiService } from './hydra/bapi/mpl/bapi.service';
import { BDEBapiService } from './hydra/bapi/bde/bapi.service';
import { MPLMasterBapiService } from './hydra/bapi/mpl/master/bapi.service';
import { ToolService } from './hydra/service/tool.service';
import { WRMBapiService } from './hydra/bapi/wrm/bapi.service';
import { BDEMasterBapiService } from './hydra/bapi/bde/master/bapi.service';
import { MasterService } from './hydra/service/master.service';
import { MDEBapiService } from './hydra/bapi/mde/bapi.service';
import { UtilityService } from './utils/utility.service';
import { MachineWebApi } from './webapi/machine.webapi';
import { OperatorWebApi } from './webapi/operator.webapi';
import { BatchWebApi } from './webapi/batch.webapi';
import { MaterialMasterWebApi } from './webapi/materialMaster.webapi';
import { PrinterWebApi } from './webapi/printer.webapi';
import { PrintLabelWebApi } from './webapi/printLabel.webapi';
import { OperationWebApi } from './webapi/operation.webapi';

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
    MasterService,
    BDEMasterBapiService,
    MPLBapiService,
    MDEBapiService,
    MPLMasterBapiService,
    BDEBapiService,
    WRMBapiService,
    UtilityService,
    MachineWebApi,
    OperatorWebApi,
    BatchWebApi,
    MaterialMasterWebApi,
    PrinterWebApi,
    PrintLabelWebApi,
    OperationWebApi,
  ]
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    throwIfAlreadyLoaded(parentModule, 'CoreModule');
  }
}
