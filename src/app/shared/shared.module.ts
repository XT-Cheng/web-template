import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
// delon
import { AlainThemeModule } from '@delon/theme';
import { DelonABCModule } from '@delon/abc';
import { DelonACLModule } from '@delon/acl';
import { DelonFormModule } from '@delon/form';
// i18n
import { TranslateModule } from '@ngx-translate/core';

// #region third libs
import { NgZorroAntdModule } from 'ng-zorro-antd';
import { CountdownModule } from 'ngx-countdown';
import { AutofocusDirective } from './directives/autofocus.directive';
import { ChartTrendComponent } from './components/chart/trend.component';
import { ChartCardComponent } from './components/chart/card.component';
import { ParetoComponent } from './components/chart/pareto.component';
import { ChartGaugeComponent } from './components/chart/gauge.component';
import { ChartBarLineComponent } from './components/chart/barLine.component';
import { ChartMiniAreaComponent } from './components/chart/miniArea.component';
import { ChartMiniProgressComponent } from './components/chart/miniProgress.component';
import { ChartMiniBarComponent } from './components/chart/miniBar.component';
const THIRDMODULES = [
  NgZorroAntdModule,
  CountdownModule
];
// #endregion

// #region your componets & directives
const CHART_COMPONENTS = [
  ChartTrendComponent,
  ParetoComponent,
  ChartGaugeComponent,
  ChartCardComponent,
  ChartBarLineComponent,
  ChartMiniAreaComponent,
  ChartMiniProgressComponent,
  ChartMiniBarComponent
];

const COMPONENTS = [];
const DIRECTIVES = [AutofocusDirective];
// #endregion

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule,
    AlainThemeModule.forChild(),
    DelonABCModule,
    DelonACLModule,
    DelonFormModule,
    // third libs
    ...THIRDMODULES
  ],
  declarations: [
    // your components
    ...CHART_COMPONENTS,
    ...COMPONENTS,
    ...DIRECTIVES
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    AlainThemeModule,
    DelonABCModule,
    DelonACLModule,
    DelonFormModule,
    // i18n
    TranslateModule,
    // third libs
    ...THIRDMODULES,
    // your components
    ...CHART_COMPONENTS,
    ...COMPONENTS,
    ...DIRECTIVES
  ]
})
export class SharedModule { }
