import { IDB_NAME } from '../config';

function open(name: string): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(name, 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

export async function idbGet<T>(key: string, db = IDB_NAME): Promise<T | undefined> {
  const d = await open(db);
  return new Promise((res, rej) => {
    const t = d.transaction('kv').objectStore('kv').get(key);
    t.onsuccess = () => res(t.result as T | undefined);
    t.onerror = () => rej(t.error);
  });
}

export async function idbSet(key: string, val: unknown, db = IDB_NAME): Promise<void> {
  const d = await open(db);
  return new Promise((res, rej) => {
    const t = d.transaction('kv', 'readwrite').objectStore('kv').put(val, key);
    t.onsuccess = () => res();
    t.onerror = () => rej(t.error);
  });
}
