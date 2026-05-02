/** Approximate bbox for UX defaults and optional discovery filtering — refine with authoritative GIS later. */
export const MALKANGIRI_BOX = {
  latMin: 17.87,
  latMax: 18.38,
  lngMin: 81.72,
  lngMax: 82.34,
};

export function isRoughlyInsideMalkangiri(lat: number, lng: number): boolean {
  return (
    lat >= MALKANGIRI_BOX.latMin &&
    lat <= MALKANGIRI_BOX.latMax &&
    lng >= MALKANGIRI_BOX.lngMin &&
    lng <= MALKANGIRI_BOX.lngMax
  );
}

export function malkangiriCenter() {
  return {
    lat: (MALKANGIRI_BOX.latMin + MALKANGIRI_BOX.latMax) / 2,
    lng: (MALKANGIRI_BOX.lngMin + MALKANGIRI_BOX.lngMax) / 2,
  };
}
