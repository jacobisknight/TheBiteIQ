import { Feather } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { PurchasesPackage } from "react-native-purchases";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PrimaryButton } from "@/components/PrimaryButton";
import { useColors } from "@/hooks/useColors";
import {
  billingAvailable,
  buy,
  getPackages,
  restore,
} from "@/lib/billing/purchases";

const SITE = "https://biteiq.tech";

const REASON: Record<string, string> = {
  photo: "You've used today's 3 free photo scans.",
  text: "You've used today's free voice logs.",
  search: "You've used today's free food searches.",
  coach: "You've used today's free coach messages.",
  mealPlan: "Personalized meal plans are part of BiteIQ Pro.",
  workoutPlan: "Weekly workout plans are part of BiteIQ Pro.",
};

const PERKS: { icon: React.ComponentProps<typeof Feather>["name"]; text: string }[] = [
  { icon: "camera", text: "Unlimited photo, voice and search logging" },
  { icon: "message-circle", text: "Unlimited AI coach, tuned for GLP-1 users" },
  { icon: "shield", text: "Protein-first targets to protect muscle while you lose" },
  { icon: "calendar", text: "Weekly meal plans and strength workouts" },
  { icon: "activity", text: "Apple Health, Whoop and Oura in your coaching" },
];

function periodLabel(pkg: PurchasesPackage): string {
  switch (pkg.packageType) {
    case "ANNUAL":
      return "Yearly";
    case "MONTHLY":
      return "Monthly";
    case "WEEKLY":
      return "Weekly";
    case "LIFETIME":
      return "Lifetime";
    default:
      return pkg.product.title;
  }
}

function perLabel(pkg: PurchasesPackage): string {
  switch (pkg.packageType) {
    case "ANNUAL":
      return "/year";
    case "MONTHLY":
      return "/month";
    case "WEEKLY":
      return "/week";
    default:
      return "";
  }
}

