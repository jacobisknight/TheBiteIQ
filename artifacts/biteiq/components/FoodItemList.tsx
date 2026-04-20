import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import type { FoodItem } from "@/types";

interface Props {
  items: FoodItem[];
  onRemove?: (id: string) => void;
}

export function FoodItemList({ items, onRemove }: Props) {
  const colors = useColors();
  if (items.length === 0) return null;
  return (
    <View style={{ gap: 8 }}>
      {items.map((it) => (
        <View
          key={it.id}
          style={[
            styles.row,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: colors.foreground }]}>{it.name}</Text>
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>
              {it.servingDescription ?? "1 serving"} · {Math.round(it.calories)} kcal
            </Text>
            <Text style={[styles.macros, { color: colors.mutedForeground }]}>
              <Text style={{ color: colors.protein }}>P {Math.round(it.protein)}g</Text>
              {"   "}
              <Text style={{ color: colors.carbs }}>C {Math.round(it.carbs)}g</Text>
              {"   "}
              <Text style={{ color: colors.fat }}>F {Math.round(it.fat)}g</Text>
            </Text>
          </View>
          {onRemove ? (
            <Pressable onPress={() => onRemove(it.id)} hitSlop={10}>
              <Feather name="x" size={18} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  name: { fontSize: 14, fontFamily: "Inter_700Bold" },
  meta: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  macros: { fontSize: 11, fontFamily: "Inter_600SemiBold", marginTop: 4 },
});
