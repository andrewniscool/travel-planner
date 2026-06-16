import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LocationInput from './LocationInput';

const { autocompleteMock, getDetailsMock } = vi.hoisted(() => ({
  autocompleteMock: vi.fn(),
  getDetailsMock: vi.fn(),
}));

vi.mock('../../data/locationSuggestions', () => ({
  mockLocationSuggestions: [
    {
      id: 'mock-city-tokyo',
      name: 'Tokyo, Japan',
      formattedAddress: 'Tokyo, Japan',
      placeTypes: ['locality', 'political'],
      source: 'mock',
    },
  ],
}));

vi.mock('../../services/supabaseClient', () => ({
  isSupabaseConfigured: true,
}));

vi.mock('../../services/placesService', () => ({
  placesService: {
    autocomplete: autocompleteMock,
    getDetails: getDetailsMock,
  },
}));

describe('LocationInput', () => {
  beforeEach(() => {
    autocompleteMock.mockReset();
    getDetailsMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('creates a manual location while typing', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    autocompleteMock.mockResolvedValue([]);

    render(
      <LocationInput
        label="Destination"
        onChange={handleChange}
        placeholder="Search destinations"
        useGooglePlaces={false}
      />,
    );

    await user.type(screen.getByLabelText('Destination'), 'Lisbon');

    expect(handleChange).toHaveBeenLastCalledWith({
      id: 'manual-lisbon',
      name: 'Lisbon',
      source: 'manual',
    });
  });

  it('lets the user select a suggested mock location', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    autocompleteMock.mockResolvedValue([]);

    render(<LocationInput onChange={handleChange} useGooglePlaces={false} />);

    await user.type(
      screen.getByPlaceholderText('Search for a place or enter a custom location'),
      'Tokyo',
    );
    await user.click(screen.getByRole('button', { name: /tokyo/i }));

    expect(handleChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        name: expect.stringMatching(/tokyo/i),
      }),
    );
  });

  it('uses Google autocomplete and details when available', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    autocompleteMock.mockResolvedValue([
      {
        placeId: 'tokyo-place-id',
        resourceName: 'places/tokyo-place-id',
        text: 'Tokyo Station, Tokyo, Japan',
        mainText: 'Tokyo Station',
        secondaryText: 'Tokyo, Japan',
        types: ['transit_station'],
      },
    ]);
    getDetailsMock.mockResolvedValue({
      id: 'google-tokyo-place-id',
      googlePlaceId: 'tokyo-place-id',
      name: 'Tokyo Station',
      formattedAddress: 'Tokyo, Japan',
      latitude: 35.6812,
      longitude: 139.7671,
      source: 'google',
    });

    render(<LocationInput onChange={handleChange} />);

    await user.type(
      screen.getByPlaceholderText('Search for a place or enter a custom location'),
      'Tokyo',
    );
    await screen.findByRole('button', { name: /tokyo station/i });
    await user.click(screen.getByRole('button', { name: /tokyo station/i }));

    expect(autocompleteMock).toHaveBeenCalledWith(
      'Tokyo',
      expect.objectContaining({ sessionToken: expect.any(String) }),
    );
    expect(getDetailsMock).toHaveBeenCalledWith(
      'tokyo-place-id',
      expect.objectContaining({ sessionToken: expect.any(String) }),
    );
    expect(handleChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        googlePlaceId: 'tokyo-place-id',
        name: 'Tokyo Station',
        source: 'google',
      }),
    );
  });
});
