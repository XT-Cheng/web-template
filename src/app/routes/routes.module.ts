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
import { BatchGeneralComponent } from './report/batch.general.component';

const BAPI = [
  BAPITestComponent
];

const REPORT = [
  BatchGeneralComponent
];

const IMPORT = [
  ImportBufferComponent,
  ImportPersonComponent
];

const COMPONENTS = [
  MachineSummaryComponent,
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
];
const COMPONENTS_NOROUNT = [];

@NgModule({
  imports: [
    SharedModule,
    RouteRoutingModule,
    DelonChartModule
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
