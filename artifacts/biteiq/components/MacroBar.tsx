import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props {
  label: string;
  current: number;
  goal: number;
  color: string;
}

export function MacroBar({ label, current, goal, color }: Props) {
  const colors = useColors();
  const ratio = goal > 0 ? Math.min(1, current / goal) : 0;
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.values, { color: colors.mutedForeground }]}>
          <Text style={{ color: colors.foreground, fontFamily: "Inter_700Bold" }}>
            {Math.round(current)}
          </Text>
          {" / "}
          {goal}g
        </Text>
      </View>
      <View
        style={[styles.track, { backgroundColor: colors.ringTrack }]}
      >
        <View
          style={[
            styles.fill,
            {
              backgroundColor: color,
              width: `${ratio * 100}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", letterSpacing: 0.3 },
  values: { fontSize: 13, fontFamily: "Inter_500Medium" },
  track: { height: 8, borderRadius: 999, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 999 },
});
