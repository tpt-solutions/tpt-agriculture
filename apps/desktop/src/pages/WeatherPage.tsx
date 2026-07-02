// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@tpt/ui";
import { useSettings } from "../context/FarmSettingsContext.js";
import { getWeatherEmoji } from "../weather/weather-service.js";

interface HourlyForecast {
  time: string;
  temperature: number;
  windSpeed: number;
  precipitation: number;
  humidity: number;
  weatherCode: number;
}

type SprayWindow = "good" | "marginal" | "poor";

function getSprayWindow(h: HourlyForecast): SprayWindow {
  if (h.windSpeed > 20 || h.precipitation > 0.5 || h.humidity > 92 || h.temperature < 5 || h.temperature > 32) return "poor";
  if (h.windSpeed > 15 || h.precipitation > 0.1 || h.humidity > 85 || h.temperature < 8 || h.temperature > 28) return "marginal";
  return "good";
}

const WINDOW_STYLES: Record<SprayWindow, string> = {
  good: "bg-green-100 text-green-800 border-green-200",
  marginal: "bg-yellow-100 text-yellow-800 border-yellow-200",
  poor: "bg-red-100 text-red-800 border-red-200",
};

const WINDOW_LABELS: Record<SprayWindow, string> = {
  good: "Good",
  marginal: "Marginal",
  poor: "Poor",
};

async function fetchHourlyForecast(lat: number, lon: number): Promise<HourlyForecast[]> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,wind_speed_10m,precipitation,relative_humidity_2m,weather_code&forecast_days=5&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather fetch failed");
  const data = await res.json();
  const { time, temperature_2m, wind_speed_10m, precipitation, relative_humidity_2m, weather_code } = data.hourly;
  return (time as string[]).map((t: string, i: number) => ({
    time: t,
    temperature: temperature_2m[i],
    windSpeed: wind_speed_10m[i],
    precipitation: precipitation[i],
    humidity: relative_humidity_2m[i],
    weatherCode: weather_code[i],
  }));
}

export function WeatherPage() {
  const farmSettings = useSettings();
  const lat = farmSettings?.lat ?? null;
  const lon = farmSettings?.lon ?? null;
  const locale = farmSettings?.countryProfile?.locale;

  const { data: forecast, isLoading, error } = useQuery({
    queryKey: ["hourly-forecast", lat, lon],
    queryFn: () => fetchHourlyForecast(lat!, lon!),
    enabled: lat != null && lon != null,
    staleTime: 60 * 60 * 1000,
  });

  const now = new Date();
  const upcoming = forecast?.filter((h) => new Date(h.time) >= now).slice(0, 120) ?? [];

  const groupedByDay: Record<string, HourlyForecast[]> = {};
  for (const h of upcoming) {
    const day = h.time.slice(0, 10);
    if (!groupedByDay[day]) groupedByDay[day] = [];
    groupedByDay[day]!.push(h);
  }

  if (lat == null || lon == null) {
    return (
      <DashboardShell title="Weather & Spray Windows">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-800">
          <p className="font-medium">Farm coordinates not set</p>
          <p className="mt-1 text-sm">Add your farm's latitude and longitude in <a href="/settings/farm" className="underline">Settings → Farm</a> to enable weather data and spray-window guidance.</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Weather & Spray Windows">
      <div className="space-y-2 mb-6">
        <p className="text-sm text-gray-500">
          5-day hourly spray-window forecast — Open-Meteo. Rules: wind &lt;15 kph, no rain, humidity &lt;85%, temp 8–28°C for <span className="font-medium text-green-700">Good</span>; outside those but within wind &lt;20 kph, precip &lt;0.5 mm, humidity &lt;92%, temp 5–32°C for <span className="font-medium text-yellow-700">Marginal</span>; anything else is <span className="font-medium text-red-700">Poor</span>.
        </p>
      </div>

      {isLoading && <p className="text-gray-500">Loading forecast…</p>}
      {error && <p className="text-red-500">Could not load weather data. Check your internet connection.</p>}

      {Object.entries(groupedByDay).map(([day, hours]) => {
        const date = new Date(day + "T12:00:00");
        const label = date.toLocaleDateString(locale, { weekday: "long", month: "short", day: "numeric" });
        const best = hours.find((h) => getSprayWindow(h) === "good");
        return (
          <div key={day} className="mb-4 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
              <span className="font-medium text-gray-800">{label}</span>
              {best ? (
                <span className="text-xs font-medium text-green-700">Best window: {best.time.slice(11, 16)}</span>
              ) : (
                <span className="text-xs text-red-600">No good spray window today</span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="px-3 py-1 text-left font-medium">Time</th>
                    <th className="px-3 py-1 text-right font-medium">°C</th>
                    <th className="px-3 py-1 text-right font-medium">Wind</th>
                    <th className="px-3 py-1 text-right font-medium">Rain</th>
                    <th className="px-3 py-1 text-right font-medium">Humidity</th>
                    <th className="px-3 py-1 text-center font-medium">Spray</th>
                  </tr>
                </thead>
                <tbody>
                  {hours.map((h) => {
                    const window = getSprayWindow(h);
                    return (
                      <tr key={h.time} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-1 font-medium text-gray-700">{h.time.slice(11, 16)} {getWeatherEmoji(h.weatherCode)}</td>
                        <td className="px-3 py-1 text-right">{h.temperature.toFixed(1)}</td>
                        <td className="px-3 py-1 text-right">{h.windSpeed.toFixed(0)} kph</td>
                        <td className="px-3 py-1 text-right">{h.precipitation.toFixed(1)} mm</td>
                        <td className="px-3 py-1 text-right">{h.humidity}%</td>
                        <td className="px-3 py-1 text-center">
                          <span className={`inline-block rounded border px-1.5 py-0.5 text-xs font-medium ${WINDOW_STYLES[window]}`}>
                            {WINDOW_LABELS[window]}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </DashboardShell>
  );
}
