import { Component, Input, EventEmitter, Output, ViewChild, ElementRef, OnInit } from '@angular/core';
import { FormGroup, ControlContainer } from '@angular/forms';

@Component({
  selector: 'fw-mobile-bottom',
  templateUrl: 'bottom.component.html',
  styleUrls: ['./bottom.component.scss']
})
export class MobileBottomComponent implements OnInit {
  inputFormGroup: FormGroup;

  constructor(private controlContainer: ControlContainer) { }

  @ViewChild('badge', { read: ElementRef }) badgeElement: ElementRef;

  @Input()
  showBadgeButton: boolean;
  @Input()
  badgeButtonText: string;
  @Input()
  keyHandler: any;
  @Input()
  buttonType: string;
  @Output() resetClicked = new EventEmitter<any>();
  @Output() operatorSetupClicked = new EventEmitter<any>();

  ngOnInit() {
    this.inputFormGroup = <FormGroup>this.controlContainer.control;
  }

  operatorSetup() {
    setTimeout(() => {
      this.badgeElement.nativeElement.focus();
    });
    this.operatorSetupClicked.emit();
  }

  reset() {
    this.resetClicked.emit();
  }
}
