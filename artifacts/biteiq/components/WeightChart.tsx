import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";

import { useColors } from "@/hooks/useColors";
import type { WeightEntry } from "@/types";

interface Props {
  entries: WeightEntry[];
  height?: number;
  width?: number;
}

export function WeightChart({ entries, height = 180, width = 320 }: Props) {
  const colors = useColors();
  const sorted = [...entries].sort((a, b) => a.loggedAt - b.loggedAt);
  if (sorted.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_500Medium" }}>
          Log your weight to see trends.
        </Text>
      </View>
    );
  }

  const minW = Math.min(...sorted.map((e) => e.weightKg));
  const maxW = Math.max(...sorted.map((e) => e.weightKg));
  const range = Math.max(1, maxW - minW);
  const padX = 16;
  const padY = 16;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const points = sorted.map((e, i) => {
    const x =
      sorted.length === 1
        ? padX + innerW / 2
        : padX + (i / (sorted.length - 1)) * innerW;
    const y = padY + innerH - ((e.weightKg - minW) / range) * innerH;
    return { x, y, w: e.weightKg };
  });

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  return (
    <View style={{ width }}>
      <Svg width={width} height={height}>
        {[0, 0.5, 1].map((r) => (
          <Line
            key={r}
            x1={padX}
            x2={width - padX}
            y1={padY + innerH * r}
            y2={padY + innerH * r}
            stroke={colors.ringTrack}
            strokeWidth={1}
          />
        ))}
        <Path d={path} stroke={colors.primary} strokeWidth={2.5} fill="none" />
        {points.map((p, i) => (
          <Circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={4}
            fill={colors.primary}
            stroke={colors.background}
            strokeWidth={2}
          />
        ))}
      </Svg>
      <View style={styles.legend}>
        <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 11 }}>
          Min {minW.toFixed(1)} kg
        </Text>
        <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 11 }}>
          Max {maxW.toFixed(1)} kg
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: "center", justifyContent: "center" },
  legend: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingHorizontal: 4,
  },
});
