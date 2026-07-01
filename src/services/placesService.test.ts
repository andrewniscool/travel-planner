import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearPlacesServiceCacheForTesting,
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
  clearPlacesServiceCacheForTesting();
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

  it('resolves the first Google Places photo for details requests', async () => {
    invokeMock
      .mockResolvedValueOnce({
        data: {
          id: 'restaurant-place-id',
          displayName: {
            text: 'Photo Restaurant',
            languageCode: 'en',
          },
          photos: [
            {
              name: 'places/restaurant-place-id/photos/photo-1',
              widthPx: 1200,
              heightPx: 800,
            },
          ],
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          photoUri: 'https://lh3.googleusercontent.com/photo-1',
        },
        error: null,
      });

    await expect(placesService.getDetails('restaurant-place-id')).resolves.toEqual(
      expect.objectContaining({
        googlePlaceId: 'restaurant-place-id',
        photoUrls: ['https://lh3.googleusercontent.com/photo-1'],
      }),
    );

    expect(invokeMock).toHaveBeenNthCalledWith(2, 'places', {
      body: {
        action: 'photo',
        photoName: 'places/restaurant-place-id/photos/photo-1',
        maxWidthPx: 800,
        maxHeightPx: 600,
        languageCode: undefined,
        regionCode: undefined,
      },
    });
  });

  it('reuses cached default text search results', async () => {
    invokeMock.mockResolvedValue({
      data: {
        places: [
          {
            id: 'hotel-place-id',
            displayName: {
              text: 'Cached Hotel',
              languageCode: 'en',
            },
            types: ['lodging'],
          },
        ],
      },
      error: null,
    });

    const options = {
      cacheQuery: '',
      cacheLocationName: 'Kyoto',
      category: 'lodging',
      includedPrimaryTypes: ['lodging'],
      maxResultCount: 9,
    };

    await expect(placesService.textSearch('hotels in Kyoto', options)).resolves.toEqual([
      expect.objectContaining({
        googlePlaceId: 'hotel-place-id',
        name: 'Cached Hotel',
      }),
    ]);
    await expect(placesService.textSearch('hotels in Kyoto', options)).resolves.toEqual([
      expect.objectContaining({
        googlePlaceId: 'hotel-place-id',
        name: 'Cached Hotel',
      }),
    ]);

    expect(invokeMock).toHaveBeenCalledTimes(1);
  });

  it('bypasses cached Google text search results when photos are required but missing', async () => {
    invokeMock
      .mockResolvedValueOnce({
        data: {
          places: [
            {
              id: 'photo-less-place-id',
              displayName: {
                text: 'Photo-less Hotel',
                languageCode: 'en',
              },
              types: ['lodging'],
            },
          ],
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          places: [
            {
              id: 'hotel-place-id',
              displayName: {
                text: 'Photo Hotel',
                languageCode: 'en',
              },
              types: ['lodging'],
              photos: [
                {
                  name: 'places/hotel-place-id/photos/photo-1',
                },
              ],
            },
          ],
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          photoUri: 'https://lh3.googleusercontent.com/hotel-photo',
        },
        error: null,
      });

    const options = {
      cacheQuery: '',
      cacheLocationName: 'Kyoto',
      category: 'lodging',
      includedPrimaryTypes: ['lodging'],
      maxResultCount: 9,
      requirePhotoUrls: true,
    };

    await expect(placesService.textSearch('hotels in Kyoto', options)).resolves.toEqual([
      expect.objectContaining({
        googlePlaceId: 'photo-less-place-id',
        photoUrls: [],
      }),
    ]);
    await expect(placesService.textSearch('hotels in Kyoto', options)).resolves.toEqual([
      expect.objectContaining({
        googlePlaceId: 'hotel-place-id',
        photoUrls: ['https://lh3.googleusercontent.com/hotel-photo'],
      }),
    ]);

    expect(invokeMock).toHaveBeenCalledTimes(3);
  });
});
