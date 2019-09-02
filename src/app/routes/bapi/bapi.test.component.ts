import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { DialogTypeEnum } from '@core/hydra/bapi/constants';
import { BapiWebApi } from '@core/webapi/bapi.webapi';

@Component({
  selector: 'app-bapi-test',
  templateUrl: './bapi.test.component.html',
  styleUrls: ['./bapi.test.component.less']
})
export class BAPITestComponent {
  //#region Protected members

  public bapiTestForm: FormGroup;
  public isExecuting = false;
  public bapiTypes = Object.values(DialogTypeEnum);

  //#endregion

  //#region Constructor

  constructor(private _fb: FormBuilder,
    private _bapiWebApi: BapiWebApi,
    // private _bapiService: BapiService
  ) {
    this.bapiTestForm = this._fb.group({
      type: ['', [Validators.required]],
      dialog: ['', [Validators.required]],
      result: ['']
    });
  }

  //#endregion

  //#region Public methods

  submitForm = ($event, value) => {
    $event.preventDefault();

    // tslint:disable-next-line:forin
    for (const key in this.bapiTestForm.controls) {
      this.bapiTestForm.controls[key].markAsDirty();
      this.bapiTestForm.controls[key].updateValueAndValidity();
    }
    this.bapiTestForm.controls['result'].reset();
    this.isExecuting = true;
    this._bapiWebApi.executeBapi(value.type, value.dialog).pipe(finalize(() => {
      this.isExecuting = false;
    })).subscribe((res: any) => {
      this.bapiTestForm.controls[`result`].setValue(res.LongDescription);
    }, (err) => {
      this.bapiTestForm.controls[`result`].setValue(err);
    });
  }

  resetForm(e: MouseEvent): void {
    e.preventDefault();
    this.bapiTestForm.reset();
    // tslint:disable-next-line:forin
    for (const key in this.bapiTestForm.controls) {
      this.bapiTestForm.controls[key].markAsPristine();
      this.bapiTestForm.controls[key].updateValueAndValidity();
    }
  }

  //#endregion
}
