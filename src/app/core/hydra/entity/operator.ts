export class Operator {
  badge: string;
  firstName: string;
  lastName: string;
  get display(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
