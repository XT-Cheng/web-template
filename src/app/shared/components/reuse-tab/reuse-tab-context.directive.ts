import { Directive, HostListener, Input } from '@angular/core';

import { ReuseTabContextService } from './reuse-tab-context.service';
import { ReuseItem } from './reuse-tab.interfaces';

@Directive({
  selector: '[fwReuseTabContextMenu]',
})
export class ReuseTabContextDirective {
  @Input('fwReuseTabContextMenu') item: ReuseItem;

  constructor(private srv: ReuseTabContextService) { }

  @HostListener('contextmenu', ['$event'])
  onContextMenu(event: MouseEvent): void {
    this.srv.show.next({
      event,
      item: this.item,
    });
    event.preventDefault();
    event.stopPropagation();
  }
}
