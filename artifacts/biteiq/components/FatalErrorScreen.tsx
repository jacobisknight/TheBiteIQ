import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import colors from "@/constants/colors";

type FatalError = { message: string; stack?: string; isFatal: boolean };

let listeners: ((err: FatalError | null) => void)[] = [];
let lastError: FatalError | null = null;

function emit(err: FatalError | null) {
  lastError = err;
  for (const l of listeners) l(err);
}

let installed = false;

export function installGlobalErrorHandler() {
  if (installed) return;
  installed = true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const EU: any = (globalThis as any).ErrorUtils;
  if (!EU || typeof EU.setGlobalHandler !== "function") return;
  const previous = EU.getGlobalHandler ? EU.getGlobalHandler() : null;
  EU.setGlobalHandler((error: Error, isFatal?: boolean) => {
    try {
      emit({
        message: error?.message ?? String(error),
        stack: error?.stack,
        isFatal: !!isFatal,
      });
    } catch {
      // swallow
    }
    if (typeof previous === "function") {
      try {
        previous(error, isFatal);
      } catch {
        // swallow
      }
    }
  });
}

export function FatalErrorScreen() {
  const [err, setErr] = useState<FatalError | null>(lastError);
  useEffect(() => {
    const cb = (e: FatalError | null) => setErr(e);
    listeners.push(cb);
    return () => {
      listeners = listeners.filter((l) => l !== cb);
    };
  }, []);

  if (!err || !err.isFatal) return null;

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.subtitle}>
          The app hit an unexpected error. Please force-quit and reopen.
        </Text>
        <View style={styles.box}>
          <Text style={styles.label}>Error</Text>
          <Text style={styles.value}>{err.message}</Text>
          {err.stack ? (
            <>
              <Text style={styles.label}>Stack</Text>
              <Text style={styles.stack}>{err.stack}</Text>
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#7f1d1d",
    zIndex: 9999,
  },
  content: {
    padding: 24,
    paddingTop: 80,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#fee2e2",
    marginBottom: 16,
  },
  box: {
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 12,
    padding: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fecaca",
    marginTop: 12,
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: "#fff",
    fontFamily: "Inter_500Medium",
  },
  stack: {
    fontSize: 11,
    color: "#fff",
    opacity: 0.8,
    fontFamily: "Inter_400Regular",
  },
});

// Re-export colors usage to avoid unused import lint if colors imported above.
void colors;
