import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { trips } from '../data/trips';
import { TripWorkspaceProvider } from './TripWorkspaceProvider';
import { useTripWorkspace } from './useTripWorkspace';

vi.mock('./useServiceTrips', () => ({
  useServiceTrips: () => ({
    trips: null,
    isLoading: false,
    error: null,
    source: 'fallback',
  }),
}));

const WorkspaceHarness = () => {
  const { trips: availableTrips, deleteTrip } = useTripWorkspace();
  return (
    <div>
      <span>{availableTrips.map((trip) => trip.id).join(',')}</span>
      <button type="button" onClick={() => deleteTrip(trips[0].id)}>
        Delete mock
      </button>
    </div>
  );
};

const renderWorkspace = () =>
  render(
    <MemoryRouter>
      <TripWorkspaceProvider>
        <WorkspaceHarness />
      </TripWorkspaceProvider>
    </MemoryRouter>,
  );

describe('TripWorkspaceProvider', () => {
  beforeEach(() => window.localStorage.clear());

  it('keeps deleted mock trips hidden after remounting', async () => {
    const user = userEvent.setup();
    const firstRender = renderWorkspace();
    expect(screen.getByText(new RegExp(trips[0].id))).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete mock' }));
    expect(screen.queryByText(new RegExp(trips[0].id))).not.toBeInTheDocument();
    expect(
      JSON.parse(window.localStorage.getItem('travel-builder:hidden-mock-trips') ?? '[]'),
    ).toEqual([trips[0].id]);

    firstRender.unmount();
    renderWorkspace();
    expect(screen.queryByText(new RegExp(trips[0].id))).not.toBeInTheDocument();
  });
});
