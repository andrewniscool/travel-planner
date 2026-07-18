import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Sheet from './Sheet';

afterEach(cleanup);

describe('Sheet', () => {
  it('is accessible, traps focus, and closes with Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Sheet isOpen onClose={onClose} title="Place details" description="Restaurant"><button>Save</button><button>Add</button></Sheet>);
    expect(screen.getByRole('dialog', { name: 'Place details' })).toHaveAccessibleDescription('Restaurant');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Close details' })).toHaveFocus());
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(screen.getByRole('button', { name: 'Add' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('respects disabled Escape dismissal', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Sheet isOpen onClose={onClose} title="Working" closeOnEscape={false}>Saving</Sheet>);
    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
  });
});
