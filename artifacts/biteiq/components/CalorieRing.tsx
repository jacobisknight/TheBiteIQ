import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { useColors } from "@/hooks/useColors";

interface Props {
  consumed: number;
  goal: number;
  size?: number;
  stroke?: number;
}

export function CalorieRing({ consumed, goal, size = 220, stroke = 18 }: Props) {
  const colors = useColors();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = goal > 0 ? Math.min(1, consumed / goal) : 0;
  const offset = circumference * (1 - ratio);
  const remaining = Math.max(0, Math.round(goal - consumed));
  const over = consumed > goal;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.ringTrack}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={over ? colors.accent : colors.primary}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          {over ? "OVER" : "REMAINING"}
        </Text>
        <Text style={[styles.big, { color: colors.foreground }]}>
          {over ? `+${Math.round(consumed - goal)}` : remaining}
        </Text>
        <Text style={[styles.unit, { color: colors.mutedForeground }]}>
          {Math.round(consumed)} / {goal} kcal
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  center: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 11,
    letterSpacing: 2,
    fontFamily: "Inter_600SemiBold",
  },
  big: {
    fontSize: 56,
    fontFamily: "Inter_700Bold",
    letterSpacing: -2,
    marginTop: 2,
  },
  unit: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 4,
  },
});
