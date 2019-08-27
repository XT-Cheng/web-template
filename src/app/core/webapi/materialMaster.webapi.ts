import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { MaterialMaster } from "@core/hydra/entity/materialMaster";
import { map } from "rxjs/operators";

@Injectable()
export class MaterialMasterWebApi {
    constructor(protected _http: HttpClient) {
    }

    public getPartMaster(materialName: string): Observable<MaterialMaster> {
        return this._http.get(`/api/partMasterService/material/${materialName}`).pipe(
            map((partMaster: any) => {
                if (!partMaster) {
                    throw Error(`${materialName} not exist!`);
                }

                return MaterialMasterWebApi.translate(partMaster);
            })
        )
    }

    public static translate(partMaster: any): MaterialMaster {
        let ret = new MaterialMaster();

        ret.name = partMaster.PartName;
        ret.standardPackageQty = partMaster.StdPackageQty;
        ret.unit = partMaster.Unit;
        ret.materialType = partMaster.MaterialType;
        ret.mrpGroup = partMaster.MrpGroup;
        ret.isComponent = partMaster.IsComponent;
        ret.tagTypeName = partMaster.TagTypeName;

        return ret;
    }
}