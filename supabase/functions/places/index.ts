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
  action?: 'autocomplete' | 'details' | 'textSearch' | 'photo';
  input?: string;
  placeId?: string;
  photoName?: string;
  textQuery?: string;
  sessionToken?: string;
  languageCode?: string;
  regionCode?: string;
  includedPrimaryTypes?: string[];
  locationBias?: LocationBias;
  maxResultCount?: number;
  maxWidthPx?: number;
  maxHeightPx?: number;
};

type AuthUser = {
  id: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const GOOGLE_PLACES_BASE_URL = 'https://places.googleapis.com/v1';
const RATE_LIMIT_PER_MINUTE = 60;
const MAX_QUERY_LENGTH = 200;
const MAX_PLACE_ID_LENGTH = 200;
const MAX_PHOTO_NAME_LENGTH = 500;
const MAX_SESSION_TOKEN_LENGTH = 128;
const MAX_LANGUAGE_CODE_LENGTH = 16;
const MAX_REGION_CODE_LENGTH = 8;
const MAX_INCLUDED_PRIMARY_TYPES = 5;
const MAX_INCLUDED_PRIMARY_TYPE_LENGTH = 80;
const MAX_TEXT_SEARCH_RESULTS = 10;
const MAX_LOCATION_BIAS_RADIUS_METERS = 50000;
const MAX_PHOTO_DIMENSION_PX = 4800;
const ACTION_COSTS: Record<NonNullable<PlacesRequestBody['action']>, number> = {
  autocomplete: 1,
  details: 5,
  textSearch: 5,
  photo: 1,
};

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

function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      ...headers,
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

function requireBoundedString(
  value: unknown,
  fieldName: string,
  maxLength: number,
) {
  const stringValue = requireString(value, fieldName);
  if (stringValue.length > maxLength) {
    throw new Error(`${fieldName} is too long.`);
  }

  return stringValue;
}

function optionalBoundedString(
  value: unknown,
  fieldName: string,
  maxLength: number,
) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string.`);
  }

  const stringValue = value.trim();
  if (!stringValue) return undefined;
  if (stringValue.length > maxLength) {
    throw new Error(`${fieldName} is too long.`);
  }

  return stringValue;
}

function optionalIncludedPrimaryTypes(value: unknown) {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    throw new Error('includedPrimaryTypes must be an array.');
  }
  if (value.length > MAX_INCLUDED_PRIMARY_TYPES) {
    throw new Error('includedPrimaryTypes has too many values.');
  }

  return value.map((type) => {
    if (typeof type !== 'string' || !type.trim()) {
      throw new Error('includedPrimaryTypes values must be strings.');
    }

    const normalizedType = type.trim();
    if (normalizedType.length > MAX_INCLUDED_PRIMARY_TYPE_LENGTH) {
      throw new Error('includedPrimaryTypes value is too long.');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(normalizedType)) {
      throw new Error('includedPrimaryTypes value is invalid.');
    }

    return normalizedType;
  });
}

function requireLatitude(value: unknown, fieldName: string) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${fieldName} must be a number.`);
  }
  if (value < -90 || value > 90) {
    throw new Error(`${fieldName} is out of range.`);
  }

  return value;
}

