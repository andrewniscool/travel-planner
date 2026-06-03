import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import LocationInput from './LocationInput';

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

describe('LocationInput', () => {
  it('creates a manual location while typing', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <LocationInput
        label="Destination"
        onChange={handleChange}
        placeholder="Search destinations"
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

    render(<LocationInput onChange={handleChange} />);

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

  it.todo(
    'uses Google autocomplete and details when LocationInput is wired to placesService',
  );
});
