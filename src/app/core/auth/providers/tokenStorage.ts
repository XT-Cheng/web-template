import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';

import { AuthToken } from './authToken';

@Injectable()
export class TokenStorage {
    public static TOKEN_KEY = 'auth_app_token';
    private _value: AuthToken;

    constructor(private _storage: Storage) {
    }

    get(): AuthToken {
       return this._value;
    }

    set(token: AuthToken): void {
        this._value = token;
        this._storage.set(TokenStorage.TOKEN_KEY, token.toString());
    }

    setRaw(token: string) {
        this._value = new AuthToken(token);
        this._storage.set(TokenStorage.TOKEN_KEY, token);
    }

    clear(): void {
        this._value = null;
        this._storage.remove(TokenStorage.TOKEN_KEY);
    }
}
