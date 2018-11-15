import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of as observableOf } from 'rxjs';
import { filter } from 'rxjs/operators';

import { AuthToken } from './authToken';
import { TokenStorage } from './tokenStorage';

/**
 * Service that allows you to manage authentication token - get, set, clear and also listen to token changes over time.
 */
@Injectable()
export class TokenService {

  protected token$: BehaviorSubject<AuthToken> = new BehaviorSubject(null);

  constructor(protected tokenStorage: TokenStorage) {
    this.publishStoredToken();
  }

  /**
   *  Publishes token when it changes.
   */
  tokenChange(): Observable<AuthToken> {
    return this.token$
      .pipe(
        filter(value => !!value)
      );
  }

  /**
   * Sets a token into the storage. This method is used by the NbAuthService automatically.
   * @param token Token to be set
   *
   */
  set(token: AuthToken): Observable<null> {
    this.tokenStorage.set(token);
    this.publishStoredToken();
    return observableOf(null);
  }

  /**
  * Sets a raw token into the storage. This method is used by the NbAuthService automatically.
  * @param token Raw token to be set
  *
  */
  setRaw(token: string): Observable<null> {
    this.tokenStorage.setRaw(token);
    this.publishStoredToken();
    return observableOf(null);
  }

  /**
   * Returns observable of current token
   */
  get(): Observable<AuthToken> {
    const token = this.tokenStorage.get();
    return observableOf(token);
  }

  /**
   * Removes the token and published token value
   *
   */
  clear(): Observable<null> {
    this.tokenStorage.clear();
    this.publishStoredToken();
    return observableOf(null);
  }

  protected publishStoredToken() {
    this.token$.next(this.tokenStorage.get());
  }
}
