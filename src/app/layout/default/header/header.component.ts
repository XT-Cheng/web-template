import { Component } from '@angular/core';
import { SettingsService } from '@delon/theme';
import { isMobile } from '@core/utils/helpers';
import { Router } from '@angular/router';
import { UtilityService } from '@core/utils/utility.service';

@Component({
  selector: 'layout-header',
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  searchToggleStatus: boolean;

  constructor(public settings: SettingsService, private _router: Router, private _utility: UtilityService) { }

  toggleCollapsedSidebar() {
    this.settings.setLayout('collapsed', !this.settings.layout.collapsed);
  }

  searchToggleChange() {
    this.searchToggleStatus = !this.searchToggleStatus;
  }

  isMobile() {
    return isMobile();
  }

  isUpLevelVisible() {
    if (this._utility.activeComponent && this._utility.activeComponent.upperLevel) return true;

    return false;
  }

  upLevel() {
    if (this._utility.activeComponent && this._utility.activeComponent.upperLevel) {
      this._router.navigateByUrl(this._utility.activeComponent.upperLevel);
    }
  }
}
