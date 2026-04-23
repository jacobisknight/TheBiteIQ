import { ClerkLoading } from "@clerk/expo";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import colors from "@/constants/colors";

const TIMEOUT_MS = 12_000;

function decodeFapiHost(publishableKey: string | undefined): string | null {
  if (!publishableKey) return null;
  const m = /^pk_(?:test|live)_(.+)$/.exec(publishableKey);
  if (!m) return null;
  let payload = m[1];
  const dollar = payload.indexOf("$");
  if (dollar >= 0) payload = payload.slice(0, dollar);
  try {
    let b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    if (typeof globalThis.atob === "function") {
      return globalThis.atob(b64).replace(/\$+$/, "");
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Buf = (globalThis as any).Buffer;
    if (Buf) return Buf.from(b64, "base64").toString("utf8").replace(/\$+$/, "");
    return null;
  } catch {
    return null;
  }
}

function keyPrefix(publishableKey: string | undefined): string {
  if (!publishableKey) return "(none)";
  return publishableKey.slice(0, 12) + "…";
}

function TimeoutScreen({
  publishableKey,
}: {
  publishableKey: string | undefined;
}) {
  const fapi = decodeFapiHost(publishableKey);
  const prefix = keyPrefix(publishableKey);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Authentication service unreachable</Text>
      <Text style={styles.body}>
        We could not reach the sign-in service after {TIMEOUT_MS / 1000} seconds.
        This is almost always a network issue or a problem with the
        authentication host&apos;s SSL certificate.
      </Text>
      <View style={styles.diagBox}>
        <Text style={styles.diagLabel}>Publishable key</Text>
        <Text style={styles.diagValue}>{prefix}</Text>
        <Text style={styles.diagLabel}>Authentication host</Text>
        <Text style={styles.diagValue}>{fapi ?? "(could not decode)"}</Text>
      </View>
      <Text style={styles.hint}>
        Try again on a different network. If the problem persists, contact
        support.
      </Text>
    </View>
  );
}

function LoadingThenTimeout({
  publishableKey,
}: {
  publishableKey: string | undefined;
}) {
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), TIMEOUT_MS);
    return () => clearTimeout(t);
  }, []);

  if (timedOut) return <TimeoutScreen publishableKey={publishableKey} />;
  return (
    <View style={styles.spinnerContainer}>
      <ActivityIndicator size="large" color={colors.light.primary} />
    </View>
  );
}

export function ClerkLoadingWithTimeout({
  publishableKey,
}: {
  publishableKey: string | undefined;
}) {
  return (
    <ClerkLoading>
      <LoadingThenTimeout publishableKey={publishableKey} />
    </ClerkLoading>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.light.background,
    padding: 24,
  },
  spinnerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.light.background,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.light.text,
    textAlign: "center",
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.light.text,
    opacity: 0.8,
    textAlign: "center",
    marginBottom: 20,
  },
  diagBox: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "rgba(0,0,0,0.06)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  diagLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.light.text,
    opacity: 0.6,
    marginTop: 4,
  },
  diagValue: {
    fontSize: 13,
    color: colors.light.text,
    fontFamily: "Inter_500Medium",
  },
  hint: {
    fontSize: 13,
    color: colors.light.text,
    opacity: 0.6,
    textAlign: "center",
  },
});
