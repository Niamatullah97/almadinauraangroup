import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PigeonSex, TournamentStatus } from '@kabootar/shared';

import { RegistrationPigeonsPanelComponent } from './registration-pigeons-panel.component';
import { RegistrationPigeonService } from './registration-pigeon.service';

describe('RegistrationPigeonsPanelComponent', () => {
  let fixture: ComponentFixture<RegistrationPigeonsPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrationPigeonsPanelComponent],
      providers: [
        {
          provide: RegistrationPigeonService,
          useValue: {
            list: jasmine.createSpy('list').and.returnValue(
              of({ items: [], assignedCount: 3, registeredCount: 0, remainingCount: 3 }),
            ),
            create: jasmine.createSpy('create'),
            update: jasmine.createSpy('update'),
            delete: jasmine.createSpy('delete'),
            bulkGenerate: jasmine.createSpy('bulkGenerate'),
            toggleDoubleStamp: jasmine.createSpy('toggleDoubleStamp'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrationPigeonsPanelComponent);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('tournamentStatus', TournamentStatus.ACTIVE);
    fixture.componentRef.setInput('registration', {
      id: 'registration-1',
      tournamentId: 'tournament-1',
      participantId: 'participant-1',
      pigeonCount: 3,
      entryFeePerPigeon: 500,
      totalFee: 1500,
      paidAmount: 0,
      paymentStatus: 'PENDING',
      receiptNumber: 'RCP-2026-000001',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      participant: {
        id: 'participant-1',
        tournamentId: 'tournament-1',
        name: 'Ahmed Khan',
        fatherName: 'Muhammad Khan',
        phone: '+923001234567',
        city: 'Lahore',
        address: null,
        loftName: 'Sky Loft',
        profileImage: null,
      },
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should allow management for active tournaments', () => {
    expect(fixture.componentInstance.canManage()).toBeTrue();
  });
});
