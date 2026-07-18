import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import OverflowMenu from './OverflowMenu';

afterEach(cleanup);

describe('OverflowMenu', () => {
  it('supports keyboard opening, navigation, selection, and focus restoration', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <OverflowMenu
        items={[
          { label: 'View', onSelect },
          { label: 'Edit', onSelect: vi.fn() },
          { label: 'Delete', onSelect: vi.fn() },
        ]}
      />,
    );

    const trigger = screen.getByRole('button', { name: 'More actions' });
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'View' })).toHaveFocus());

    await user.keyboard('{End}');
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('menuitem', { name: 'View' })).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(trigger).toHaveFocus();

    await user.keyboard('{Enter}');
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'View' })).toHaveFocus());
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens on the last item with ArrowUp', async () => {
    const user = userEvent.setup();
    render(
      <OverflowMenu
        items={[
          { label: 'First', onSelect: vi.fn() },
          { label: 'Last', onSelect: vi.fn() },
        ]}
      />,
    );
    screen.getByRole('button', { name: 'More actions' }).focus();
    await user.keyboard('{ArrowUp}');
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Last' })).toHaveFocus());
  });
});
