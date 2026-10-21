import { useEffect, useState } from "react";

import {
  getCustomerInfo,
  isPro,
  onCustomerInfo,
} from "@/lib/billing/purchases";

/** Live BiteIQ Pro status from RevenueCat (false on web / before configure). */
export function usePro(): { pro: boolean; loading: boolean } {
  const [pro, setPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getCustomerInfo().then((info) => {
      if (!alive) return;
      setPro(isPro(info));
      setLoading(false);
    });
    const off = onCustomerInfo((info) => setPro(isPro(info)));
    return () => {
      alive = false;
      off();
    };
  }, []);

  return { pro, loading };
}
