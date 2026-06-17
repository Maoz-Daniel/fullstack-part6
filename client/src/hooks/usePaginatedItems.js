import { useCallback, useState } from 'react';

// Merge incoming items after the current ones, skipping any whose id is already present
// (guards against duplicates if a page overlaps).
function mergeById(currentItems, nextItems) {
  const seen = new Set(currentItems.map((item) => item.id));
  return [...currentItems, ...nextItems.filter((item) => !seen.has(item.id))];
}

// Holds a growing, paginated list. `fetchPage(page)` must resolve to `{ data, nextPage }`
// (the shape the albums/photos services return). The page components stay agnostic about
// whether pagination is signalled by a header or an envelope.
export function usePaginatedItems(initialItems = [], initialNextPage = null) {
  const [items, setItems] = useState(initialItems);
  const [nextPage, setNextPage] = useState(initialNextPage);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Replace the whole list with a fresh first page (e.g. after a filter/search change).
  const replaceFirstPage = useCallback((pageData) => {
    setItems(pageData.data);
    setNextPage(pageData.nextPage);
  }, []);

  // Append the next page, if any.
  const loadMore = useCallback(async (fetchPage, onMerged) => {
    if (!nextPage || isLoadingMore) return null;

    setIsLoadingMore(true);
    try {
      const pageData = await fetchPage(nextPage);
      setItems((current) => {
        const merged = mergeById(current, pageData.data);
        if (onMerged) onMerged(merged, pageData.nextPage);
        return merged;
      });
      setNextPage(pageData.nextPage);
      return pageData;
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, nextPage]);

  return {
    items,
    setItems,
    nextPage,
    setNextPage,
    isLoadingMore,
    loadMore,
    replaceFirstPage,
  };
}
