type LocationBias = {
  circle?: {
    center: {
      latitude: number;
      longitude: number;
    };
    radius: number;
  };
  rectangle?: {
    low: {
      latitude: number;
      longitude: number;
    };
    high: {
      latitude: number;
      longitude: number;
    };
  };
};

type PlacesRequestBody = {
  action?: 'autocomplete' | 'details' | 'textSearch';
  input?: string;
  placeId?: string;
  textQuery?: string;
  sessionToken?: string;
  languageCode?: string;
  regionCode?: string;
  includedPrimaryTypes?: string[];
  locationBias?: LocationBias;
  maxResultCount?: number;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const GOOGLE_PLACES_BASE_URL = 'https://places.googleapis.com/v1';

const AUTOCOMPLETE_FIELD_MASK = [
  'suggestions.placePrediction.place',
  'suggestions.placePrediction.placeId',
  'suggestions.placePrediction.text',
  'suggestions.placePrediction.structuredFormat',
  'suggestions.placePrediction.types',
].join(',');

const PLACE_FIELD_MASK = [
  'id',
  'name',
  'displayName',
  'formattedAddress',
  'location',
  'types',
  'primaryType',
  'rating',
  'userRatingCount',
  'photos',
  'websiteUri',
  'nationalPhoneNumber',
  'internationalPhoneNumber',
  'regularOpeningHours',
  'priceLevel',
  'priceRange',
  'googleMapsUri',
  'businessStatus',
].join(',');

const TEXT_SEARCH_FIELD_MASK = PLACE_FIELD_MASK.split(',')
  .map((field) => `places.${field}`)
  .join(',');

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function normalizePlaceName(placeName: string) {
  return placeName.startsWith('places/') ? placeName : `places/${placeName}`;
}

function requireString(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }

  return value.trim();
}

async function callGooglePlaces(
  path: string,
  options: {
    apiKey: string;
    method?: 'GET' | 'POST';
    fieldMask: string;
    body?: Record<string, unknown>;
  },
) {
  const response = await fetch(`${GOOGLE_PLACES_BASE_URL}${path}`, {
    method: options.method ?? 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': options.apiKey,
      'X-Goog-FieldMask': options.fieldMask,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const responseBody = await response.json().catch(() => ({}));

  if (!response.ok) {
    return jsonResponse(
      {
        error: 'Google Places request failed.',
        status: response.status,
        details: responseBody,
      },
      response.status,
    );
  }

  return jsonResponse(responseBody);
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
  if (!apiKey) {
    return jsonResponse(
      { error: 'GOOGLE_PLACES_API_KEY is not configured.' },
      500,
    );
  }

  let body: PlacesRequestBody;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Request body must be valid JSON.' }, 400);
  }

  try {
    if (body.action === 'autocomplete') {
      const input = requireString(body.input, 'input');
      return callGooglePlaces('/places:autocomplete', {
        apiKey,
        fieldMask: AUTOCOMPLETE_FIELD_MASK,
        body: {
          input,
          ...(body.sessionToken ? { sessionToken: body.sessionToken } : {}),
          ...(body.languageCode ? { languageCode: body.languageCode } : {}),
          ...(body.regionCode ? { regionCode: body.regionCode } : {}),
          ...(body.includedPrimaryTypes
            ? { includedPrimaryTypes: body.includedPrimaryTypes }
            : {}),
          ...(body.locationBias ? { locationBias: body.locationBias } : {}),
        },
      });
    }

    if (body.action === 'details') {
      const placeId = requireString(body.placeId, 'placeId');
      const searchParams = new URLSearchParams();
      if (body.sessionToken) searchParams.set('sessionToken', body.sessionToken);
      if (body.languageCode) searchParams.set('languageCode', body.languageCode);
      if (body.regionCode) searchParams.set('regionCode', body.regionCode);

      const query = searchParams.toString();
      return callGooglePlaces(
        `/${normalizePlaceName(placeId)}${query ? `?${query}` : ''}`,
        {
          apiKey,
          method: 'GET',
          fieldMask: PLACE_FIELD_MASK,
        },
      );
    }

    if (body.action === 'textSearch') {
      const textQuery = requireString(body.textQuery, 'textQuery');
      return callGooglePlaces('/places:searchText', {
        apiKey,
        fieldMask: TEXT_SEARCH_FIELD_MASK,
        body: {
          textQuery,
          ...(body.languageCode ? { languageCode: body.languageCode } : {}),
          ...(body.regionCode ? { regionCode: body.regionCode } : {}),
          ...(body.includedPrimaryTypes
            ? { includedType: body.includedPrimaryTypes[0] }
            : {}),
          ...(body.locationBias ? { locationBias: body.locationBias } : {}),
          ...(body.maxResultCount
            ? { maxResultCount: body.maxResultCount }
            : {}),
        },
      });
    }
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Invalid request.' },
      400,
    );
  }

  return jsonResponse(
    { error: 'action must be autocomplete, details, or textSearch.' },
    400,
  );
});
