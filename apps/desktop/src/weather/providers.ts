// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0

export interface WeatherProvider {
  id: string;
  name: string;
  baseUrl: string;
  requiresApiKey: boolean;
}

export const WEATHER_PROVIDERS: Record<string, WeatherProvider> = {
  "open-meteo": {
    id: "open-meteo",
    name: "Open-Meteo (Free)",
    baseUrl: "https://api.open-meteo.com/v1/forecast",
    requiresApiKey: false,
  },
  bom: {
    id: "bom",
    name: "Bureau of Meteorology (AU)",
    baseUrl: "https://api.bom.gov.au/v1",
    requiresApiKey: false,
  },
  "met-office": {
    id: "met-office",
    name: "Met Office (UK)",
    baseUrl: "https://api.metoffice.gov.uk/v1",
    requiresApiKey: true,
  },
  noaa: {
    id: "noaa",
    name: "NOAA (US)",
    baseUrl: "https://api.weather.gov/v1",
    requiresApiKey: false,
  },
  custom: {
    id: "custom",
    name: "Custom URL",
    baseUrl: "",
    requiresApiKey: false,
  },
};

export type WeatherProviderId = keyof typeof WEATHER_PROVIDERS;