// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
/**
 * Livestock traceability integration providers.
 * Each country profile can define its own traceability scheme.
 * This follows the same pluggable pattern as weather providers.
 */

export interface TraceabilityProvider {
  id: string;
  label: string;
  description: string;
  /** Returns the URL for the official registry lookup */
  getRegistryUrl?(animalId: string): string;
  /** Returns the format pattern for animal IDs (e.g., "NAIT-XXXX" for NZ) */
  formatPattern?: string;
}

export const TRACEABILITY_PROVIDERS: Record<string, TraceabilityProvider> = {
  // New Zealand - NAIT (National Animal Identification and Tracing)
  nait: {
    id: "nait",
    label: "NAIT (NZ)",
    description: "New Zealand National Animal Identification and Tracing",
    getRegistryUrl: (animalId: string) => `https://nait.co.nz/animal/${animalId}`,
    formatPattern: "NAIT-XXXX",
  },
  // Australia - NLIS (National Livestock Identification System)
  nlis: {
    id: "nlis",
    label: "NLIS (AU)",
    description: "Australian National Livestock Identification System",
    getRegistryUrl: (animalId: string) => `https://www.nlis.com.au/animal/${animalId}`,
    formatPattern: "NLIS-XXXX",
  },
  // United States - USDA Animal Identification
  usda: {
    id: "usda",
    label: "USDA (US)",
    description: "USDA Animal Identification",
    getRegistryUrl: (animalId: string) => `https://www.aphis.usda.gov/wps/portal/animal/${animalId}`,
    formatPattern: "USDA-XXXX",
  },
  // United Kingdom - Cattle Tracing System
  cts: {
    id: "cts",
    label: "CTS (UK)",
    description: "British Cattle Tracing System",
    getRegistryUrl: (animalId: string) => `https://www.bisg.org.uk/cattle/${animalId}`,
    formatPattern: "CTS-XXXX",
  },
  // South Africa - SA Stud Book
  sastudbook: {
    id: "sastudbook",
    label: "SA Stud Book (ZA)",
    description: "South African Stud Book livestock registry",
    formatPattern: "SA-XXXX",
  },
  // Canada - CCIA (Canadian Cattle Identification Agency)
  ccia: {
    id: "ccia",
    label: "CCIA (CA)",
    description: "Canadian Cattle Identification Agency",
    formatPattern: "CA-XXXX",
  },
  // India - ICAR
  icar: {
    id: "icar",
    label: "ICAR (IN)",
    description: "Indian Council of Agricultural Research livestock registry",
    formatPattern: "IN-XXXX",
  },
  // Brazil - MAPA
  mapa: {
    id: "mapa",
    label: "MAPA (BR)",
    description: "Brazilian Ministry of Agriculture livestock registry",
    formatPattern: "BR-XXXX",
  },
  // France - INAO
  inao: {
    id: "inao",
    label: "INAO (FR)",
    description: "French livestock identification registry",
    formatPattern: "FR-XXXX",
  },
  // Germany - HIT
  hit: {
    id: "hit",
    label: "HIT (DE)",
    description: "German animal identification registry",
    formatPattern: "DE-XXXX",
  },
};

// Map country profiles to their default traceability provider
export const COUNTRY_TRACEABILITY_MAP: Record<string, string | undefined> = {
  nz: "nait",
  au: "nlis",
  us: "usda",
  uk: "cts",
  za: "sastudbook",
  ca: "ccia",
  in: "icar",
  br: "mapa",
  fr: "inao",
  de: "hit",
};

export function getTraceabilityProvider(countryId: string | undefined): TraceabilityProvider | undefined {
  if (!countryId) return undefined;
  const providerId = COUNTRY_TRACEABILITY_MAP[countryId];
  return providerId ? TRACEABILITY_PROVIDERS[providerId] : undefined;
}

export function getTraceabilityProviderById(id: string): TraceabilityProvider | undefined {
  return TRACEABILITY_PROVIDERS[id];
}