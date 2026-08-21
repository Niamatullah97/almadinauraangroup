import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideRouter([])],
    });
    service = TestBed.inject(AuthService);
  });

  it('should not be authenticated without token', () => {
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('should be authenticated with a valid token in storage', () => {
    const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
    localStorage.setItem('accessToken', `header.${payload}.signature`);
    expect(service.isAuthenticated()).toBeTrue();
  });

  it('should clear expired tokens', () => {
    const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 }));
    localStorage.setItem('accessToken', `header.${payload}.signature`);
    expect(service.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });
});
