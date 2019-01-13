import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { BapiService } from '@core/hydra/service/bapi.service';
import { finalize } from 'rxjs/operators';
import { VBoardService } from '@core/hydra/service/vBoard.service';
import { HttpClient } from '@angular/common/http';
import { DialogTypeEnum } from '@core/hydra/bapi/constants';

@Component({
  selector: 'app-bapi-test',
  templateUrl: './bapi.test.component.html',
  styleUrls: ['./bapi.test.component.less']
})
export class BAPITestComponent {
  //#region Protected members

  public bapiTestForm: FormGroup;
  public isExecuting = false;
  public bapiTypes = Object.keys(DialogTypeEnum);

  //#endregion

  //#region Constructor

  constructor(private _fb: FormBuilder, private _bapiService: BapiService) {
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
    this._bapiService.test(value.type, value.dialog).pipe(finalize(() => {
      this.isExecuting = false;
    })).subscribe((res) => {
      this.bapiTestForm.controls[`result`].setValue(res.content);
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
