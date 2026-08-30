import type { CountryCode } from './types';

/** Countries currently supported by the Infer API for place suggestions. */
export const INFER_PLACES_COUNTRIES = [
  'NL',
  'BE',
  'DE',
  'FR',
] as const satisfies readonly CountryCode[];

export type InferPlacesCountryCode = (typeof INFER_PLACES_COUNTRIES)[number];

/**
 * Returns whether the Infer API supports place suggestions for a country.
 * Country codes are compared case-insensitively after trimming whitespace.
 */
export function supportsInferPlaces(country: string): boolean {
  const normalizedCountry = country.trim().toUpperCase();
  return (INFER_PLACES_COUNTRIES as readonly string[]).includes(normalizedCountry);
}
