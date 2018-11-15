import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';

import { AuthService } from './providers/authService';
import { TokenService } from './providers/tokenService';
import { TokenStorage } from './providers/tokenStorage';
import { throwIfAlreadyLoaded } from '@core/module-import-guard';

const CORE_PROVIDERS = [
    AuthService,
    TokenService,
    TokenStorage
];

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: []
})
export class AuthModule {
    constructor(@Optional() @SkipSelf() parentModule: AuthModule) {
        throwIfAlreadyLoaded(parentModule, 'AuthModule');
    }

    static forRoot(): ModuleWithProviders {
        return <ModuleWithProviders>{
            ngModule: AuthModule,
            providers: [
                ...CORE_PROVIDERS,
            ],
        };
    }
}
