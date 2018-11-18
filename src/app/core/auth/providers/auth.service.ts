import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { DA_SERVICE_TOKEN, DelonAuthConfig, TokenService } from '@delon/auth';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(protected http: HttpClient,
    @Inject(DA_SERVICE_TOKEN) private tokenService: TokenService,
    @Inject(DelonAuthConfig) private authConfig: DelonAuthConfig) {
  }

  authenticate(data?: any): Observable<any> {
    return this.http.post(this.authConfig.login_url, data)
      .pipe(
        this.validateToken(),
        map((res) => {
          this.tokenService.set({ token: res[this.authConfig.store_key] });
        })
      );
  }

  protected validateToken(): any {
    return map((res) => {
      const token = res[this.authConfig.store_key];
      if (!token) {
        throw new Error('Could not extract token from the response.');
      }
      return res;
    });
  }

}
