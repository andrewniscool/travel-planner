import { useRef } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Modal from './Modal';

afterEach(cleanup);

describe('Modal', () => {
  it('provides accessible dialog semantics and closes with Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Modal isOpen onClose={onClose} title="Plan a day" description="Add an activity"><button>Save</button></Modal>);
    expect(screen.getByRole('dialog', { name: 'Plan a day' })).toHaveAccessibleDescription('Add an activity');
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('traps focus and restores it to the opener', async () => {
    const user = userEvent.setup();
    const View = ({ open }: { open: boolean }) => {
      const opener = useRef<HTMLButtonElement>(null);
      return <><button ref={opener}>Open</button><Modal isOpen={open} onClose={() => undefined} title="Dialog"><button>First</button><button>Last</button></Modal></>;
    };
    const { rerender } = render(<View open={false} />);
    const opener = screen.getByRole('button', { name: 'Open' });
    opener.focus();
    rerender(<View open />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus());
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(screen.getByRole('button', { name: 'Last' })).toHaveFocus();
    rerender(<View open={false} />);
    expect(opener).toHaveFocus();
  });

  it('respects disabled backdrop and Escape dismissal', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Modal isOpen onClose={onClose} title="Saving" closeOnBackdrop={false} closeOnEscape={false}>Working</Modal>);
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('dialog').parentElement!.parentElement!);
    expect(onClose).not.toHaveBeenCalled();
  });
});
