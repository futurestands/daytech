import { useEffect, useState } from 'react';
import { PRODUCT_STATUSES, type ProductStatus } from '../types/domain';

export function safeProductStatus(status: ProductStatus): ProductStatus {
  return status === 'Available' ? 'Planned' : status;
}

export function usePublicProductStatuses(scope: 'featured' | 'all') {
  const [statuses, setStatuses] = useState<Record<string, ProductStatus>>({});
  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/products/releases?scope=' + scope, { signal: controller.signal })
      .then(response => response.ok ? response.json() : {})
      .then(data => {
        if (!controller.signal.aborted && data && typeof data === 'object') {
          setStatuses(Object.fromEntries(Object.entries(data).filter((entry): entry is [string, ProductStatus] =>
            PRODUCT_STATUSES.includes(entry[1] as ProductStatus))));
        }
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [scope]);
  return statuses;
}
