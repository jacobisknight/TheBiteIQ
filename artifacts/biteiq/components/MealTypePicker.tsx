import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import type { MealType } from "@/types";

const MEALS: { key: MealType; label: string; icon: React.ComponentProps<typeof Feather>["name"] }[] = [
  { key: "breakfast", label: "Breakfast", icon: "sunrise" },
  { key: "lunch", label: "Lunch", icon: "sun" },
  { key: "dinner", label: "Dinner", icon: "moon" },
  { key: "snack", label: "Snack", icon: "coffee" },
];

export function MealTypePicker({
  value,
  onChange,
}: {
  value: MealType;
  onChange: (m: MealType) => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      {MEALS.map((m) => {
        const active = value === m.key;
        return (
          <Pressable
            key={m.key}
            onPress={() => onChange(m.key)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? colors.primary : colors.card,
                borderColor: active ? colors.primary : colors.border,
              },
            ]}
          >
            <Feather
              name={m.icon}
              size={14}
              color={active ? colors.primaryForeground : colors.foreground}
            />
            <Text
              style={[
                styles.text,
                { color: active ? colors.primaryForeground : colors.foreground },
              ]}
            >
              {m.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function inferMealType(d: Date = new Date()): MealType {
  const h = d.getHours();
  if (h < 10) return "breakfast";
  if (h < 14) return "lunch";
  if (h < 17) return "snack";
  if (h < 21) return "dinner";
  return "snack";
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  text: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
