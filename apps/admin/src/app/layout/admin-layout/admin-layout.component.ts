import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent],
  template: `
    <div class="admin-layout">
      <app-sidebar
        [mobileOpen]="sidebarOpen()"
        (closeMobile)="closeSidebar()"
      />

      <div class="admin-layout__main">
        <app-header
          [title]="pageTitle()"
          [subtitle]="pageSubtitle()"
          (toggleSidebar)="toggleSidebar()"
        />

        <main class="admin-layout__content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly sidebarOpen = signal(false);

  readonly pageTitle = signal('Dashboard');
  readonly pageSubtitle = signal('Overview of your tournament platform');

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.syncPageMeta();
        this.closeSidebar();
      });
  }

  private syncPageMeta(): void {
    const data = this.getDeepestRouteData();
    this.pageTitle.set((data['title'] as string) ?? 'Dashboard');
    this.pageSubtitle.set((data['subtitle'] as string) ?? '');
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  private getDeepestRouteData(): Record<string, unknown> {
    let current = this.route.snapshot?.routeConfig ? this.route : null;
    if (!current) {
      return {};
    }

    while (current.firstChild) {
      current = current.firstChild;
    }

    const merged: Record<string, unknown> = {};
    let node: ActivatedRoute | null = current;
    while (node?.snapshot) {
      Object.assign(merged, node.snapshot.data);
      node = node.parent;
    }
    return merged;
  }
}
