import type { Site } from '../../config';

/** Everything that knows about one site's composer lives behind this interface. */
export interface SiteAdapter {
  site: Site;
  /** Containers that wrap a composer (used to find the right file input). */
  composerSelector: string;
  /** Selectors for text boxes, most specific first. */
  textboxSelectors: string[];
  /** Human label for the composer an element belongs to. */
  label(target: Element | null, doc: ParentNode, inFrame: boolean): string;
}
