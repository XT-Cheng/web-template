import { Component, Input, EventEmitter, Output, ViewChild, ElementRef, OnInit } from '@angular/core';
import { FormGroup, ControlContainer } from '@angular/forms';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';

@Component({
  selector: 'fw-mobile-list',
  templateUrl: 'list.component.html',
  styleUrls: ['./list.component.scss']
})
export class MobileListComponent {
  @Input()
  data$: Observable<any>;
  constructor(private controlContainer: ControlContainer) { }
  @Input()
  description: string;
  @Input()
  title: string;

  getItemDescription(item): string {
    return item[this.description];
  }

  getItemTitle(item): string {
    return item[this.title];
  }
}
