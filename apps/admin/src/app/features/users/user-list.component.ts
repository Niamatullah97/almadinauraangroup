import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { ApiService } from '../../core/services/api.service';

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  role: { slug: string; name: string };
  createdAt: string;
}

interface UserListResponse {
  items: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [DatePipe],
  template: `
    <section class="users-page">
      @if (loading()) {
        <p class="state-message">Loading users...</p>
      } @else if (error()) {
        <p class="state-message state-message--error">{{ error() }}</p>
      } @else if (users().length === 0) {
        <p class="state-message">No users found.</p>
      } @else {
        <div class="table-card">
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr>
                  <td>{{ user.firstName }} {{ user.lastName }}</td>
                  <td>{{ user.email }}</td>
                  <td>{{ user.role.name }}</td>
                  <td>{{ user.status }}</td>
                  <td>{{ user.createdAt | date: 'mediumDate' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .users-page {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .state-message {
        padding: 1.5rem;
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        color: #64748b;
      }

      .state-message--error {
        color: #dc2626;
      }

      .table-card {
        overflow-x: auto;
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
      }

      .data-table {
        width: 100%;
        border-collapse: collapse;
      }

      .data-table th,
      .data-table td {
        padding: 0.875rem 1rem;
        text-align: left;
        border-bottom: 1px solid #f1f5f9;
      }

      .data-table th {
        font-size: 0.8125rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: #64748b;
      }
    `,
  ],
})
export class UserListComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly users = signal<AdminUser[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.api.get<UserListResponse>('/users', { page: 1, limit: 50 }).subscribe({
      next: (response) => {
        this.users.set(response.data?.items ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load users.');
        this.loading.set(false);
      },
    });
  }
}
