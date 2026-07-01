// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { WEATHER_PROVIDERS, type WeatherProviderId } from "./providers.js";

export interface WeatherData {
  temperature: number | null;
  windSpeed: number | null;
  humidity: number | null;
  weatherCode: number | null;
  timestamp: number;
}

const CACHE_KEY = "tpt-weather-cache";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCachedWeather(): WeatherData | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const data = JSON.parse(cached) as WeatherData;
    if (Date.now() - data.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setCachedWeather(data: WeatherData) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

export async function fetchWeather(
  lat: number,
  lon: number,
  providerId: WeatherProviderId = "open-meteo",
  customUrl?: string
): Promise<WeatherData | null> {
  // Return cached data if available
  const cached = getCachedWeather();
  if (cached) return cached;

  const provider = WEATHER_PROVIDERS[providerId];
  if (!provider) return null;

  let url: string;
  if (providerId === "custom" && customUrl) {
    url = customUrl;
  } else if (providerId === "open-meteo") {
    url = `${provider.baseUrl}?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,relative_humidity_2m,weather_code`;
  } else {
    return null; // Other providers not yet implemented
  }

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    const weather: WeatherData = {
      temperature: data.current?.temperature_2m ?? null,
      windSpeed: data.current?.wind_speed_10m ?? null,
      humidity: data.current?.relative_humidity_2m ?? null,
      weatherCode: data.current?.weather_code ?? null,
      timestamp: Date.now(),
    };

    setCachedWeather(weather);
    return weather;
  } catch {
    return null;
  }
}

export function getWeatherEmoji(code: number | null): string {
  if (code == null) return "☀️";
  if (code < 3) return "☀️";
  if (code < 50) return "☁️";
  if (code < 65) return "🌧️";
  if (code < 80) return "🌦️";
  return "⛈️";
}