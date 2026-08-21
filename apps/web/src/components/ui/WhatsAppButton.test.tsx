import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { WhatsAppButton } from '@/components/ui/WhatsAppButton';

describe('WhatsAppButton', () => {
  it('renders link with WhatsApp label and encoded message', () => {
    render(<WhatsAppButton />);

    const link = screen.getByRole('link', { name: 'Contact us on WhatsApp' });
    expect(link).toHaveAttribute('href', expect.stringContaining('https://wa.me/923001234567'));
    expect(link).toHaveAttribute('href', expect.stringContaining(encodeURIComponent('Hello!')));
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByText('WhatsApp')).toBeInTheDocument();
  });
});
