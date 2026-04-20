import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

export function StreakBadge({ days }: { days: number }) {
  const colors = useColors();
  return (
    <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
      <Feather name="zap" size={12} color={colors.accent} />
      <Text style={[styles.text, { color: colors.accent }]}>
        {days} day{days === 1 ? "" : "s"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  text: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
});
