import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SectionHeader } from "@/components/SectionHeader";
import { WeightChart } from "@/components/WeightChart";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { sumMeals, todayKey } from "@/lib/nutrition";

export default function ProgressScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { weights, addWeight, meals, user, streak } = useApp();
  const { width } = useWindowDimensions();
  const [input, setInput] = useState("");

  const sortedWeights = useMemo(
    () => [...weights].sort((a, b) => a.loggedAt - b.loggedAt),
    [weights],
  );
  const startW = sortedWeights[0]?.weightKg;
  const currentW = sortedWeights[sortedWeights.length - 1]?.weightKg;
  const delta = startW != null && currentW != null ? currentW - startW : 0;

  const last7 = useMemo(() => {
    const days: { date: string; calories: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const dayMeals = meals.filter((m) => m.date === key);
      days.push({ date: key, calories: sumMeals(dayMeals).calories });
    }
    return days;
  }, [meals]);

  const avg7 = Math.round(last7.reduce((a, d) => a + d.calories, 0) / 7);
  const daysHittingTarget = last7.filter(
    (d) =>
      user && d.calories > 0 && Math.abs(d.calories - user.dailyCalories) < user.dailyCalories * 0.15,
  ).length;

  const submitWeight = async () => {
    const v = parseFloat(input.replace(",", "."));
    if (Number.isNaN(v) || v < 20 || v > 400) {
      Alert.alert("Enter a valid weight in kg.");
      return;
    }
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await addWeight(v);
    setInput("");
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: 140,
        paddingHorizontal: 18,
        gap: 22,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View>
        <Text style={[styles.title, { color: colors.foreground }]}>Progress</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Trends across weight, calories, and streak.
        </Text>
      </View>

      <View style={styles.statsRow}>
        <StatCard
          label="STREAK"
          value={`${streak}`}
          unit="days"
          color={colors.accent}
        />
        <StatCard
          label="AVG 7D"
          value={Number.isFinite(avg7) ? `${avg7}` : "0"}
          unit="kcal"
          color={colors.primary}
        />
        <StatCard
          label="ON TARGET"
          value={`${daysHittingTarget}`}
          unit="of 7"
          color={colors.glp1}
        />
      </View>

      <View
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Weight
            </Text>
            <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
              {currentW
                ? `${currentW.toFixed(1)} kg current · ${delta >= 0 ? "+" : ""}${delta.toFixed(1)} kg overall`
                : "No entries yet"}
            </Text>
          </View>
          <Feather name="activity" size={18} color={colors.primary} />
        </View>
        <WeightChart entries={weights} width={width - 70} />
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Log weight</Text>
        <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
          Quick check-ins help your coach calibrate.
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Weight in kg"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
            style={[
              styles.input,
              {
                color: colors.foreground,
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          />
          <Pressable
            onPress={submitWeight}
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Feather name="plus" size={18} color={colors.primaryForeground} />
            <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>
              Save
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <SectionHeader label="LAST 7 DAYS" />
        <View
          style={[
            styles.weekCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {last7.map((d) => {
            const ratio =
              user && user.dailyCalories > 0
                ? Math.min(1, d.calories / user.dailyCalories)
                : 0;
            const date = new Date(d.date);
            return (
              <View key={d.date} style={styles.dayCol}>
                <View style={[styles.barTrack, { backgroundColor: colors.ringTrack }]}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${ratio * 100}%`,
                        backgroundColor:
                          d.date === todayKey() ? colors.accent : colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={{
                    color: colors.mutedForeground,
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 11,
                  }}
                >
                  {date.toLocaleDateString(undefined, { weekday: "narrow" })}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.stat,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statUnit, { color: colors.mutedForeground }]}>{unit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.6 },
  subtitle: { fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 4 },
  statsRow: { flexDirection: "row", gap: 10 },
  stat: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
  },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold", marginTop: 4 },
  statUnit: { fontSize: 11, fontFamily: "Inter_500Medium" },
  card: {
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    gap: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  cardMeta: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  inputRow: { flexDirection: "row", gap: 10 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  ctaText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  weekCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 160,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
  },
  dayCol: { flex: 1, alignItems: "center", gap: 8, height: "100%" },
  barTrack: {
    width: 16,
    flex: 1,
    borderRadius: 999,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  barFill: { width: "100%", borderRadius: 999 },
});
