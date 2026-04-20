import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import type { MealEntry } from "@/types";

const SOURCE_ICON: Record<MealEntry["source"], React.ComponentProps<typeof Feather>["name"]> = {
  photo: "camera",
  voice: "mic",
  search: "search",
  manual: "edit-2",
};

interface Props {
  meal: MealEntry;
  onEdit?: (meal: MealEntry) => void;
}

export function MealCard({ meal, onEdit }: Props) {
  const colors = useColors();
  const { deleteMeal } = useApp();
  const totals = meal.items.reduce(
    (acc, it) => ({
      calories: acc.calories + it.calories,
      protein: acc.protein + it.protein,
      carbs: acc.carbs + it.carbs,
      fat: acc.fat + it.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const confirmDelete = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert("Delete entry?", "This meal will be removed.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteMeal(meal.id),
      },
    ]);
  };

  const time = new Date(meal.loggedAt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
          <Feather name={SOURCE_ICON[meal.source]} size={14} color={colors.primary} />
        </View>
        <Text style={[styles.time, { color: colors.mutedForeground }]}>{time}</Text>
        <Text style={[styles.cal, { color: colors.foreground }]}>
          {Math.round(totals.calories)} kcal
        </Text>
        {onEdit ? (
          <Pressable onPress={() => onEdit(meal)} hitSlop={8}>
            <Feather name="edit-2" size={16} color={colors.mutedForeground} />
          </Pressable>
        ) : null}
        <Pressable onPress={confirmDelete} hitSlop={8}>
          <Feather name="trash-2" size={16} color={colors.mutedForeground} />
        </Pressable>
      </View>
      <View style={{ gap: 6 }}>
        {meal.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
                {item.name}
              </Text>
              {item.servingDescription ? (
                <Text style={[styles.itemServing, { color: colors.mutedForeground }]}>
                  {item.servingDescription}
                </Text>
              ) : null}
            </View>
            <Text style={[styles.itemCal, { color: colors.mutedForeground }]}>
              {Math.round(item.calories)} kcal
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.macroRow}>
        <MacroPill label="P" value={totals.protein} color={colors.protein} />
        <MacroPill label="C" value={totals.carbs} color={colors.carbs} />
        <MacroPill label="F" value={totals.fat} color={colors.fat} />
      </View>
    </View>
  );
}

function MacroPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.pill, { borderColor: color + "55" }]}>
      <View style={[styles.pillDot, { backgroundColor: color }]} />
      <Text style={[styles.pillText, { color }]}>
        {label} {Math.round(value)}g
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  icon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  time: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.4,
  },
  cal: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  itemServing: { fontSize: 11, fontFamily: "Inter_500Medium", marginTop: 2 },
  itemCal: { fontSize: 12, fontFamily: "Inter_500Medium" },
  macroRow: { flexDirection: "row", gap: 8 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillDot: { width: 5, height: 5, borderRadius: 999 },
  pillText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
});
