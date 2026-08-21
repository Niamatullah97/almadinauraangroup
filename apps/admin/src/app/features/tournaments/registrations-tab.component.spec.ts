import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RegistrationPaymentStatus, TournamentStatus } from '@kabootar/shared';

import { RegistrationsTabComponent } from './registrations-tab.component';
import { RegistrationService } from '../registrations/registration.service';
import { ParticipantService } from '../participants/participant.service';

describe('RegistrationsTabComponent', () => {
  let fixture: ComponentFixture<RegistrationsTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrationsTabComponent],
      providers: [
        {
          provide: RegistrationService,
          useValue: {
            list: jasmine.createSpy('list').and.returnValue(
              of({ items: [], total: 0, page: 1, limit: 100, totalPages: 0 }),
            ),
            create: jasmine.createSpy('create'),
            update: jasmine.createSpy('update'),
            delete: jasmine.createSpy('delete'),
            recordPayment: jasmine.createSpy('recordPayment'),
            getById: jasmine.createSpy('getById'),
          },
        },
        {
          provide: ParticipantService,
          useValue: {
            list: jasmine.createSpy('list').and.returnValue(
              of({ items: [], total: 0, page: 1, limit: 100, totalPages: 0 }),
            ),
            resolveProfileUrl: (profileImage: string | null | undefined) => profileImage ?? null,
            getInitials: () => 'AK',
            uploadProfile: jasmine.createSpy('uploadProfile'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrationsTabComponent);
    fixture.componentRef.setInput('tournament', {
      id: 'tournament-1',
      title: 'Classic',
      slug: 'classic',
      description: null,
      city: 'Lahore',
      entryFee: 500,
      totalPigeonsAllowed: 100,
      doubleStampEnabled: false,
      startDate: '2026-04-01',
      endDate: '2026-04-05',
      startTime: '08:00',
      endTime: '18:00',
      status: TournamentStatus.ACTIVE,
      bannerImage: null,
      createdBy: 'user-1',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should allow management for active tournaments', () => {
    expect(fixture.componentInstance.canManage()).toBeTrue();
  });

  it('shows Active status for admin-added participants', () => {
    fixture.componentInstance.registrations.set([
      {
        id: 'registration-1',
        tournamentId: 'tournament-1',
        participantId: 'participant-1',
        pigeonCount: 11,
        entryFeePerPigeon: 500,
        totalFee: 5500,
        paidAmount: 5500,
        paymentStatus: RegistrationPaymentStatus.PAID,
        receiptNumber: 'RCP-2026-000001',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        participant: {
          id: 'participant-1',
          tournamentId: 'tournament-1',
          name: 'Naimatullah',
          fatherName: 'Test',
          phone: '+923001234567',
          city: 'Lahore',
          address: null,
          loftName: 'Niamat-1',
          profileImage: null,
        },
      },
    ]);
    fixture.componentInstance.loading.set(false);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Active');
    expect(fixture.nativeElement.textContent).not.toContain('Pigeons');
    expect(fixture.nativeElement.textContent).not.toContain('Total fee');
    expect(fixture.nativeElement.textContent).not.toContain('Paid');
  });

  it('shows a person icon when the participant has no profile image', () => {
    fixture.componentInstance.registrations.set([registrationFixture({ profileImage: null })]);
    fixture.componentInstance.loading.set(false);
    fixture.detectChanges();

    const placeholder = fixture.nativeElement.querySelector('.participant-cell__avatar--placeholder');
    expect(placeholder).toBeTruthy();
    expect(fixture.nativeElement.querySelector('img.participant-cell__avatar')).toBeNull();
  });

  it('shows the profile image preview when one is uploaded', () => {
    fixture.componentInstance.registrations.set([
      registrationFixture({ profileImage: '/uploads/participants/niamat.jpg' }),
    ]);
    fixture.componentInstance.loading.set(false);
    fixture.detectChanges();

    const image = fixture.nativeElement.querySelector('img.participant-cell__avatar') as HTMLImageElement;
    expect(image).toBeTruthy();
    expect(image.src).toContain('/uploads/participants/niamat.jpg');
    expect(fixture.nativeElement.querySelector('.participant-cell__avatar--placeholder')).toBeNull();
  });
});

function registrationFixture(participantOverrides: { profileImage: string | null }) {
  return {
    id: 'registration-1',
    tournamentId: 'tournament-1',
    participantId: 'participant-1',
    pigeonCount: 11,
    entryFeePerPigeon: 500,
    totalFee: 5500,
    paidAmount: 5500,
    paymentStatus: RegistrationPaymentStatus.PAID,
    receiptNumber: 'RCP-2026-000001',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    participant: {
      id: 'participant-1',
      tournamentId: 'tournament-1',
      name: 'Naimatullah',
      fatherName: 'Test',
      phone: '+923001234567',
      city: 'Lahore',
      address: null,
      loftName: 'Niamat-1',
      ...participantOverrides,
    },
  };
}
