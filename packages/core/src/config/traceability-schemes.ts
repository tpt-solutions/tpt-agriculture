/**
 * Livestock traceability schemes referenced by `CountryProfile.regulatory.traceabilityScheme`.
 * Mirrors the weather-provider registry pattern: country profiles point at a scheme
 * id here rather than duplicating its display name/tag terminology inline, so a
 * scheme shared by several country profiles (or a future real API integration) has
 * one place to update.
 */

export interface TraceabilityScheme {
  id: string;
  name: string;
  /** What the scheme calls an individual animal/mob identifier, e.g. "NAIT Number". */
  tagLabel: string;
}

export const TRACEABILITY_SCHEMES: Record<string, TraceabilityScheme> = {
  nait: {
    id: "nait",
    name: "NAIT",
    tagLabel: "NAIT Number",
  },
  nlis: {
    id: "nlis",
    name: "NLIS",
    tagLabel: "NLIS Device ID",
  },
  generic: {
    id: "generic",
    name: "Livestock Traceability",
    tagLabel: "Tag / RFID Number",
  },
};

export function getTraceabilityScheme(id: string | undefined): TraceabilityScheme {
  return (id && TRACEABILITY_SCHEMES[id]) || TRACEABILITY_SCHEMES.generic!;
}
