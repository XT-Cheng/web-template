import { Injectable } from '@angular/core';
import { FetchService } from './fetch.service';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { MaterialMaster } from '../entity/materialMaster';
import { toNumber } from '@delon/util';

@Injectable()
export class MasterService {
  static materialNameTBR = '$materialName';

  //#region SQL
  static materialSql =
    `SELECT PACKAGE_UNIT_QTY AS PACKINGQTY FROM U_TE_MMLP_PRODUCT_MASTER WHERE PART_NUMBER = '${MasterService.materialNameTBR}'`;

  //#endregion

  //#region Private members

  //#endregion

  //#region Constructor

  constructor(protected _fetchService: FetchService) { }

  //#endregion

  //#region Public methods

  getMaterialMaster(materialName: string): Observable<MaterialMaster> {
    return this._fetchService.query(MasterService.materialSql.replace(MasterService.materialNameTBR, materialName)).pipe(
      map(mats => {
        if (mats.length === 0) return null;

        const material = new MaterialMaster();

        material.name = materialName;
        material.standardPackageQty = toNumber(mats[0].PACKINGQTY, 0);
        return material;
      })
    );
  }

  //#endregion
}