export default function PaywallScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { feature } = useLocalSearchParams<{ feature?: string }>();

  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"buy" | "restore" | null>(null);

  useEffect(() => {
    getPackages()
      .then((pkgs) => {
        setPackages(pkgs);
        const annual = pkgs.find((p) => p.packageType === "ANNUAL");
        setSelected((annual ?? pkgs[0])?.identifier ?? null);
      })
      .catch(() => setPackages([]))
      .finally(() => setLoading(false));
  }, []);

  const chosen = useMemo(
    () => packages.find((p) => p.identifier === selected) ?? null,
    [packages, selected],
  );

  const done = () => {
    Alert.alert("Welcome to BiteIQ Pro", "Everything is unlocked.");
    router.back();
  };

  const onBuy = async () => {
    if (!chosen) return;
    setBusy("buy");
    try {
      if (await buy(chosen)) done();
    } catch (e) {
      Alert.alert(
        "Purchase didn't go through",
        e instanceof Error ? e.message : "Please try again.",
      );
    } finally {
      setBusy(null);
    }
  };

  const onRestore = async () => {
    setBusy("restore");
    try {
      if (await restore()) done();
      else Alert.alert("Nothing to restore", "No active BiteIQ Pro subscription was found for this Apple ID.");
    } catch {
      Alert.alert("Restore failed", "Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const reason = feature ? REASON[feature] : undefined;
  const trial = chosen?.product.introPrice;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        style={[styles.close, { top: insets.top + 12 }]}
        accessibilityLabel="Close"
      >
        <Feather name="x" size={24} color={colors.mutedForeground} />
      </Pressable>

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 56,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 24,
        }}
      >
        <Text style={[styles.kicker, { color: colors.accent }]}>BITEIQ PRO</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Eat enough. Keep your muscle. Hit your goal.
        </Text>
        {reason ? (
          <Text style={[styles.reason, { color: colors.mutedForeground }]}>{reason}</Text>
        ) : null}

        <View style={styles.perks}>
          {PERKS.map((p) => (
            <View key={p.text} style={styles.perk}>
              <View style={[styles.perkIcon, { backgroundColor: colors.primarySoft }]}>
                <Feather name={p.icon} size={16} color={colors.primary} />
              </View>
              <Text style={[styles.perkText, { color: colors.foreground }]}>{p.text}</Text>
            </View>
          ))}
        </View>

        {!billingAvailable() ? (
          <Text style={[styles.note, { color: colors.mutedForeground }]}>
            Subscriptions are available in the iPhone app.
          </Text>
        ) : loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
        ) : packages.length === 0 ? (
          <Text style={[styles.note, { color: colors.mutedForeground }]}>
            Plans couldn't load. Check your connection and try again.
          </Text>
        ) : (
          <View style={styles.plans}>
            {packages.map((pkg) => {
              const on = pkg.identifier === selected;
              return (
                <Pressable
                  key={pkg.identifier}
                  onPress={() => setSelected(pkg.identifier)}
                  style={[
                    styles.plan,
                    {
                      backgroundColor: colors.card,
                      borderColor: on ? colors.primary : colors.border,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.planName, { color: colors.foreground }]}>
                      {periodLabel(pkg)}
                    </Text>
                    {pkg.product.introPrice ? (
                      <Text style={[styles.planSub, { color: colors.primary }]}>
                        {pkg.product.introPrice.price === 0
                          ? `${pkg.product.introPrice.periodNumberOfUnits}-${pkg.product.introPrice.periodUnit.toLowerCase()} free trial`
                          : `Intro ${pkg.product.introPrice.priceString}`}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={[styles.planPrice, { color: colors.foreground }]}>
                    {pkg.product.priceString}
                    <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
                      {perLabel(pkg)}
                    </Text>
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {billingAvailable() && packages.length > 0 ? (
          <>
            <PrimaryButton
              label={trial && trial.price === 0 ? "Start free trial" : "Continue"}
              onPress={onBuy}
              loading={busy === "buy"}
              disabled={!chosen || busy !== null}
              variant="accent"
              style={{ marginTop: 20 }}
            />
            <Text style={[styles.legal, { color: colors.mutedForeground }]}>
              {chosen
                ? `${trial && trial.price === 0 ? "After the free trial, " : ""}${chosen.product.priceString}${perLabel(chosen)}. `
                : ""}
              Payment is charged to your Apple ID. The subscription renews
              automatically unless cancelled at least 24 hours before the end of
              the current period. Manage or cancel in Settings › Apple ID ›
              Subscriptions.
            </Text>
          </>
        ) : null}

        <View style={styles.links}>
          {billingAvailable() ? (
            <Pressable onPress={onRestore} disabled={busy !== null}>
              <Text style={[styles.link, { color: colors.foreground }]}>
                {busy === "restore" ? "Restoring…" : "Restore purchases"}
              </Text>
            </Pressable>
          ) : null}
          <Pressable onPress={() => WebBrowser.openBrowserAsync(`${SITE}/terms`)}>
            <Text style={[styles.link, { color: colors.mutedForeground }]}>Terms</Text>
          </Pressable>
          <Pressable onPress={() => WebBrowser.openBrowserAsync(`${SITE}/privacy`)}>
            <Text style={[styles.link, { color: colors.mutedForeground }]}>Privacy</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  close: { position: "absolute", right: 20, zIndex: 2 },
  kicker: { fontFamily: "Inter_700Bold", fontSize: 12, letterSpacing: 1.6 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, lineHeight: 34, marginTop: 8 },
  reason: { fontFamily: "Inter_500Medium", fontSize: 15, marginTop: 10 },
  perks: { marginTop: 24, gap: 14 },
  perk: { flexDirection: "row", alignItems: "center", gap: 12 },
  perkIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  perkText: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 15 },
  plans: { marginTop: 28, gap: 10 },
  plan: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
  },
  planName: { fontFamily: "Inter_700Bold", fontSize: 16 },
  planSub: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginTop: 2 },
  planPrice: { fontFamily: "Inter_700Bold", fontSize: 17 },
  note: { fontFamily: "Inter_500Medium", fontSize: 14, marginTop: 28, textAlign: "center" },
  legal: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16, marginTop: 14 },
  links: { flexDirection: "row", justifyContent: "center", gap: 24, marginTop: 20 },
  link: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
});
