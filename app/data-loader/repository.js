const JSON_OPTIONS = { headers: { Accept: "application/json" } };

const cache = new Map();

async function fetchJson(path) {
  if (!cache.has(path)) {
    cache.set(path, fetch(path, JSON_OPTIONS).then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load ${path}: ${response.status}`);
      }
      return response.json();
    }));
  }
  return cache.get(path);
}

export async function loadDashboardData() {
  const [entrypoint, catalog, statistics, reviews] = await Promise.all([
    fetchJson("../metadata/ai-entrypoint.json"),
    fetchJson("../metadata/catalog.json"),
    fetchJson("../metadata/statistics.json"),
    fetchJson("../reviews/items.json"),
  ]);
  return { entrypoint, catalog, statistics, reviews };
}

export async function loadCanonicalItem(catalogItem) {
  const records = await fetchJson(`../${catalogItem.source_path}`);
  return records.find((item) => item.id === catalogItem.id) ?? null;
}

export async function loadPracticeItems(entrypoint) {
  const paths = Object.values(entrypoint.paths.canonical);
  const groups = await Promise.all(paths.map((path) => fetchJson(`../${path}`)));
  return groups.flat();
}
