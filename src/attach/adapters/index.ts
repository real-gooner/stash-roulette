import type { Site } from '../../config';
import { discordAdapter } from './discord';
import type { SiteAdapter } from './types';
import { xAdapter } from './x';

export type { SiteAdapter };
export const adapterFor = (site: Site): SiteAdapter => (site === 'discord' ? discordAdapter : xAdapter);
