import { Feather } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "@clerk/expo";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { disconnect, startConnect } from "@/lib/health/api";
import {
  isHealthKitAvailable,
  requestHealthKitPermissions,
} from "@/lib/health/healthkit";
import { lastSyncLabel, snapshotSummary } from "@/lib/health/format";

type ProviderKey = "healthkit" | "whoop" | "oura";

const META: Record<
  ProviderKey,
  { title: string; subtitle: string; icon: React.ComponentProps<typeof Feather>["name"] }
> = {
  healthkit: {
    title: "Apple Health",
    subtitle: "Steps, active energy, sleep, heart rate, weight.",
    icon: "heart",
  },
  whoop: {
    title: "Whoop",
    subtitle: "Recovery, strain, sleep performance, HRV.",
    icon: "activity",
  },
  oura: {
    title: "Oura",
    subtitle: "Readiness, sleep score, HRV, daily activity.",
    icon: "circle",
  },
};

export default function DevicesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { getToken } = useAuth();
  const tokenGetter = useCallback(() => getToken(), [getToken]);
  const { healthConnections, healthSnapshot, refreshHealth, syncHealthKit } = useApp();
  const [busy, setBusy] = useState<ProviderKey | null>(null);

  useEffect(() => {
    void refreshHealth();
  }, [refreshHealth]);

  const onConnect = async (provider: "whoop" | "oura") => {
    try {
      setBusy(provider);
      const { authUrl } = await startConnect(tokenGetter, provider);
      const result = await WebBrowser.openAuthSessionAsync(authUrl, "biteiq://devices");
      if (result.type === "success" || result.type === "dismiss") {
        await refreshHealth();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Connection failed";
      if (msg === "provider_not_configured") {
        Alert.alert(
          `${META[provider].title} not configured`,
          "An admin needs to add the OAuth client credentials before this provider can be connected.",
        );
      } else {
        Alert.alert("Connection failed", msg);
      }
    } finally {
      setBusy(null);
    }
  };

  const onConnectHealthKit = async () => {
    if (!isHealthKitAvailable()) {
      Alert.alert(
        "Apple Health unavailable",
        Platform.OS === "ios"
          ? "Apple Health requires a custom dev build (not supported in Expo Go)."
          : "Apple Health is only available on iOS devices.",
      );
      return;
    }
    setBusy("healthkit");
    try {
      const ok = await requestHealthKitPermissions();
      if (!ok) {
        Alert.alert("Permission denied", "Enable BiteIQ in Settings → Health → Data Access.");
      } else {
        await syncHealthKit();
      }
    } finally {
      setBusy(null);
    }
  };

  const onDisconnect = async (provider: ProviderKey) => {
    Alert.alert(`Disconnect ${META[provider].title}?`, undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Disconnect",
        style: "destructive",
        onPress: async () => {
          setBusy(provider);
          try {
            await disconnect(tokenGetter, provider);
            await refreshHealth();
          } finally {
            setBusy(null);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: 80,
        paddingHorizontal: 18,
        gap: 18,
      }}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Devices</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Link wearables to enrich your coaching context.
          </Text>
        </View>
      </View>

      {healthSnapshot ? (
        <View
          style={[
            styles.summary,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
            <Feather name="zap" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.summaryTitle, { color: colors.foreground }]}>
              Today's signal
            </Text>
            <Text style={[styles.summaryText, { color: colors.mutedForeground }]}>
              {snapshotSummary(healthSnapshot)}
            </Text>
          </View>
        </View>
      ) : null}

      {(["healthkit", "whoop", "oura"] as ProviderKey[]).map((p) => {
        const meta = META[p];
        const status = healthConnections?.[p];
        const configured = status?.configured ?? (p === "healthkit");
        const connected = status?.connected ?? false;
        const isBusy = busy === p;
        const lastSync = status?.lastSyncAt;

        return (
          <View
            key={p}
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.cardHead}>
              <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
                <Feather name={meta.icon} size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                  {meta.title}
                </Text>
                <Text style={[styles.cardHint, { color: colors.mutedForeground }]}>
                  {meta.subtitle}
                </Text>
              </View>
            </View>

            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: connected
                      ? colors.primary
                      : configured
                        ? colors.mutedForeground
                        : colors.destructive,
                  },
                ]}
              />
              <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
                {connected
                  ? `Connected · synced ${lastSyncLabel(lastSync)}`
                  : configured
                    ? "Not connected"
                    : "Setup required (admin)"}
              </Text>
            </View>

            <View style={styles.actions}>
              {p === "healthkit" ? (
                <Pressable
                  disabled={isBusy}
                  onPress={
                    connected ? () => onDisconnect(p) : onConnectHealthKit
                  }
                  style={({ pressed }) => [
                    styles.btn,
                    {
                      backgroundColor: connected ? colors.card : colors.primary,
                      borderColor: connected ? colors.border : colors.primary,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  {isBusy ? (
                    <ActivityIndicator
                      size="small"
                      color={connected ? colors.foreground : colors.primaryForeground}
                    />
                  ) : (
                    <Text
                      style={{
                        color: connected ? colors.foreground : colors.primaryForeground,
                        fontFamily: "Inter_700Bold",
                        fontSize: 14,
                      }}
                    >
                      {connected ? "Disconnect" : "Enable Apple Health"}
                    </Text>
                  )}
                </Pressable>
              ) : connected ? (
                <Pressable
                  disabled={isBusy}
                  onPress={() => onDisconnect(p)}
                  style={({ pressed }) => [
                    styles.btn,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  {isBusy ? (
                    <ActivityIndicator size="small" color={colors.foreground} />
                  ) : (
                    <Text
                      style={{
                        color: colors.foreground,
                        fontFamily: "Inter_700Bold",
                        fontSize: 14,
                      }}
                    >
                      Disconnect
                    </Text>
                  )}
                </Pressable>
              ) : (
                <Pressable
                  disabled={isBusy || !configured}
                  onPress={() => onConnect(p)}
                  style={({ pressed }) => [
                    styles.btn,
                    {
                      backgroundColor: configured ? colors.primary : colors.card,
                      borderColor: configured ? colors.primary : colors.border,
                      opacity: pressed ? 0.85 : configured ? 1 : 0.6,
                    },
                  ]}
                >
                  {isBusy ? (
                    <ActivityIndicator size="small" color={colors.primaryForeground} />
                  ) : (
                    <Text
                      style={{
                        color: configured ? colors.primaryForeground : colors.foreground,
                        fontFamily: "Inter_700Bold",
                        fontSize: 14,
                      }}
                    >
                      {configured ? `Connect ${meta.title}` : "Not configured"}
                    </Text>
                  )}
                </Pressable>
              )}
            </View>
          </View>
        );
      })}

      <Text style={[styles.footnote, { color: colors.mutedForeground }]}>
        BiteIQ only reads from these sources. We never write data back to your wearable.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", gap: 14, alignItems: "center" },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 2 },
  summary: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
  },
  summaryTitle: { fontSize: 13, fontFamily: "Inter_700Bold" },
  summaryText: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  card: {
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    gap: 14,
  },
  cardHead: { flexDirection: "row", gap: 14, alignItems: "center" },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  cardHint: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 999 },
  statusText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  actions: { flexDirection: "row", gap: 10 },
  btn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  footnote: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    marginTop: 4,
  },
});
