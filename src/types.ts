export interface MediaItem {
  name: string;
  handle: FileSystemFileHandle;
}
export interface Meta {
  size?: number;
  mtime?: number;
  dur?: number;
}
export type TypeFilter = 'all' | 'img' | 'vid';
export type DurFilter = 'all' | 'short' | 'med' | 'long' | 'xl';
export type SortMode = 'name' | 'date' | 'size' | 'dur';
export interface Filters {
  query: string;
  type: TypeFilter;
  dur: DurFilter;
  maxMb: 'all' | '5' | '10' | '25' | '50';
  sort: SortMode;
}
export type AppState = 'loading' | 'needPick' | 'needPerm' | 'ready';
