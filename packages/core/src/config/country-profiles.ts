/**
 * Country profiles for TPT Agriculture.
 * Each profile defines locale, units, and regulatory labels.
 */

export interface CountryProfile {
  id: string;
  label: string;
  locale: string;
  dateFormat: string;
  units: {
    area: "ha";
    weight: "kg";
    volume: "L";
    temperature: "°C";
    speed: "kph";
  };
  regulatory: {
    chemicalRegNumber: string;
    /** Key into `TRACEABILITY_SCHEMES` — which livestock movement scheme applies here. */
    traceabilityScheme: string;
  };
  weatherProviders: readonly string[];
}

export const COUNTRY_PROFILES: Record<string, CountryProfile> = {
  nz: {
    id: "nz",
    label: "New Zealand",
    locale: "en-NZ",
    dateFormat: "dd/MM/yyyy",
    units: {
      area: "ha",
      weight: "kg",
      volume: "L",
      temperature: "°C",
      speed: "kph",
    },
    regulatory: {
      chemicalRegNumber: "ACVM Number",
      traceabilityScheme: "nait",
    },
    weatherProviders: ["open-meteo", "custom"] as const,
  },
  au: {
    id: "au",
    label: "Australia",
    locale: "en-AU",
    dateFormat: "dd/MM/yyyy",
    units: {
      area: "ha",
      weight: "kg",
      volume: "L",
      temperature: "°C",
      speed: "kph",
    },
    regulatory: {
      chemicalRegNumber: "APVMA Number",
      traceabilityScheme: "nlis",
    },
    weatherProviders: ["open-meteo", "bom", "custom"] as const,
  },
  us: {
    id: "us",
    label: "United States",
    locale: "en-US",
    dateFormat: "MM/dd/yyyy",
    units: {
      area: "ha",
      weight: "kg",
      volume: "L",
      temperature: "°C",
      speed: "kph",
    },
    regulatory: {
      chemicalRegNumber: "EPA Reg Number",
      traceabilityScheme: "generic",
    },
    weatherProviders: ["open-meteo", "noaa", "custom"] as const,
  },
  uk: {
    id: "uk",
    label: "United Kingdom",
    locale: "en-GB",
    dateFormat: "dd/MM/yyyy",
    units: {
      area: "ha",
      weight: "kg",
      volume: "L",
      temperature: "°C",
      speed: "kph",
    },
    regulatory: {
      chemicalRegNumber: "HSE Reg Number",
      traceabilityScheme: "generic",
    },
    weatherProviders: ["open-meteo", "met-office", "custom"] as const,
  },
  za: {
    id: "za",
    label: "South Africa",
    locale: "en-ZA",
    dateFormat: "yyyy/MM/dd",
    units: {
      area: "ha",
      weight: "kg",
      volume: "L",
      temperature: "°C",
      speed: "kph",
    },
    regulatory: {
      chemicalRegNumber: "SA EPA Number",
      traceabilityScheme: "generic",
    },
    weatherProviders: ["open-meteo", "custom"] as const,
  },
  ca: {
    id: "ca",
    label: "Canada",
    locale: "en-CA",
    dateFormat: "dd/MM/yyyy",
    units: {
      area: "ha",
      weight: "kg",
      volume: "L",
      temperature: "°C",
      speed: "kph",
    },
    regulatory: {
      chemicalRegNumber: "PMRA Reg Number",
      traceabilityScheme: "generic",
    },
    weatherProviders: ["open-meteo", "custom"] as const,
  },
  in: {
    id: "in",
    label: "India",
    locale: "en-IN",
    dateFormat: "dd/MM/yyyy",
    units: {
      area: "ha",
      weight: "kg",
      volume: "L",
      temperature: "°C",
      speed: "kph",
    },
    regulatory: {
      chemicalRegNumber: "FAO/WHO Number",
      traceabilityScheme: "generic",
    },
    weatherProviders: ["open-meteo", "custom"] as const,
  },
  br: {
    id: "br",
    label: "Brazil",
    locale: "pt-BR",
    dateFormat: "dd/MM/yyyy",
    units: {
      area: "ha",
      weight: "kg",
      volume: "L",
      temperature: "°C",
      speed: "kph",
    },
    regulatory: {
      chemicalRegNumber: "MAPA Reg Number",
      traceabilityScheme: "generic",
    },
    weatherProviders: ["open-meteo", "custom"] as const,
  },
  fr: {
    id: "fr",
    label: "France",
    locale: "fr-FR",
    dateFormat: "dd/MM/yyyy",
    units: {
      area: "ha",
      weight: "kg",
      volume: "L",
      temperature: "°C",
      speed: "kph",
    },
    regulatory: {
      chemicalRegNumber: "EPA Reg Number",
      traceabilityScheme: "generic",
    },
    weatherProviders: ["open-meteo", "custom"] as const,
  },
  de: {
    id: "de",
    label: "Germany",
    locale: "de-DE",
    dateFormat: "dd.MM.yyyy",
    units: {
      area: "ha",
      weight: "kg",
      volume: "L",
      temperature: "°C",
      speed: "kph",
    },
    regulatory: {
      chemicalRegNumber: "BfR Reg Number",
      traceabilityScheme: "generic",
    },
    weatherProviders: ["open-meteo", "custom"] as const,
  },
};

export type CountryProfileId = keyof typeof COUNTRY_PROFILES;

export function getCountryProfile(id: string | undefined): CountryProfile | undefined {
  return id ? COUNTRY_PROFILES[id] : undefined;
}

export function resolveCountryProfile(id: string | null | undefined): CountryProfile {
  // We use non-null assertion because "nz" is always a valid key
  // and id ?? "nz" guarantees a valid key
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return COUNTRY_PROFILES[id ?? "nz"]!;
}