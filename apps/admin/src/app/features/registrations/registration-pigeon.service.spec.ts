import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { RegistrationPigeonService } from './registration-pigeon.service';
import { ApiService } from '../../core/services/api.service';

describe('RegistrationPigeonService', () => {
  let service: RegistrationPigeonService;
  let api: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj('ApiService', ['get', 'post', 'patch', 'delete']);
    TestBed.configureTestingModule({
      providers: [RegistrationPigeonService, { provide: ApiService, useValue: api }],
    });
    service = TestBed.inject(RegistrationPigeonService);
  });

  it('lists pigeons for a registration', (done) => {
    api.get.and.returnValue(
      of({
        success: true,
        message: 'OK',
        data: { items: [], assignedCount: 3, registeredCount: 0, remainingCount: 3 },
      }),
    );

    service.list('registration-1').subscribe((response) => {
      expect(response.remainingCount).toBe(3);
      done();
    });
  });

  it('bulk generates pigeons', (done) => {
    api.post.and.returnValue(
      of({
        success: true,
        message: 'OK',
        data: { created: [], assignedCount: 3, registeredCount: 3, remainingCount: 0 },
      }),
    );

    service.bulkGenerate('registration-1').subscribe((response) => {
      expect(response.remainingCount).toBe(0);
      done();
    });
  });
});
