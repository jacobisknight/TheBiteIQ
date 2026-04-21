import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CalorieRing } from "@/components/CalorieRing";
import { InsightCard } from "@/components/InsightCard";
import { MacroBar } from "@/components/MacroBar";
import { MealCard } from "@/components/MealCard";
import { SectionHeader } from "@/components/SectionHeader";
import { StreakBadge } from "@/components/StreakBadge";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, todayTotals, todayMeals, streak, healthSnapshot } = useApp();

  if (!user) return null;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: 120,
        paddingHorizontal: 18,
        gap: 22,
      }}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.hello, { color: colors.mutedForeground }]}>
            {greeting()}
          </Text>
          <Text style={[styles.name, { color: colors.foreground }]}>
            {user.name || "Welcome"}
          </Text>
        </View>
        <StreakBadge days={streak} />
      </View>

      {user.goal === "glp1" || user.glp1Mode ? (
        <View
          style={[
            styles.glp1,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.glp1Dot,
              { backgroundColor: colors.glp1 },
            ]}
          />
          <Text
            style={[
              styles.glp1Text,
              { color: colors.foreground },
            ]}
          >
            GLP-1 mode · prioritizing protein and gentle calorie deficit
          </Text>
        </View>
      ) : null}

      <View
        style={[
          styles.heroCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <CalorieRing consumed={todayTotals.calories} goal={user.dailyCalories} />
        <View style={styles.macroStack}>
          <MacroBar
            label="PROTEIN"
            current={todayTotals.protein}
            goal={user.proteinG}
            color={colors.protein}
          />
          <MacroBar
            label="CARBS"
            current={todayTotals.carbs}
            goal={user.carbsG}
            color={colors.carbs}
          />
          <MacroBar
            label="FAT"
            current={todayTotals.fat}
            goal={user.fatG}
            color={colors.fat}
          />
        </View>
      </View>

      {healthSnapshot &&
      (healthSnapshot.steps != null ||
        healthSnapshot.activeCalories != null ||
        healthSnapshot.recovery != null ||
        healthSnapshot.readiness != null) ? (
        <View style={styles.metricsRow}>
          {healthSnapshot.steps != null ? (
            <MetricChip
              icon="navigation"
              label="STEPS"
              value={`${Math.round(healthSnapshot.steps).toLocaleString()}`}
              color={colors.primary}
            />
          ) : null}
          {healthSnapshot.activeCalories != null ? (
            <MetricChip
              icon="zap"
              label="ACTIVE"
              value={`${Math.round(healthSnapshot.activeCalories)}`}
              suffix="kcal"
              color={colors.accent}
            />
          ) : null}
          {healthSnapshot.recovery != null ? (
            <MetricChip
              icon="heart"
              label="RECOVERY"
              value={`${Math.round(healthSnapshot.recovery)}`}
              suffix="%"
              color={colors.glp1}
            />
          ) : healthSnapshot.readiness != null ? (
            <MetricChip
              icon="heart"
              label="READINESS"
              value={`${Math.round(healthSnapshot.readiness)}`}
              color={colors.glp1}
            />
          ) : null}
        </View>
      ) : null}

      <Pressable
        onPress={() => router.push("/coach")}
        style={({ pressed }) => [
          styles.coachCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.primary,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <View style={[styles.coachIcon, { backgroundColor: colors.primarySoft }]}>
          <Feather name="zap" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.coachTitle, { color: colors.foreground }]}>
            AI Health Coach
          </Text>
          <Text style={[styles.coachHint, { color: colors.mutedForeground }]}>
            Meal plans, workouts, and habit tips
          </Text>
        </View>
        <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
      </Pressable>

      <View style={styles.quickRow}>
        <QuickAction
          icon="camera"
          label="Photo"
          color={colors.primary}
          bg={colors.primarySoft}
          onPress={() => router.push("/logging/photo")}
        />
        <QuickAction
          icon="mic"
          label="Voice"
          color={colors.accent}
          bg={colors.accentSoft}
          onPress={() => router.push("/logging/voice")}
        />
        <QuickAction
          icon="search"
          label="Search"
          color={colors.glp1}
          bg="#241B36"
          onPress={() => router.push("/logging/search")}
        />
      </View>

      <InsightCard />

      <View style={{ gap: 12 }}>
        <SectionHeader
          label="TODAY"
          hint={
            todayMeals.length === 0
              ? "Nothing logged yet — tap +"
              : `${todayMeals.length} entries`
          }
        />
        {todayMeals.length === 0 ? (
          <View
            style={[
              styles.empty,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Feather name="coffee" size={22} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Log your first meal to start your streak.
            </Text>
          </View>
        ) : (
          todayMeals.map((m) => <MealCard key={m.id} meal={m} />)
        )}
      </View>
    </ScrollView>
  );
}

function MetricChip({
  icon,
  label,
  value,
  suffix,
  color,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value: string;
  suffix?: string;
  color: string;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.metric,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Feather name={icon} size={14} color={color} />
      <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <Text style={[styles.metricValue, { color: colors.foreground }]}>
        {value}
        {suffix ? (
          <Text style={[styles.metricSuffix, { color: colors.mutedForeground }]}>
            {" "}
            {suffix}
          </Text>
        ) : null}
      </Text>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  color,
  bg,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  color: string;
  bg: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quick,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={[styles.quickIcon, { backgroundColor: bg }]}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.quickLabel, { color: colors.foreground }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hello: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  name: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    marginTop: 4,
  },
  glp1: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  glp1Dot: { width: 8, height: 8, borderRadius: 999 },
  glp1Text: { fontSize: 12, fontFamily: "Inter_600SemiBold", flex: 1 },
  heroCard: {
    borderRadius: 28,
    padding: 22,
    alignItems: "center",
    gap: 24,
    borderWidth: 1,
  },
  macroStack: { width: "100%", gap: 14 },
  quickRow: {
    flexDirection: "row",
    gap: 10,
  },
  coachCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  coachIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  coachTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  coachHint: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  quick: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    gap: 10,
    borderWidth: 1,
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  empty: {
    padding: 22,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    gap: 10,
  },
  emptyText: { fontSize: 13, fontFamily: "Inter_500Medium", textAlign: "center" },
  metricsRow: { flexDirection: "row", gap: 8 },
  metric: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 4,
  },
  metricLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
    marginTop: 2,
  },
  metricValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  metricSuffix: { fontSize: 11, fontFamily: "Inter_500Medium" },
});
