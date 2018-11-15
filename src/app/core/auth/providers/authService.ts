import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { getDeepFromObject } from '@core/utils/helpers';
import { Observable, of as observableOf } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { AuthConfig } from './authConfig';
import { AuthResult } from './authResult';
import { AuthToken } from './authToken';
import { TokenService } from './tokenService';
import { TokenStorage } from './tokenStorage';

@Injectable()
export class AuthService {
  constructor(protected http: HttpClient,
    protected tokenService: TokenService,
    protected authConfig: AuthConfig) {
  }

  /**
   * Retrieves current authenticated token stored
   */
  getToken(): Observable<AuthToken> {
    return this.tokenService.get();
  }

  /**
   * Returns true if auth token is presented in the token storage
   */
  isAuthenticated(): Observable<boolean> {
    return this.getToken()
      .pipe(map((token: AuthToken) => token.isValid()));
  }

  /**
   * Returns tokens stream
   */
  onTokenChange(): Observable<AuthToken> {
    return this.tokenService.tokenChange();
  }

  /**
   * Returns authentication status stream
   */
  onAuthenticationChange(): Observable<boolean> {
    return this.onTokenChange()
      .pipe(map((token: AuthToken) => token.isValid()));
  }

  authenticate(data?: any): Observable<AuthResult> {
    return this.http.request(this.authConfig.auth_method, this.authConfig.auth_url, { body: data, observe: 'response' })
      .pipe(
        this.validateToken(),
        map((res: HttpResponse<Object>) => {
          return new AuthResult(
            true,
            res,
            this.authConfig.auth_success_redirect,
            [],
            getDeepFromObject(res.body,
              this.authConfig.auth_message_key,
              'You have been successfully logged in.'),
            getDeepFromObject(res.body,
              TokenStorage.TOKEN_KEY));
        }),
        switchMap((ret: AuthResult) => {
          return this.processResultToken(ret);
        }),
        catchError((res: any) => {
          let errors = [];
          if (res instanceof HttpErrorResponse) {
            errors = getDeepFromObject(res.error,
              this.authConfig.auth_error_key,
              'Login/Email combination is not correct, please try again.');
          } else {
            errors.push('Something went wrong.');
          }

          return observableOf(
            new AuthResult(
              false,
              res,
              this.authConfig.auth_fail_redirect,
              errors,
            ));
        }),
      );
  }

  protected validateToken(): any {
    return map((res: HttpResponse<Object>) => {
      const token = getDeepFromObject(res.body, TokenStorage.TOKEN_KEY);
      if (!token) {
        throw new Error('Could not extract token from the response.');
      }
      return res;
    });
  }

  private processResultToken(result: AuthResult) {
    if (result.isSuccess() && result.getRawToken()) {
      return this.tokenService.setRaw(result.getRawToken())
        .pipe(
          switchMap(() => this.tokenService.get()),
          map((token: AuthToken) => {
            result.setToken(token);
            return result;
          }),
        );
    }

    return observableOf(result);
  }
}
