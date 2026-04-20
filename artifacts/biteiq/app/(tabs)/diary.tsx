import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MealCard } from "@/components/MealCard";
import { SectionHeader } from "@/components/SectionHeader";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { sumMeals, todayKey } from "@/lib/nutrition";
import type { MealEntry, MealType } from "@/types";

const ORDER: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
const TITLES: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};

function shiftDate(d: string, days: number): string {
  const date = new Date(d);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function formatDate(d: string): string {
  if (d === todayKey()) return "Today";
  if (d === shiftDate(todayKey(), -1)) return "Yesterday";
  const date = new Date(d);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function DiaryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { meals, user } = useApp();
  const [date, setDate] = useState(todayKey());

  const dayMeals = useMemo(
    () => meals.filter((m) => m.date === date),
    [meals, date],
  );
  const totals = useMemo(() => sumMeals(dayMeals), [dayMeals]);

  const grouped: Record<MealType, MealEntry[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  };
  dayMeals.forEach((m) => grouped[m.mealType].push(m));

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: 140,
        paddingHorizontal: 18,
        gap: 18,
      }}
    >
      <View style={styles.dateRow}>
        <Pressable
          hitSlop={10}
          onPress={() => setDate(shiftDate(date, -1))}
          style={[styles.arrow, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Feather name="chevron-left" size={20} color={colors.foreground} />
        </Pressable>
        <View style={{ alignItems: "center" }}>
          <Text style={[styles.dateLabel, { color: colors.foreground }]}>
            {formatDate(date)}
          </Text>
          <Text style={[styles.dateMeta, { color: colors.mutedForeground }]}>
            {Math.round(totals.calories)} / {user?.dailyCalories ?? 0} kcal
          </Text>
        </View>
        <Pressable
          hitSlop={10}
          onPress={() => {
            const next = shiftDate(date, 1);
            if (next <= todayKey()) setDate(next);
          }}
          style={[
            styles.arrow,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: date === todayKey() ? 0.4 : 1,
            },
          ]}
        >
          <Feather name="chevron-right" size={20} color={colors.foreground} />
        </Pressable>
      </View>

      <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SummaryStat label="P" value={totals.protein} color={colors.protein} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <SummaryStat label="C" value={totals.carbs} color={colors.carbs} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <SummaryStat label="F" value={totals.fat} color={colors.fat} />
      </View>

      {ORDER.map((mealType) => (
        <View key={mealType} style={{ gap: 10 }}>
          <SectionHeader
            label={TITLES[mealType].toUpperCase()}
            hint={
              grouped[mealType].length === 0
                ? "Nothing logged"
                : `${grouped[mealType].reduce(
                    (acc, m) => acc + m.items.reduce((a, i) => a + i.calories, 0),
                    0,
                  )} kcal`
            }
            right={
              date === todayKey() ? (
                <Pressable
                  onPress={() => router.push("/(tabs)/add")}
                  hitSlop={8}
                >
                  <Feather name="plus" size={18} color={colors.primary} />
                </Pressable>
              ) : null
            }
          />
          {grouped[mealType].length === 0 ? (
            <View
              style={[
                styles.placeholder,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text
                style={{
                  color: colors.mutedForeground,
                  fontFamily: "Inter_500Medium",
                  fontSize: 13,
                }}
              >
                No {TITLES[mealType].toLowerCase()} yet
              </Text>
            </View>
          ) : (
            grouped[mealType].map((m) => <MealCard key={m.id} meal={m} />)
          )}
        </View>
      ))}
    </ScrollView>
  );
}

function SummaryStat({ label, value, color }: { label: string; value: number; color: string }) {
  const colors = useColors();
  return (
    <View style={{ flex: 1, alignItems: "center", gap: 4 }}>
      <Text
        style={{
          color: colors.mutedForeground,
          fontFamily: "Inter_700Bold",
          fontSize: 11,
          letterSpacing: 1.5,
        }}
      >
        {label}
      </Text>
      <Text style={{ color, fontFamily: "Inter_700Bold", fontSize: 18 }}>
        {Math.round(value)}g
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  arrow: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  dateLabel: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  dateMeta: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 4 },
  summary: {
    flexDirection: "row",
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  divider: { width: 1, marginVertical: 4 },
  placeholder: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
});
