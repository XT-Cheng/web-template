import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { environment } from '@env/environment';
// layout
import { LayoutDefaultComponent } from '../layout/default/default.component';
import { LayoutPassportComponent } from '../layout/passport/passport.component';
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
import { BatchGeneralComponent } from './report/batch/batch.general.component';
import { ImportBapiComponent } from './import/import.bapi.exec.component';
import { CreateBatchComponent } from './mobile/material/create-batch.component';
import { MoveBatchComponent } from './mobile/material/move-batch.component';
import { SplitBatchComponent } from './mobile/material/split-batch.component';
import { MoveBatchTo914Component } from './mobile/material/move-batch-914.component';
import { MoveBatchToSAPComponent } from './mobile/material/move-batch-sap.component';
import { AdjustBatchQuantityComponent } from './mobile/material/adjust-batch-quantity.component';
import { LogonBatchComponent } from './mobile/material/logon-batch.component';
import { FindBatchComponent } from './mobile/material/find-batch.component';
import { BatchTraceabilityComponent } from './report/batch/batch.trace.component';
import { LogonOperationComponent } from './mobile/operation/logon-operation.component';
import { GenerateOutputBatchComponent } from './mobile/operation/generateOutputBatch-operation.component';
import { LogoffBatchComponent } from './mobile/material/logoff-batch.component';
import { ReplenishBatchComponent } from './mobile/material/replenish-batch.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutDefaultComponent,
    children: [
      { path: '', redirectTo: 'dashboard/lineGeneral', pathMatch: 'full' },
      { path: 'dashboard/lineGeneral/:machineName', component: MachineSummaryComponent, data: { title: '产线概览' } },
      { path: 'bapi/test', component: BAPITestComponent, data: { title: 'BAPI 测试' } },
      { path: 'import/buffer', component: ImportBufferComponent, data: { title: '导入 Material Buffer' } },
      { path: 'import/bapi', component: ImportBapiComponent, data: { title: 'BAPI 批量执行' } },
      { path: 'reports/batchSummary', component: BatchGeneralComponent, data: { title: '物料批次概览' } },
      { path: 'reports/batchTrace', component: BatchTraceabilityComponent, data: { title: '物料批次追溯' } },
      { path: 'material/create', component: CreateBatchComponent },
      { path: 'material/move', component: MoveBatchComponent },
      { path: 'material/moveTo914', component: MoveBatchTo914Component },
      { path: 'material/moveToSAP', component: MoveBatchToSAPComponent },
      { path: 'material/split', component: SplitBatchComponent },
      { path: 'material/adjustQty', component: AdjustBatchQuantityComponent },
      { path: 'material/logon', component: LogonBatchComponent },
      { path: 'material/logoff', component: LogoffBatchComponent },
      { path: 'material/replenish', component: ReplenishBatchComponent },
      { path: 'operation/logon', component: LogonOperationComponent },
      { path: 'operation/generateOutputBatch', component: GenerateOutputBatchComponent },
      { path: 'material/find', component: FindBatchComponent },
      // 业务子模块
      // { path: 'widgets', loadChildren: './widgets/widgets.module#WidgetsModule' }
    ]
  },
  // 全屏布局
  // {
  //     path: 'fullscreen',
  //     component: LayoutFullScreenComponent,
  //     children: [
  //     ]
  // },
  // passport
  {
    path: 'passport',
    component: LayoutPassportComponent,
    children: [
      { path: 'login', component: UserLoginComponent, data: { title: '登录' } },
      { path: 'register', component: UserRegisterComponent, data: { title: '注册' } },
      { path: 'register-result', component: UserRegisterResultComponent, data: { title: '注册结果' } }
    ]
  },
  // 单页不包裹Layout
  { path: 'callback/:type', component: CallbackComponent },
  { path: 'lock', component: UserLockComponent, data: { title: '锁屏' } },
  { path: '403', component: Exception403Component },
  { path: '404', component: Exception404Component },
  { path: '500', component: Exception500Component },
  { path: '**', redirectTo: 'dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: environment.useHash })],
  exports: [RouterModule]
})
export class RouteRoutingModule { }
