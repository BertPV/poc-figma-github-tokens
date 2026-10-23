import { basename } from 'node:path';
import StyleDictionary from 'style-dictionary';
import { registerTransforms } from './transforms.mjs';
import { platformsFor } from './platforms.mjs';

export const SUFFIX = '.tokens.json';

/**
 * Tokens that are not in any Figma export (they exist as Figma *styles*, not variables)
 * but are used by developers. Merged into every brand build.
 */
export const SHARED_SOURCE = 'tokens/shared/*.json';

registerTransforms(StyleDictionary);

/**
 * "Skoda.tokens.json" -> "skoda", "P&V Group.tokens.json" -> "pv-group".
 * Punctuation is dropped rather than kept, because the brand name ends up in
 * file names and in release download URLs.
 */
export function brandFromFile(file) {
  return basename(file, SUFFIX)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]+/g, '')
    .trim()
    .replace(/[\s-]+/g, '-');
}

/** Builds one Figma mode export into <outDir>/css/<brand>.css. */
export async function buildBrand(sourcePath, { outDir = 'dist', verbosity = 'verbose', shared = true } = {}) {
  const brand = brandFromFile(sourcePath);
  const sd = new StyleDictionary({
    source: shared ? [SHARED_SOURCE, sourcePath] : [sourcePath],
    usesDtcg: true,
    // Fail on broken references, name collisions, etc., so nothing broken gets published.
    log: { warnings: 'error', verbosity },
    platforms: platformsFor(brand, outDir),
  });
  await sd.buildAllPlatforms();
  return brand;
}
