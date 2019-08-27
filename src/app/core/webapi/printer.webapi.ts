import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Printer } from "@core/hydra/entity/printer";

@Injectable()
export class PrinterWebApi {
    constructor(protected _http: HttpClient) {
    }

    public getPrinters(): Observable<Printer[]> {
        return this._http.get(`/api/printerService/printers`).pipe(
            map((printers: []) => {
                return printers.map(printer => PrinterWebApi.translate(printer));
            })
        )
    }

    public static translate(printer: any): Printer {
        let ret = new Printer();

        ret.name = printer.PrinterName;
        ret.description = printer.Description;

        return ret;
    }
}