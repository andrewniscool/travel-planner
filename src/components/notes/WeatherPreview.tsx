import React from 'react';
import { CloudSun } from 'lucide-react';
import Card from '../ui/Card';
import type { WeatherData } from '../../types';

const WeatherDay: React.FC<{ day: WeatherData }> = ({ day }) => (
  <div className="flex flex-col items-center gap-1.5 min-w-[72px] p-2">
    <span className="text-xs font-medium text-neutral-500">{day.day}</span>
    <span className="text-2xl">{day.icon}</span>
    <div className="flex items-center gap-1">
      <span className="text-sm font-semibold text-neutral-800">
        {day.high}&deg;
      </span>
      <span className="text-sm text-neutral-400">{day.low}&deg;</span>
    </div>
  </div>
);

interface WeatherPreviewProps {
  weather: WeatherData[];
}

const WeatherPreview: React.FC<WeatherPreviewProps> = ({ weather }) => {
  if (weather.length === 0) return null;

  return (
    <Card hover={false} className="p-4">
      <h3 className="text-sm font-semibold text-neutral-700 flex items-center gap-2 mb-3">
        <CloudSun className="w-4 h-4 text-warning-500" />
        Weather Forecast
      </h3>
      <div className="flex overflow-x-auto scrollbar-thin gap-1 pb-1 -mx-1 px-1">
        {weather.map((day) => (
          <WeatherDay key={day.date} day={day} />
        ))}
      </div>
    </Card>
  );
};

export default WeatherPreview;
