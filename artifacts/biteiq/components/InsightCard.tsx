import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { getCoachingTip, UpgradeRequiredError } from "@/lib/ai";
import { profileSummaryForAI } from "@/lib/nutrition";
import { useApp } from "@/context/AppContext";

export function InsightCard() {
  const colors = useColors();
  const { user, todayTotals, todayMeals, meals } = useApp();
  const [tip, setTip] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTip = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const summary = profileSummaryForAI(user, todayTotals);
      const recent = meals
        .slice(0, 8)
        .map(
          (m) =>
            `${m.mealType}: ${m.items.map((i) => `${i.name} (${i.calories}kcal)`).join(", ")}`,
        )
        .join("\n");
      const result = await getCoachingTip({
        summary,
        recentMeals: recent || "No meals logged yet today.",
      });
      setTip(result);
    } catch (err) {
      setError(
        err instanceof UpgradeRequiredError
          ? "You've used today's free tips. BiteIQ Pro unlocks unlimited coaching."
          : "Coaching unavailable right now.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadTip();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayMeals.length, user?.dailyCalories]);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <View style={[styles.iconChip, { backgroundColor: colors.primarySoft }]}>
          <Feather name="zap" size={14} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>BiteIQ Coach</Text>
        <TouchableOpacity onPress={loadTip} hitSlop={10}>
          <Feather name="refresh-cw" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <Text style={[styles.body, { color: colors.mutedForeground }]}>{error}</Text>
      ) : (
        <Text style={[styles.body, { color: colors.foreground }]}>
          {tip ?? "Log a meal to get personalized coaching."}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconChip: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.2,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: "Inter_500Medium",
  },
  loading: { paddingVertical: 12 },
});