function requireLongitude(value: unknown, fieldName: string) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${fieldName} must be a number.`);
  }
  if (value < -180 || value > 180) {
    throw new Error(`${fieldName} is out of range.`);
  }

  return value;
}

function optionalLocationBias(value: unknown): LocationBias | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('locationBias must be an object.');
  }

  const bias = value as LocationBias;
  if (bias.circle) {
    const radius = bias.circle.radius;
    if (typeof radius !== 'number' || !Number.isFinite(radius)) {
      throw new Error('locationBias.circle.radius must be a number.');
    }
    if (radius <= 0 || radius > MAX_LOCATION_BIAS_RADIUS_METERS) {
      throw new Error('locationBias.circle.radius is out of range.');
    }

    return {
      circle: {
        center: {
          latitude: requireLatitude(
            bias.circle.center?.latitude,
            'locationBias.circle.center.latitude',
          ),
          longitude: requireLongitude(
            bias.circle.center?.longitude,
            'locationBias.circle.center.longitude',
          ),
        },
        radius,
      },
    };
  }

  if (bias.rectangle) {
    return {
      rectangle: {
        low: {
          latitude: requireLatitude(
            bias.rectangle.low?.latitude,
            'locationBias.rectangle.low.latitude',
          ),
          longitude: requireLongitude(
            bias.rectangle.low?.longitude,
            'locationBias.rectangle.low.longitude',
          ),
        },
        high: {
          latitude: requireLatitude(
            bias.rectangle.high?.latitude,
            'locationBias.rectangle.high.latitude',
          ),
          longitude: requireLongitude(
            bias.rectangle.high?.longitude,
            'locationBias.rectangle.high.longitude',
          ),
        },
      },
    };
  }

  throw new Error('locationBias must include circle or rectangle.');
}

function optionalTextSearchResultCount(value: unknown) {
  if (value === undefined || value === null) return undefined;
  if (!Number.isInteger(value)) {
    throw new Error('maxResultCount must be an integer.');
  }
  if (value < 1 || value > MAX_TEXT_SEARCH_RESULTS) {
    throw new Error('maxResultCount is out of range.');
  }

  return value;
}

function optionalPhotoDimension(value: unknown, fieldName: string) {
  if (value === undefined || value === null) return undefined;
  if (!Number.isInteger(value)) {
    throw new Error(`${fieldName} must be an integer.`);
  }
  if (value < 1 || value > MAX_PHOTO_DIMENSION_PX) {
    throw new Error(`${fieldName} is out of range.`);
  }

  return value;
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return null;

  const token = authorization.slice('Bearer '.length).trim();
  return token || null;
}

async function getAuthenticatedUser(
  request: Request,
  supabaseUrl: string,
  anonKey: string,
): Promise<AuthUser | null> {
  const token = getBearerToken(request);
  if (!token) return null;

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) return null;

  const user = await response.json().catch(() => null) as AuthUser | null;
  return user?.id ? user : null;
}

async function consumeRateLimit(
  supabaseUrl: string,
  serviceRoleKey: string,
  userId: string,
  cost: number,
) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/rpc/consume_google_places_rate_limit`,
    {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_user_id: userId,
        p_cost: cost,
        p_limit: RATE_LIMIT_PER_MINUTE,
      }),
    },
  );

  if (!response.ok) {
    throw new Error('Rate limit service is unavailable.');
  }

  return await response.json() === true;
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

  if (!response.ok) {
    return jsonResponse(
      {
        error: 'Google Places request failed.',
        status: response.status,
      },
      response.status,
    );
  }

  const responseBody = await response.json().catch(() => ({}));
  return jsonResponse(responseBody);
}

