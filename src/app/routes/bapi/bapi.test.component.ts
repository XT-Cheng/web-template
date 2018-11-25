import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { BapiService } from '@core/hydra/bapi.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-bapi-test',
  templateUrl: './bapi.test.component.html',
  styleUrls: ['./bapi.test.component.less']
})
export class BAPITestComponent {
  //#region Protected members

  protected bapiTestForm: FormGroup;
  protected isExecuting = false;

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
    // this._bapiService.test(value.type, value.dialog).pipe(finalize(() => {
    //   this.isExecuting = false;
    // })).subscribe((res) => {
    //   this.bapiTestForm.controls[`result`].setValue(res);
    // }, (err) => {
    //   this.bapiTestForm.controls[`result`].setValue(err);
    // });
    // this._bapiService.createMPLBuffer(`import-test8`, `import-test`, `F`, '0916', 'Comp', '', '', 0).pipe(finalize(() => {
    //   this.isExecuting = false;
    // })).subscribe((res) => {
    //   this.bapiTestForm.controls[`result`].setValue(res.content);
    // }, (err) => {
    //   this.bapiTestForm.controls[`result`].setValue(err);
    // });
    this._bapiService.deleteMPLBuffer(`import-test`).pipe(finalize(() => {
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
