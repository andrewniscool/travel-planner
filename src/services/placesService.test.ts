import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  mapGooglePlaceToLocationRef,
  placesService,
  type GooglePlace,
} from './placesService';

const { invokeMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
}));

vi.mock('./supabaseClient', () => ({
  getSupabaseClient: () => ({
    functions: {
      invoke: invokeMock,
    },
  }),
}));

beforeEach(() => {
  invokeMock.mockReset();
});

describe('mapGooglePlaceToLocationRef', () => {
  it('maps a Google place response into an app location ref', () => {
    const googlePlace: GooglePlace = {
      id: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
      name: 'places/ChIJN1t_tDeuEmsRUsoyG83frY4',
      displayName: {
        text: 'Google Sydney',
        languageCode: 'en',
      },
      formattedAddress: '48 Pirrama Rd, Pyrmont NSW 2009, Australia',
      location: {
        latitude: -33.866489,
        longitude: 151.195856,
      },
      types: ['point_of_interest', 'establishment'],
      rating: 4.5,
      userRatingCount: 1200,
      websiteUri: 'https://about.google/',
      priceLevel: 'PRICE_LEVEL_MODERATE',
      googleMapsUri: 'https://maps.google.com/?cid=123',
      businessStatus: 'OPERATIONAL',
    };

    expect(mapGooglePlaceToLocationRef(googlePlace)).toEqual({
      id: 'google-ChIJN1t_tDeuEmsRUsoyG83frY4',
      googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
      name: 'Google Sydney',
      displayName: 'Google Sydney',
      formattedAddress: '48 Pirrama Rd, Pyrmont NSW 2009, Australia',
      latitude: -33.866489,
      longitude: 151.195856,
      placeTypes: ['point_of_interest', 'establishment'],
      rating: 4.5,
      reviewCount: 1200,
      photoUrls: [],
      websiteUri: 'https://about.google/',
      nationalPhoneNumber: undefined,
      internationalPhoneNumber: undefined,
      regularOpeningHours: undefined,
      priceLevel: 'PRICE_LEVEL_MODERATE',
      priceRange: undefined,
      googleMapsUri: 'https://maps.google.com/?cid=123',
      businessStatus: 'OPERATIONAL',
      source: 'google',
    });
  });
});

describe('placesService', () => {
  it('invokes the places edge function for autocomplete requests', async () => {
    invokeMock.mockResolvedValue({
      data: {
        suggestions: [
          {
            placePrediction: {
              place: 'places/tokyo-place-id',
              placeId: 'tokyo-place-id',
              text: {
                text: 'Tokyo, Japan',
                languageCode: 'en',
              },
              structuredFormat: {
                mainText: {
                  text: 'Tokyo',
                  languageCode: 'en',
                },
                secondaryText: {
                  text: 'Japan',
                  languageCode: 'en',
                },
              },
              types: ['locality', 'political'],
            },
          },
        ],
      },
      error: null,
    });

    await expect(placesService.autocomplete('Tokyo')).resolves.toEqual([
      {
        placeId: 'tokyo-place-id',
        resourceName: 'places/tokyo-place-id',
        text: 'Tokyo, Japan',
        mainText: 'Tokyo',
        secondaryText: 'Japan',
        types: ['locality', 'political'],
      },
    ]);

    expect(invokeMock).toHaveBeenCalledWith('places', {
      body: {
        action: 'autocomplete',
        input: 'Tokyo',
      },
    });
  });

  it('invokes the places edge function for details requests', async () => {
    invokeMock.mockResolvedValue({
      data: {
        id: 'tokyo-place-id',
        displayName: {
          text: 'Tokyo',
          languageCode: 'en',
        },
        formattedAddress: 'Tokyo, Japan',
        location: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
      },
      error: null,
    });

    await expect(
      placesService.getDetails('tokyo-place-id', {
        sessionToken: 'session-123',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        googlePlaceId: 'tokyo-place-id',
        name: 'Tokyo',
        formattedAddress: 'Tokyo, Japan',
        source: 'google',
      }),
    );

    expect(invokeMock).toHaveBeenCalledWith('places', {
      body: {
        action: 'details',
        placeId: 'tokyo-place-id',
        sessionToken: 'session-123',
      },
    });
  });
});
