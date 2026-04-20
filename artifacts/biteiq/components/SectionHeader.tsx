import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

export function SectionHeader({
  label,
  hint,
  right,
}: {
  label: string;
  hint?: string;
  right?: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
        {hint ? (
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>{hint}</Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  hint: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
});
