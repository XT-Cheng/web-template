import { NgModule } from '@angular/core';

import { SharedModule } from '@shared/shared.module';
import { RouteRoutingModule } from './routes-routing.module';
// passport pages
import { UserLoginComponent } from './passport/login/login.component';
import { UserRegisterComponent } from './passport/register/register.component';
import { UserRegisterResultComponent } from './passport/register-result/register-result.component';
// single pages
import { CallbackComponent } from './callback/callback.component';
import { UserLockComponent } from './passport/lock/lock.component';
import { Exception403Component } from './exception/403.component';
import { Exception404Component } from './exception/404.component';
import { Exception500Component } from './exception/500.component';
import { BAPITestComponent } from './bapi/bapi.test.component';
import { ImportBufferComponent } from './import/import.buffer.component';
import { MachineSummaryComponent } from './dashboard/machine.summary.component';
import { DelonChartModule } from '@delon/chart';
import { ImportPersonComponent } from './import/import.person.component';
import { BatchGeneralComponent } from './report/batch/batch.general.component';
import { ScrapPerHourComponent } from './dashboard/widget/scrapPerHour.component';
import { OutputPerHourComponent } from './dashboard/widget/outputPerHour.component';
import { MaterialPreparationComponent } from './dashboard/widget/materialPreparation.component';
import { NextOperationsComponent } from './dashboard/widget/nextOperations.component';
import { ImportBapiComponent } from './import/import.bapi.exec.component';
import { CheckListOfShiftChangeComponent } from './dashboard/widget/checkListOfShiftChange.component';
import { CheckListOfChangeOverComponent } from './dashboard/widget/checkListOfChangeOver.component';
import { CreateBatchComponent } from './mobile/material/create-batch.component';
import { WeUiModule } from 'ngx-weui';
import { MoveBatchComponent } from './mobile/material/move-batch.component';
import { SplitBatchComponent } from './mobile/material/split-batch.component';
import { MoveBatchTo914Component } from './mobile/material/move-batch-914.component';
import { MoveBatchToSAPComponent } from './mobile/material/move-batch-sap.component';
import { AdjustBatchQuantityComponent } from './mobile/material/adjust-batch-quantity.component';
import { LogonBatchComponent } from './mobile/material/logon-batch.component';
import { MobileBottomComponent } from './mobile/bottom.component';
import { FindBatchComponent } from './mobile/material/find-batch.component';
import { BatchTraceabilityComponent } from './report/batch/batch.trace.component';
import { ToolPreparationComponent } from './dashboard/widget/toolPreparation.component';
import { MobileComponentStatusComponent } from './mobile/component.status.component';
import { LogonOperationComponent } from './mobile/operation/logon-operation.component';
import { MobileOperationListComponent } from './mobile/operation.list.component';
import { GenerateOutputBatchComponent } from './mobile/operation/generateOutputBatch-operation.component';
import { LogoffBatchComponent } from './mobile/material/logoff-batch.component';
import { MobileComponentListComponent } from './mobile/component.list.component';
import { ReplenishBatchComponent } from './mobile/material/replenish-batch.component';
import { LogonToolComponent } from './mobile/tool/logon-tool.component';
import { MobileToolStatusComponent } from './mobile/tool.status.component';
import { LogoffToolComponent } from './mobile/tool/logoff-tool.component';
import { InterruptOperationComponent } from './mobile/operation/interrupt-operation.component';
import { LogoffOperationComponent } from './mobile/operation/logoff-operation.component';
import { ResetToolMaintenanceComponent } from './mobile/tool/reset-tool-maintenance.component';
import { MobileOperatorListComponent } from './mobile/operator.list.component';
import { LogonOperatorComponent } from './mobile/operator/logon-operator.component';
import { LogoffOperatorComponent } from './mobile/operator/logoff-operator.component';
import { ChangeMachineStatusComponent } from './mobile/machine/change-machine-status.component';
import { CombineBatchComponent } from './mobile/material/combine-batch.component';
import { MaterialFunctionsComponent } from './mobile/material/material-functions.component';
import { OperationFunctionsComponent } from './mobile/operation/operation-functions.component';
import { OperatorFunctionsComponent } from './mobile/operator/operator-functions.component';
import { MachineFunctionsComponent } from './mobile/machine/machine-functions.component';
import { ToolFunctionsComponent } from './mobile/tool/tool-functions.component';
import { ReprintBatchComponent } from './mobile/material/reprint-batch.component';
import { MobileBatchListComponent } from './mobile/batch.list.component';
import { PackingComponent } from './mobile/operation/packing.component';

const BAPI = [
  BAPITestComponent
];

const REPORT = [
  BatchGeneralComponent,
  BatchTraceabilityComponent
];

const IMPORT = [
  ImportBufferComponent,
  ImportPersonComponent,
  ImportBapiComponent,
];

const COMPONENTS = [
  MachineSummaryComponent,
  ScrapPerHourComponent,
  OutputPerHourComponent,
  MaterialPreparationComponent,
  NextOperationsComponent,
  CheckListOfShiftChangeComponent,
  CheckListOfChangeOverComponent,
  ToolPreparationComponent,
  // passport pages
  UserLoginComponent,
  UserRegisterComponent,
  UserRegisterResultComponent,
  // single pages
  CallbackComponent,
  UserLockComponent,
  Exception403Component,
  Exception404Component,
  Exception500Component,
  // Mobile
  MobileBottomComponent,
  MobileComponentStatusComponent,
  MobileOperationListComponent,
  MobileComponentListComponent,
  MobileToolStatusComponent,
  MobileOperatorListComponent,
  MobileBatchListComponent,
  // Material
  MaterialFunctionsComponent,
  CreateBatchComponent,
  FindBatchComponent,
  MoveBatchComponent,
  SplitBatchComponent,
  MoveBatchTo914Component,
  MoveBatchToSAPComponent,
  AdjustBatchQuantityComponent,
  LogonBatchComponent,
  LogoffBatchComponent,
  ReplenishBatchComponent,
  CombineBatchComponent,
  ReprintBatchComponent,
  // Opeartion
  LogonOperationComponent,
  GenerateOutputBatchComponent,
  InterruptOperationComponent,
  LogoffOperationComponent,
  OperationFunctionsComponent,
  PackingComponent,
  // Tool
  LogonToolComponent,
  LogoffToolComponent,
  ResetToolMaintenanceComponent,
  ToolFunctionsComponent,
  // Operator
  LogonOperatorComponent,
  LogoffOperatorComponent,
  OperatorFunctionsComponent,
  // Machine
  ChangeMachineStatusComponent,
  MachineFunctionsComponent,
];
const COMPONENTS_NOROUNT = [];

@NgModule({
  imports: [
    SharedModule,
    RouteRoutingModule,
    WeUiModule,
    DelonChartModule,
  ],
  declarations: [
    ...COMPONENTS,
    ...COMPONENTS_NOROUNT,
    ...BAPI,
    ...IMPORT,
    ...REPORT
  ],
  entryComponents: COMPONENTS_NOROUNT
})
export class RoutesModule { }
