// Tiny in-memory cache for paginated reads (Stage F: fewer client->server round-trips).
// Keys follow `resource:scope:id:...:page:N`; invalidation is prefix-based so a write can
// clear every cached page of a resource at once. Lives for the browser session only.
const store = new Map();

export function getCached(key) {
  return store.has(key) ? store.get(key) : null;
}

export function setCached(key, value) {
  store.set(key, value);
}

export function deleteByPrefix(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
    }
  }
}

export function clearCache() {
  store.clear();
}
