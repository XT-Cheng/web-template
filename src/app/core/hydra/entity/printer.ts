export class Printer {
    name: string;
    description: string;

    get display(): string {
        return `${this.description}`;
    }
}