import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import {
  coachChat,
  generateMealPlan,
  generateWorkoutPlan,
} from "@/lib/ai";
import { snapshotSummary } from "@/lib/health/format";
import type { HealthSnapshot } from "@/lib/health/types";
import { makeId } from "@/lib/storage";
import type { CoachMessage } from "@/types";

type Tab = "chat" | "meals" | "workouts";

function profileSummary(
  user: ReturnType<typeof useApp>["user"],
  snapshot: HealthSnapshot | null,
): string {
  if (!user) return "No profile on file.";
  const lines = [
    `Name: ${user.name}`,
    `Age: ${user.age}  Sex: ${user.sex}`,
    `Height: ${Math.round(user.heightCm)} cm  Weight: ${user.weightKg.toFixed(1)} kg`,
    `Activity: ${user.activity}  Goal: ${user.goal}${user.glp1Mode ? " (GLP-1)" : ""}`,
    `Daily target: ${user.dailyCalories} kcal, P ${user.proteinG}g / C ${user.carbsG}g / F ${user.fatG}g`,
  ];
  if (snapshot) {
    const summary = snapshotSummary(snapshot);
    if (summary && summary !== "No wearable data linked.") {
      lines.push(`Wearable signal: ${summary}`);
    }
  }
  return lines.join("\n");
}

const STARTER_PROMPTS = [
  "What should I eat tonight?",
  "Give me a quick upper-body workout",
  "How do I break a weight-loss plateau?",
  "Best high-protein snacks under 200 kcal?",
];

