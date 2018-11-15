import { urlBase64Decode } from '@core/utils/helpers';

export class AuthToken {

  constructor(readonly token: string) {
  }

  /**
   * Returns payload object
   * @returns any
   */
  getPayload(): any {

    if (!this.token) {
      throw new Error('Cannot extract payload from an empty token.');
    }

    const parts = this.token.split('.');

    if (parts.length !== 3) {
      throw new Error(`The token ${this.token} is not valid JWT token and must consist of three parts.`);
    }

    let decoded;
    try {
      decoded = urlBase64Decode(parts[1]);
    } catch (e) {
      throw new Error(`The token ${this.token} is not valid JWT token and cannot be parsed.`);
    }

    if (!decoded) {
      throw new Error(`The token ${this.token} is not valid JWT token and cannot be decoded.`);
    }

    return JSON.parse(decoded);
  }

  /**
   * Returns expiration date
   * @returns Date
   */
  getTokenExpDate(): Date {
    const decoded = this.getPayload();
    if (!decoded.hasOwnProperty('exp')) {
      return null;
    }

    const date = new Date(0);
    date.setUTCSeconds(decoded.exp);

    return date;
  }

  /**
   * @returns Is data expired
   */
  isValid(): boolean {
    return !!this.token && (!this.getTokenExpDate() || new Date() < this.getTokenExpDate());
  }

  /**
 * Returns the token value
 * @returns string
 */
  getValue(): string {
    return this.token;
  }

  /**
 * @returns Validate value and convert to string, if value is not valid return empty string
 */
  toString(): string {
    return !!this.token ? this.token : '';
  }
}
