import { Component, Input, EventEmitter, Output, ViewChild, ElementRef, OnInit, AfterViewInit } from '@angular/core';
import { FormGroup, ControlContainer } from '@angular/forms';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { NzSelectComponent } from 'ng-zorro-antd';

@Component({
  selector: 'fw-mobile-search',
  templateUrl: 'search.component.html',
  styleUrls: ['./search.component.scss']
})
export class MobileSearchComponent implements OnInit, AfterViewInit {
  static DEBOUCETIME = 500;
  @ViewChild(NzSelectComponent) selectComp: NzSelectComponent;
  inputFormGroup: FormGroup;
  searchChange$ = new BehaviorSubject('');
  isLoading = false;
  optionList = [];

  constructor(private controlContainer: ControlContainer) { }

  @Input()
  autoFocus: boolean;
  @Input()
  controlName: string;
  @Input()
  placeHolder: string;
  @Input()
  searchHandler: () => Observable<any>;
  @Output() resetClicked = new EventEmitter<any>();
  @Output() operatorSetupClicked = new EventEmitter<any>();

  ngOnInit() {
    this.inputFormGroup = <FormGroup>this.controlContainer.control;

    this.searchChange$.asObservable().pipe(debounceTime(MobileSearchComponent.DEBOUCETIME)).pipe(
      switchMap(this.searchHandler)).subscribe(data => {
        this.optionList = data;
        this.isLoading = false;
      });
  }

  onSearch(value: string): void {
    this.isLoading = true;
    this.searchChange$.next(value);
  }

  ngAfterViewInit(): void {
    if (this.autoFocus) {
      this.selectComp.focus();
    }
  }
}
