import { WeatherData } from '../types';

export interface TripWeather {
  tripId: string;
  forecast: WeatherData[];
}

export const weatherData: TripWeather[] = [
  // Tokyo in July - hot, humid, rainy season
  {
    tripId: 'trip-1',
    forecast: [
      { date: '2026-07-15', day: 'Wed', high: 33, low: 26, condition: 'Partly Cloudy', icon: '⛅' },
      { date: '2026-07-16', day: 'Thu', high: 31, low: 25, condition: 'Rain', icon: '🌧️' },
      { date: '2026-07-17', day: 'Fri', high: 32, low: 26, condition: 'Thunderstorm', icon: '⛈️' },
      { date: '2026-07-18', day: 'Sat', high: 30, low: 25, condition: 'Cloudy', icon: '☁️' },
      { date: '2026-07-19', day: 'Sun', high: 34, low: 27, condition: 'Sunny', icon: '☀️' },
      { date: '2026-07-20', day: 'Mon', high: 33, low: 26, condition: 'Partly Cloudy', icon: '⛅' },
      { date: '2026-07-21', day: 'Tue', high: 31, low: 25, condition: 'Rain', icon: '🌧️' },
    ],
  },
  // Paris in June - mild, pleasant, occasional rain
  {
    tripId: 'trip-2',
    forecast: [
      { date: '2026-06-20', day: 'Sat', high: 24, low: 16, condition: 'Sunny', icon: '☀️' },
      { date: '2026-06-21', day: 'Sun', high: 25, low: 17, condition: 'Partly Cloudy', icon: '⛅' },
      { date: '2026-06-22', day: 'Mon', high: 22, low: 15, condition: 'Cloudy', icon: '☁️' },
      { date: '2026-06-23', day: 'Tue', high: 20, low: 14, condition: 'Rain', icon: '🌧️' },
      { date: '2026-06-24', day: 'Wed', high: 23, low: 15, condition: 'Partly Cloudy', icon: '⛅' },
      { date: '2026-06-25', day: 'Thu', high: 26, low: 18, condition: 'Sunny', icon: '☀️' },
      { date: '2026-06-26', day: 'Fri', high: 25, low: 17, condition: 'Clear', icon: '🌤️' },
    ],
  },
  // Bali in August - warm, dry season, sunny
  {
    tripId: 'trip-3',
    forecast: [
      { date: '2026-08-05', day: 'Wed', high: 30, low: 24, condition: 'Sunny', icon: '☀️' },
      { date: '2026-08-06', day: 'Thu', high: 29, low: 23, condition: 'Partly Cloudy', icon: '⛅' },
      { date: '2026-08-07', day: 'Fri', high: 30, low: 24, condition: 'Sunny', icon: '☀️' },
      { date: '2026-08-08', day: 'Sat', high: 28, low: 23, condition: 'Cloudy', icon: '☁️' },
      { date: '2026-08-09', day: 'Sun', high: 29, low: 24, condition: 'Clear', icon: '🌤️' },
      { date: '2026-08-10', day: 'Mon', high: 30, low: 25, condition: 'Sunny', icon: '☀️' },
      { date: '2026-08-11', day: 'Tue', high: 29, low: 24, condition: 'Partly Cloudy', icon: '⛅' },
    ],
  },
  // New York in March - chilly, variable
  {
    tripId: 'trip-4',
    forecast: [
      { date: '2026-03-10', day: 'Tue', high: 8, low: 2, condition: 'Cloudy', icon: '☁️' },
      { date: '2026-03-11', day: 'Wed', high: 10, low: 3, condition: 'Partly Cloudy', icon: '⛅' },
      { date: '2026-03-12', day: 'Thu', high: 6, low: 0, condition: 'Rain', icon: '🌧️' },
      { date: '2026-03-13', day: 'Fri', high: 9, low: 2, condition: 'Clear', icon: '🌤️' },
      { date: '2026-03-14', day: 'Sat', high: 12, low: 4, condition: 'Sunny', icon: '☀️' },
      { date: '2026-03-15', day: 'Sun', high: 11, low: 3, condition: 'Partly Cloudy', icon: '⛅' },
      { date: '2026-03-16', day: 'Mon', high: 7, low: 1, condition: 'Cloudy', icon: '☁️' },
    ],
  },
  // Costa Rica in August - warm, rainy season (green season)
  {
    tripId: 'trip-5',
    forecast: [
      { date: '2026-08-22', day: 'Sat', high: 30, low: 22, condition: 'Partly Cloudy', icon: '⛅' },
      { date: '2026-08-23', day: 'Sun', high: 29, low: 22, condition: 'Thunderstorm', icon: '⛈️' },
      { date: '2026-08-24', day: 'Mon', high: 31, low: 23, condition: 'Sunny', icon: '☀️' },
      { date: '2026-08-25', day: 'Tue', high: 28, low: 21, condition: 'Rain', icon: '🌧️' },
      { date: '2026-08-26', day: 'Wed', high: 30, low: 22, condition: 'Partly Cloudy', icon: '⛅' },
      { date: '2026-08-27', day: 'Thu', high: 29, low: 22, condition: 'Cloudy', icon: '☁️' },
      { date: '2026-08-28', day: 'Fri', high: 31, low: 23, condition: 'Sunny', icon: '☀️' },
    ],
  },
];

export const getWeatherByTripId = (tripId: string): WeatherData[] =>
  weatherData.find(w => w.tripId === tripId)?.forecast ?? [];
