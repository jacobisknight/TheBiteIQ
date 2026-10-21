import { Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesPackage,
} from "react-native-purchases";

/**
 * RevenueCat wrapper. The RevenueCat customer id is the Clerk user id, so the
 * API server can verify Pro status with the same id it gets from Clerk auth.
 *
 * Env (baked in at build time via EAS env):
 *   EXPO_PUBLIC_REVENUECAT_IOS_KEY – RevenueCat public Apple API key (appl_...)
 */

export const ENTITLEMENT_ID = "pro";

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;

let configured = false;

export function billingAvailable(): boolean {
  return Platform.OS === "ios" && !!IOS_KEY;
}

export async function initPurchases(clerkUserId: string): Promise<void> {
  if (!billingAvailable()) return;
  if (!configured) {
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.WARN);
    Purchases.configure({ apiKey: IOS_KEY!, appUserID: clerkUserId });
    configured = true;
    return;
  }
  const { customerInfo } = await Purchases.logIn(clerkUserId);
  void customerInfo;
}

export async function resetPurchases(): Promise<void> {
  if (!configured) return;
  try {
    await Purchases.logOut();
  } catch {
    /* already anonymous */
  }
}

export function isPro(info: CustomerInfo | null | undefined): boolean {
  return !!info?.entitlements.active[ENTITLEMENT_ID];
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!configured) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch {
    return null;
  }
}

export function onCustomerInfo(cb: (info: CustomerInfo) => void): () => void {
  if (!configured) return () => {};
  Purchases.addCustomerInfoUpdateListener(cb);
  return () => Purchases.removeCustomerInfoUpdateListener(cb);
}

export async function getPackages(): Promise<PurchasesPackage[]> {
  if (!configured) return [];
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages ?? [];
}

/** Returns true when the purchase unlocked Pro; false if the user cancelled. */
export async function buy(pkg: PurchasesPackage): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return isPro(customerInfo);
  } catch (e) {
    if ((e as { userCancelled?: boolean }).userCancelled) return false;
    throw e;
  }
}

export async function restore(): Promise<boolean> {
  const info = await Purchases.restorePurchases();
  return isPro(info);
}