export default function CoachScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    user,
    coachMessages,
    addCoachMessage,
    clearCoachChat,
    mealPlan,
    setMealPlan,
    workoutPlan,
    setWorkoutPlan,
    healthSnapshot,
  } = useApp();

  const [tab, setTab] = useState<Tab>("chat");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMeal, setLoadingMeal] = useState(false);
  const [loadingWorkout, setLoadingWorkout] = useState(false);
  const [mealPrefs, setMealPrefs] = useState("");
  const [workoutDays, setWorkoutDays] = useState(4);
  const [workoutFocus, setWorkoutFocus] = useState("balanced");
  const scrollRef = useRef<ScrollView>(null);

  const profile = useMemo(
    () => profileSummary(user, healthSnapshot),
    [user, healthSnapshot],
  );

  useEffect(() => {
    if (tab === "chat") {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({ animated: false });
      });
    }
  }, [tab, coachMessages.length]);

  const send = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || sending) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const userMsg: CoachMessage = {
      id: makeId(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };
    await addCoachMessage(userMsg);
    setInput("");
    setSending(true);
    try {
      const reply = await coachChat({
        profile,
        history: coachMessages,
        message: text,
      });
      await addCoachMessage({
        id: makeId(),
        role: "assistant",
        content: reply,
        createdAt: Date.now(),
      });
    } catch {
      await addCoachMessage({
        id: makeId(),
        role: "assistant",
        content: "I couldn't reach the coach right now. Check your connection and try again.",
        createdAt: Date.now(),
      });
    } finally {
      setSending(false);
    }
  };

  const buildMealPlan = async () => {
    setLoadingMeal(true);
    try {
      const plan = await generateMealPlan({ profile, preferences: mealPrefs });
      await setMealPlan({ ...plan, createdAt: Date.now() });
    } catch {
      Alert.alert("Couldn't build a meal plan right now.");
    } finally {
      setLoadingMeal(false);
    }
  };

  const buildWorkoutPlan = async () => {
    setLoadingWorkout(true);
    try {
      const plan = await generateWorkoutPlan({
        profile,
        daysPerWeek: workoutDays,
        focus: workoutFocus,
      });
      await setWorkoutPlan({ ...plan, createdAt: Date.now() });
    } catch {
      Alert.alert("Couldn't build a workout plan right now.");
    } finally {
      setLoadingWorkout(false);
    }
  };

  const confirmClear = () => {
    Alert.alert("Clear chat?", "Your coach conversation will be deleted.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => clearCoachChat() },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 10, borderBottomColor: colors.border },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Health Coach</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Nutrition, training, and habit guidance — personalized.
          </Text>
        </View>
        {tab === "chat" && coachMessages.length > 0 ? (
          <Pressable onPress={confirmClear} style={styles.iconBtn} hitSlop={8}>
            <Feather name="trash-2" size={18} color={colors.mutedForeground} />
          </Pressable>
        ) : null}
      </View>

      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        {(
          [
            { key: "chat", label: "Chat", icon: "message-circle" as const },
            { key: "meals", label: "Meal Plan", icon: "coffee" as const },
            { key: "workouts", label: "Workouts", icon: "activity" as const },
          ] as const
        ).map((t) => {
          const active = tab === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[
                styles.tabItem,
                {
                  borderBottomColor: active ? colors.primary : "transparent",
                },
              ]}
            >
              <Feather
                name={t.icon}
                size={14}
                color={active ? colors.primary : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: active ? colors.primary : colors.mutedForeground },
                ]}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {tab === "chat" ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
          keyboardVerticalOffset={8}
        >
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{
              padding: 18,
              paddingBottom: 24,
              gap: 12,
            }}
            keyboardShouldPersistTaps="handled"
          >
            {coachMessages.length === 0 ? (
              <View style={{ gap: 14 }}>
                <View
                  style={[
                    styles.welcome,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Feather name="zap" size={18} color={colors.primary} />
                  <Text style={[styles.welcomeText, { color: colors.foreground }]}>
                    Ask anything about food, training, sleep, or habits. I know your
                    profile and targets.
                  </Text>
                </View>
                <Text
                  style={[
                    styles.starterLabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  TRY ASKING
                </Text>
                <View style={{ gap: 8 }}>
                  {STARTER_PROMPTS.map((p) => (
                    <Pressable
                      key={p}
                      onPress={() => send(p)}
                      style={[
                        styles.starter,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text style={{ color: colors.foreground, fontSize: 14, fontFamily: "Inter_500Medium" }}>
                        {p}
                      </Text>
                      <Feather name="arrow-up-right" size={16} color={colors.mutedForeground} />
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : (
              coachMessages.map((m) => (
                <View
                  key={m.id}
                  style={[
                    styles.bubble,
                    m.role === "user"
                      ? { alignSelf: "flex-end", backgroundColor: colors.primary }
                      : {
                          alignSelf: "flex-start",
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                          borderWidth: 1,
                        },
                  ]}
                >
                  <Text
                    style={[
                      styles.bubbleText,
                      {
                        color:
                          m.role === "user"
                            ? colors.primaryForeground
                            : colors.foreground,
                      },
                    ]}
                  >
                    {m.content}
                  </Text>
                </View>
              ))
            )}
            {sending ? (
              <View
                style={[
                  styles.bubble,
                  {
                    alignSelf: "flex-start",
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderWidth: 1,
                    flexDirection: "row",
                    gap: 8,
                    alignItems: "center",
                  },
                ]}
              >
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_500Medium" }}>
                  Thinking…
                </Text>
              </View>
            ) : null}
          </ScrollView>

          <View
            style={[
              styles.composer,
              {
                backgroundColor: colors.background,
                borderTopColor: colors.border,
                paddingBottom: Math.max(insets.bottom, 10),
              },
            ]}
          >
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask your coach…"
              placeholderTextColor={colors.mutedForeground}
              multiline
              style={[
                styles.composerInput,
                {
                  color: colors.foreground,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            />
            <Pressable
              onPress={() => send()}
              disabled={sending || !input.trim()}
              style={({ pressed }) => [
                styles.sendBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: !input.trim() || sending ? 0.5 : pressed ? 0.85 : 1,
                },
              ]}
            >
              <Feather name="send" size={18} color={colors.primaryForeground} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      ) : null}

      {tab === "meals" ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 18,
            paddingBottom: insets.bottom + 40,
            gap: 14,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.controls,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.controlsLabel, { color: colors.mutedForeground }]}>
              PREFERENCES (OPTIONAL)
            </Text>
            <TextInput
              value={mealPrefs}
              onChangeText={setMealPrefs}
              placeholder="e.g. vegetarian, no dairy, quick prep"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.controlsInput,
                { color: colors.foreground, borderColor: colors.border },
              ]}
            />
            <Pressable
              onPress={buildMealPlan}
              disabled={loadingMeal}
              style={({ pressed }) => [
                styles.buildBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: loadingMeal ? 0.7 : pressed ? 0.85 : 1,
                },
              ]}
            >
              {loadingMeal ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <Feather name="refresh-cw" size={16} color={colors.primaryForeground} />
              )}
              <Text style={[styles.buildBtnText, { color: colors.primaryForeground }]}>
                {mealPlan ? "Regenerate plan" : "Build my meal plan"}
              </Text>
            </Pressable>
          </View>

          {mealPlan ? (
            <>
              {mealPlan.summary ? (
                <Text
                  style={[styles.planSummary, { color: colors.mutedForeground }]}
                >
                  {mealPlan.summary}
                </Text>
              ) : null}
              {mealPlan.meals.map((m, i) => (
                <View
                  key={i}
                  style={[
                    styles.planCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.planRow}>
                    <Text
                      style={[
                        styles.planChip,
                        {
                          color: colors.primary,
                          backgroundColor: colors.primarySoft,
                        },
                      ]}
                    >
                      {m.mealType.toUpperCase()}
                    </Text>
                    <Text style={[styles.planKcal, { color: colors.foreground }]}>
                      {m.calories} kcal
                    </Text>
                  </View>
                  <Text style={[styles.planName, { color: colors.foreground }]}>
                    {m.name}
                  </Text>
                  {m.description ? (
                    <Text
                      style={[styles.planDesc, { color: colors.mutedForeground }]}
                    >
                      {m.description}
                    </Text>
                  ) : null}
                  <View style={styles.macros}>
                    <Text style={[styles.macro, { color: colors.protein }]}>
                      P {m.protein}g
                    </Text>
                    <Text style={[styles.macro, { color: colors.carbs }]}>
                      C {m.carbs}g
                    </Text>
                    <Text style={[styles.macro, { color: colors.fat }]}>
                      F {m.fat}g
                    </Text>
                  </View>
                </View>
              ))}
            </>
          ) : (
            <EmptyHint
              icon="coffee"
              title="No plan yet"
              hint="Build a one-day plan tuned to your calorie and macro targets."
            />
          )}
        </ScrollView>
      ) : null}

      {tab === "workouts" ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 18,
            paddingBottom: insets.bottom + 40,
            gap: 14,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.controls,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.controlsLabel, { color: colors.mutedForeground }]}>
              DAYS PER WEEK
            </Text>
            <View style={styles.chipsRow}>
              {[3, 4, 5, 6].map((d) => {
                const active = d === workoutDays;
                return (
                  <Pressable
                    key={d}
                    onPress={() => setWorkoutDays(d)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? colors.primary : "transparent",
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: active ? colors.primaryForeground : colors.foreground,
                        fontFamily: "Inter_700Bold",
                        fontSize: 13,
                      }}
                    >
                      {d}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text
              style={[styles.controlsLabel, { color: colors.mutedForeground, marginTop: 10 }]}
            >
              FOCUS
            </Text>
            <View style={styles.chipsRow}>
              {["balanced", "strength", "cardio", "mobility"].map((f) => {
                const active = f === workoutFocus;
                return (
                  <Pressable
                    key={f}
                    onPress={() => setWorkoutFocus(f)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? colors.primary : "transparent",
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: active ? colors.primaryForeground : colors.foreground,
                        fontFamily: "Inter_600SemiBold",
                        fontSize: 13,
                      }}
                    >
                      {f}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              onPress={buildWorkoutPlan}
              disabled={loadingWorkout}
              style={({ pressed }) => [
                styles.buildBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: loadingWorkout ? 0.7 : pressed ? 0.85 : 1,
                  marginTop: 14,
                },
              ]}
            >
              {loadingWorkout ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <Feather name="refresh-cw" size={16} color={colors.primaryForeground} />
              )}
              <Text style={[styles.buildBtnText, { color: colors.primaryForeground }]}>
                {workoutPlan ? "Regenerate plan" : "Build my workout plan"}
              </Text>
            </Pressable>
          </View>

          {workoutPlan ? (
            <>
              {workoutPlan.summary ? (
                <Text
                  style={[styles.planSummary, { color: colors.mutedForeground }]}
                >
                  {workoutPlan.summary}
                </Text>
              ) : null}
              {workoutPlan.days.map((d, i) => (
                <View
                  key={i}
                  style={[
                    styles.planCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.planRow}>
                    <Text
                      style={[
                        styles.planChip,
                        {
                          color: colors.primary,
                          backgroundColor: colors.primarySoft,
                        },
                      ]}
                    >
                      {d.day.toUpperCase()}
                    </Text>
                    {d.durationMin ? (
                      <Text style={[styles.planKcal, { color: colors.foreground }]}>
                        {d.durationMin} minutes
                      </Text>
                    ) : null}
                  </View>
                  <Text style={[styles.planName, { color: colors.foreground }]}>
                    {d.focus}
                  </Text>
                  <View style={{ gap: 14, marginTop: 10 }}>
                    {d.exercises.map((ex, j) => (
                      <View
                        key={j}
                        style={{
                          gap: 6,
                          paddingTop: j === 0 ? 0 : 12,
                          borderTopWidth: j === 0 ? 0 : 1,
                          borderTopColor: colors.border,
                        }}
                      >
                        <Text
                          style={{
                            color: colors.foreground,
                            fontFamily: "Inter_700Bold",
                            fontSize: 15,
                          }}
                        >
                          {j + 1}. {ex.name}
                        </Text>
                        {ex.sets ? (
                          <Text
                            style={{
                              color: colors.foreground,
                              fontSize: 13,
                              fontFamily: "Inter_600SemiBold",
                            }}
                          >
                            {ex.sets}
                          </Text>
                        ) : null}
                        {ex.howTo ? (
                          <View style={{ gap: 2 }}>
                            <Text
                              style={{
                                color: colors.mutedForeground,
                                fontSize: 11,
                                fontFamily: "Inter_700Bold",
                                letterSpacing: 1,
                              }}
                            >
                              HOW TO DO IT
                            </Text>
                            <Text
                              style={{
                                color: colors.foreground,
                                fontSize: 13,
                                fontFamily: "Inter_500Medium",
                                lineHeight: 19,
                              }}
                            >
                              {ex.howTo}
                            </Text>
                          </View>
                        ) : null}
                        {ex.whyItHelps ? (
                          <View style={{ gap: 2 }}>
                            <Text
                              style={{
                                color: colors.mutedForeground,
                                fontSize: 11,
                                fontFamily: "Inter_700Bold",
                                letterSpacing: 1,
                              }}
                            >
                              WHY IT HELPS
                            </Text>
                            <Text
                              style={{
                                color: colors.foreground,
                                fontSize: 13,
                                fontFamily: "Inter_500Medium",
                                lineHeight: 19,
                              }}
                            >
                              {ex.whyItHelps}
                            </Text>
                          </View>
                        ) : null}
                        {ex.notes ? (
                          <Text
                            style={{
                              color: colors.mutedForeground,
                              fontSize: 12,
                              fontFamily: "Inter_500Medium",
                              fontStyle: "italic",
                            }}
                          >
                            Tip: {ex.notes}
                          </Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </>
          ) : (
            <EmptyHint
              icon="activity"
              title="No plan yet"
              hint="Generate a weekly split tuned to your goal and available days."
            />
          )}
        </ScrollView>
      ) : null}
    </View>
  );
}

function EmptyHint({
  icon,
  title,
  hint,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  title: string;
  hint: string;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.empty,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Feather name={icon} size={22} color={colors.primary} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
        {hint}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { padding: 6 },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  subtitle: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
  },
  tabLabel: { fontSize: 13, fontFamily: "Inter_700Bold" },
  welcome: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  welcomeText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    lineHeight: 20,
  },
  starterLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
    marginTop: 4,
  },
  starter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  bubble: {
    maxWidth: "88%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleText: { fontSize: 14, fontFamily: "Inter_500Medium", lineHeight: 20 },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  composerInput: {
    flex: 1,
    maxHeight: 120,
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  controls: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
  },
  controlsLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
  },
  controlsInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  buildBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 4,
  },
  buildBtnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  planSummary: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    lineHeight: 19,
    paddingHorizontal: 4,
  },
  planCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
  },
  planRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  planChip: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: "hidden",
  },
  planKcal: { fontSize: 13, fontFamily: "Inter_700Bold" },
  planName: { fontSize: 17, fontFamily: "Inter_700Bold", marginTop: 6 },
  planDesc: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    lineHeight: 18,
    marginTop: 4,
  },
  macros: { flexDirection: "row", gap: 14, marginTop: 8 },
  macro: { fontSize: 12, fontFamily: "Inter_700Bold" },
  empty: {
    alignItems: "center",
    gap: 8,
    padding: 26,
    borderRadius: 18,
    borderWidth: 1,
  },
  emptyTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  emptyHint: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    lineHeight: 19,
  },
});
