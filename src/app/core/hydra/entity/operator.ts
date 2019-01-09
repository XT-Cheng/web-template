export class Operator {
  badge: string;
  firstName: string;
  lastName: string;
  display(): string {
    return `Name: ${this.firstName} ${this.lastName}`;
  }
}
