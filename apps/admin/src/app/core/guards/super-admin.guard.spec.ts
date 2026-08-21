import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';

import { superAdminGuard } from './super-admin.guard';
import { AuthService } from '../services/auth.service';

describe('superAdminGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authService = jasmine.createSpyObj('AuthService', [
      'isAuthenticated',
      'isSuperAdmin',
      'logout',
    ]);
    router = jasmine.createSpyObj('Router', ['createUrlTree']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('allows Super Admin', () => {
    authService.isAuthenticated.and.returnValue(true);
    authService.isSuperAdmin.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      superAdminGuard({} as never, {} as never),
    );

    expect(result).toBeTrue();
  });

  it('clears the session and redirects other roles', () => {
    authService.isAuthenticated.and.returnValue(true);
    authService.isSuperAdmin.and.returnValue(false);
    const urlTree = {} as UrlTree;
    router.createUrlTree.and.returnValue(urlTree);

    const result = TestBed.runInInjectionContext(() =>
      superAdminGuard({} as never, {} as never),
    );

    expect(authService.logout).toHaveBeenCalledWith(false);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
    expect(result).toBe(urlTree);
  });
});