async function callGooglePlacePhoto(
  photoName: string,
  options: {
    apiKey: string;
    maxWidthPx?: number;
    maxHeightPx?: number;
  },
) {
  const searchParams = new URLSearchParams({
    key: options.apiKey,
    skipHttpRedirect: 'true',
  });
  if (options.maxWidthPx) searchParams.set('maxWidthPx', String(options.maxWidthPx));
  if (options.maxHeightPx) searchParams.set('maxHeightPx', String(options.maxHeightPx));

  const response = await fetch(
    `${GOOGLE_PLACES_BASE_URL}/${photoName}/media?${searchParams.toString()}`,
    {
      method: 'GET',
    },
  );

  if (!response.ok) {
    return jsonResponse(
      {
        error: 'Google Places photo request failed.',
        status: response.status,
      },
      response.status,
    );
  }

  const responseBody = await response.json().catch(() => ({}));
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
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!apiKey || !supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse(
      { error: 'Places function is not configured.' },
      500,
    );
  }

  const user = await getAuthenticatedUser(request, supabaseUrl, anonKey);
  if (!user) {
    return jsonResponse({ error: 'Authentication required.' }, 401);
  }

  let body: PlacesRequestBody;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Request body must be valid JSON.' }, 400);
  }

  try {
    const action = body.action;
    if (!action || !(action in ACTION_COSTS)) {
      return jsonResponse(
        { error: 'action must be autocomplete, details, textSearch, or photo.' },
        400,
      );
    }

    const sessionToken = optionalBoundedString(
      body.sessionToken,
      'sessionToken',
      MAX_SESSION_TOKEN_LENGTH,
    );
    const languageCode = optionalBoundedString(
      body.languageCode,
      'languageCode',
      MAX_LANGUAGE_CODE_LENGTH,
    );
    const regionCode = optionalBoundedString(
      body.regionCode,
      'regionCode',
      MAX_REGION_CODE_LENGTH,
    );
    const includedPrimaryTypes = optionalIncludedPrimaryTypes(
      body.includedPrimaryTypes,
    );
    const locationBias = optionalLocationBias(body.locationBias);
    const maxResultCount = optionalTextSearchResultCount(body.maxResultCount);
    const maxWidthPx = optionalPhotoDimension(body.maxWidthPx, 'maxWidthPx');
    const maxHeightPx = optionalPhotoDimension(body.maxHeightPx, 'maxHeightPx');

    const withinRateLimit = await consumeRateLimit(
      supabaseUrl,
      serviceRoleKey,
      user.id,
      ACTION_COSTS[action],
    );
    if (!withinRateLimit) {
      return jsonResponse(
        { error: 'Google Places request limit exceeded. Try again shortly.' },
        429,
        { 'Retry-After': '60' },
      );
    }

    if (body.action === 'autocomplete') {
      const input = requireBoundedString(body.input, 'input', MAX_QUERY_LENGTH);
      return callGooglePlaces('/places:autocomplete', {
        apiKey,
        fieldMask: AUTOCOMPLETE_FIELD_MASK,
        body: {
          input,
          ...(sessionToken ? { sessionToken } : {}),
          ...(languageCode ? { languageCode } : {}),
          ...(regionCode ? { regionCode } : {}),
          ...(includedPrimaryTypes ? { includedPrimaryTypes } : {}),
          ...(locationBias ? { locationBias } : {}),
        },
      });
    }

    if (body.action === 'details') {
      const placeId = requireBoundedString(
        body.placeId,
        'placeId',
        MAX_PLACE_ID_LENGTH,
      );
      const searchParams = new URLSearchParams();
      if (sessionToken) searchParams.set('sessionToken', sessionToken);
      if (languageCode) searchParams.set('languageCode', languageCode);
      if (regionCode) searchParams.set('regionCode', regionCode);

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
      const textQuery = requireBoundedString(
        body.textQuery,
        'textQuery',
        MAX_QUERY_LENGTH,
      );
      return callGooglePlaces('/places:searchText', {
        apiKey,
        fieldMask: TEXT_SEARCH_FIELD_MASK,
        body: {
          textQuery,
          ...(languageCode ? { languageCode } : {}),
          ...(regionCode ? { regionCode } : {}),
          ...(includedPrimaryTypes?.[0]
            ? { includedType: includedPrimaryTypes[0] }
            : {}),
          ...(locationBias ? { locationBias } : {}),
          ...(maxResultCount ? { maxResultCount } : {}),
        },
      });
    }

    if (body.action === 'photo') {
      const photoName = requireBoundedString(
        body.photoName,
        'photoName',
        MAX_PHOTO_NAME_LENGTH,
      );
      if (!/^places\/[^/]+\/photos\/[^/]+$/.test(photoName)) {
        return jsonResponse({ error: 'photoName is invalid.' }, 400);
      }

      return callGooglePlacePhoto(photoName, {
        apiKey,
        maxWidthPx,
        maxHeightPx,
      });
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'Rate limit service is unavailable.'
    ) {
      return jsonResponse({ error: error.message }, 503);
    }

    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Invalid request.' },
      400,
    );
  }

  return jsonResponse({ error: 'Unsupported Places action.' }, 400);
});
