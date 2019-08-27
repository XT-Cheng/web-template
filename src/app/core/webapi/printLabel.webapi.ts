import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map } from "rxjs/operators";
import { SettingsService } from "@delon/theme";
import { Observable } from "rxjs";
import { environment } from "@env/environment";

@Injectable()
export class PrintLabelWebApi {
    constructor(protected _http: HttpClient, protected _settingService: SettingsService) {
    }

    public printLabel(licenseTags: string[], tagType: string, SAPBatch: string, dateCode: string): Observable<string[]> {
        return this._http.post(`${environment.PRINTER_SERVICE_URL}/api/printService/printLabel`, {
            LicenseTags: licenseTags,
            TagType: tagType,
            SAPBatch: SAPBatch,
            DateCode: dateCode,
            PrinterName: this._settingService.app.printer,
        }).pipe(
            map((ltsToPrint: string[]) => {
                return ltsToPrint;
            })
        )
    }
}