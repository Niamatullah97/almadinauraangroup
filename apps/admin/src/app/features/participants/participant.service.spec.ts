import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ParticipantService } from './participant.service';
import { ApiService } from '../../core/services/api.service';

describe('ParticipantService', () => {
  let service: ParticipantService;
  let api: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj('ApiService', ['get', 'post', 'patch', 'delete', 'upload']);

    TestBed.configureTestingModule({
      providers: [ParticipantService, { provide: ApiService, useValue: api }],
    });

    service = TestBed.inject(ParticipantService);
  });

  it('loads participants with query params', () => {
    api.get.and.returnValue(
      of({
        success: true,
        message: 'OK',
        data: { items: [], total: 0, page: 1, limit: 9, totalPages: 0 },
      }),
    );

    service.list({ page: 1, search: 'Ahmed' }).subscribe((result) => {
      expect(result.total).toBe(0);
    });
  });

  it('creates a participant', () => {
    api.post.and.returnValue(
      of({
        success: true,
        message: 'OK',
        data: { id: '1', name: 'Ahmed Khan' },
      }),
    );

    service
      .create({
        tournamentId: 'tournament-1',
        name: 'Ahmed Khan',
        fatherName: 'Muhammad Khan',
        phone: '+923001234567',
        city: 'Lahore',
        loftName: 'Sky Loft',
      })
      .subscribe((result) => {
        expect(result.id).toBe('1');
      });
  });

  it('returns initials from name', () => {
    expect(service.getInitials('Ahmed Khan')).toBe('AK');
  });

  it('resolves relative profile image paths against the uploads host', () => {
    expect(service.resolveProfileUrl('/uploads/participants/profile.jpg')).toBe(
      'http://localhost:3000/uploads/participants/profile.jpg',
    );
  });

  it('handles delete errors', () => {
    api.delete.and.returnValue(throwError(() => new Error('fail')));

    service.delete('1').subscribe({
      error: (error) => expect(error).toBeTruthy(),
    });
  });
});
