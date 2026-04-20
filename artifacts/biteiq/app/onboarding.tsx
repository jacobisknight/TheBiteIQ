import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PrimaryButton } from "@/components/PrimaryButton";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { buildPlan } from "@/lib/nutrition";
import type { ActivityLevel, Goal, Sex } from "@/types";

const ACTIVITY: { key: ActivityLevel; label: string; hint: string }[] = [
  { key: "sedentary", label: "Sedentary", hint: "Desk, very little movement" },
  { key: "light", label: "Light", hint: "Walks, light workouts 1–3×/wk" },
  { key: "moderate", label: "Moderate", hint: "Workouts 3–5×/wk" },
  { key: "active", label: "Active", hint: "Hard training 6–7×/wk" },
  { key: "very_active", label: "Very active", hint: "Athlete or physical job" },
];

const GOALS: { key: Goal; label: string; hint: string }[] = [
  { key: "lose", label: "Lose weight", hint: "Steady deficit, ~0.5 kg/wk" },
  { key: "maintain", label: "Maintain", hint: "Hold current weight" },
  { key: "gain", label: "Gain weight", hint: "Lean surplus" },
  { key: "glp1", label: "GLP-1 mode", hint: "On a GLP-1 medication" },
];

export default function Onboarding() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useApp();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<Sex>("male");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [activity, setActivity] = useState<ActivityLevel>("moderate");
  const [goal, setGoal] = useState<Goal>("maintain");
  const [glp1Mode, setGlp1Mode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const totalSteps = 5;
  const canNext = (() => {
    if (step === 0) return name.trim().length > 0 && Number(age) > 0;
    if (step === 1) return Number(heightCm) > 0 && Number(weightKg) > 0;
    return true;
  })();

  const finish = async () => {
    setSubmitting(true);
    try {
      await completeOnboarding({
        name: name.trim() || "Friend",
        age: Number(age),
        sex,
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
        activity,
        goal,
        glp1Mode: glp1Mode || goal === "glp1",
      });
    } catch {
      Alert.alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (step < totalSteps - 1) setStep(step + 1);
    else finish();
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  const preview = (() => {
    if (!Number(heightCm) || !Number(weightKg) || !Number(age)) return null;
    return buildPlan({
      age: Number(age),
      sex,
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      activity,
      goal,
      glp1Mode: glp1Mode || goal === "glp1",
    });
  })();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 24,
          paddingHorizontal: 22,
          paddingBottom: 40,
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <Text style={[styles.brand, { color: colors.primary }]}>BiteIQ</Text>
          <Text style={[styles.stepCounter, { color: colors.mutedForeground }]}>
            {step + 1} / {totalSteps}
          </Text>
        </View>

        <View style={[styles.progressBar, { backgroundColor: colors.ringTrack }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: `${((step + 1) / totalSteps) * 100}%`,
              },
            ]}
          />
        </View>

        <View style={{ marginTop: 32, flex: 1 }}>
          {step === 0 ? (
            <StepContainer
              title="Let's get to know you"
              subtitle="A couple of quick details to personalize your targets."
            >
              <Field
                label="What should we call you?"
                value={name}
                onChangeText={setName}
                placeholder="Your name"
              />
              <Field
                label="Age"
                value={age}
                onChangeText={setAge}
                placeholder="32"
                keyboardType="number-pad"
              />
              <SegPicker
                label="Sex"
                value={sex}
                options={[
                  { key: "male", label: "Male" },
                  { key: "female", label: "Female" },
                ]}
                onChange={(v) => setSex(v as Sex)}
              />
            </StepContainer>
          ) : null}

          {step === 1 ? (
            <StepContainer
              title="Body basics"
              subtitle="Used to calculate your BMR with the Mifflin-St Jeor formula."
            >
              <Field
                label="Height (cm)"
                value={heightCm}
                onChangeText={setHeightCm}
                placeholder="178"
                keyboardType="number-pad"
              />
              <Field
                label="Weight (kg)"
                value={weightKg}
                onChangeText={setWeightKg}
                placeholder="74"
                keyboardType="decimal-pad"
              />
            </StepContainer>
          ) : null}

          {step === 2 ? (
            <StepContainer
              title="How active are you?"
              subtitle="Daily movement, not just gym."
            >
              <View style={{ gap: 10 }}>
                {ACTIVITY.map((a) => (
                  <OptionRow
                    key={a.key}
                    selected={activity === a.key}
                    label={a.label}
                    hint={a.hint}
                    onPress={() => setActivity(a.key)}
                  />
                ))}
              </View>
            </StepContainer>
          ) : null}

          {step === 3 ? (
            <StepContainer
              title="What's your goal?"
              subtitle="We'll set your daily calories and macros."
            >
              <View style={{ gap: 10 }}>
                {GOALS.map((g) => (
                  <OptionRow
                    key={g.key}
                    selected={goal === g.key}
                    label={g.label}
                    hint={g.hint}
                    accent={g.key === "glp1" ? colors.glp1 : undefined}
                    onPress={() => {
                      setGoal(g.key);
                      if (g.key === "glp1") setGlp1Mode(true);
                    }}
                  />
                ))}
              </View>
              <View
                style={[
                  styles.glp1Toggle,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleLabel, { color: colors.foreground }]}>
                    GLP-1 reminders
                  </Text>
                  <Text
                    style={[
                      styles.toggleHint,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    Higher protein and gentle nudges around appetite swings.
                  </Text>
                </View>
                <Switch
                  value={glp1Mode}
                  onValueChange={setGlp1Mode}
                  trackColor={{ false: colors.ringTrack, true: colors.glp1 }}
                  thumbColor={colors.foreground}
                />
              </View>
            </StepContainer>
          ) : null}

          {step === 4 ? (
            <StepContainer
              title="Your daily plan"
              subtitle="You can adjust anything later in Profile."
            >
              {preview ? (
                <View
                  style={[
                    styles.planCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.planLabel, { color: colors.mutedForeground }]}>
                    DAILY CALORIES
                  </Text>
                  <Text style={[styles.planValue, { color: colors.foreground }]}>
                    {preview.dailyCalories}
                  </Text>
                  <View style={styles.macroRow}>
                    <MacroPreview
                      label="Protein"
                      value={preview.proteinG}
                      color={colors.protein}
                    />
                    <MacroPreview
                      label="Carbs"
                      value={preview.carbsG}
                      color={colors.carbs}
                    />
                    <MacroPreview
                      label="Fat"
                      value={preview.fatG}
                      color={colors.fat}
                    />
                  </View>
                </View>
              ) : (
                <Text style={{ color: colors.mutedForeground }}>
                  Add your details to see your plan.
                </Text>
              )}
              <Text
                style={[
                  styles.disclaimer,
                  { color: colors.mutedForeground },
                ]}
              >
                Estimates only — your appetite and progress will refine these
                numbers over time.
              </Text>
            </StepContainer>
          ) : null}
        </View>

        <View style={styles.footer}>
          {step > 0 ? (
            <Pressable
              onPress={back}
              style={[
                styles.backBtn,
                { borderColor: colors.border },
              ]}
            >
              <Feather name="arrow-left" size={18} color={colors.foreground} />
            </Pressable>
          ) : (
            <View style={{ width: 50 }} />
          )}
          <View style={{ flex: 1 }}>
            <PrimaryButton
              label={step === totalSteps - 1 ? "Start tracking" : "Continue"}
              onPress={next}
              disabled={!canNext}
              loading={submitting}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function StepContainer({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={{ gap: 18 }}>
      <View style={{ gap: 6 }}>
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {subtitle}
        </Text>
      </View>
      {children}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "number-pad" | "decimal-pad";
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.field,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType}
        style={[styles.fieldInput, { color: colors.foreground }]}
      />
    </View>
  );
}

function SegPicker<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { key: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const colors = useColors();
  return (
    <View style={{ gap: 8 }}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground, paddingLeft: 4 }]}>
        {label}
      </Text>
      <View style={[styles.seg, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {options.map((o) => {
          const active = value === o.key;
          return (
            <Pressable
              key={o.key}
              onPress={() => onChange(o.key)}
              style={[
                styles.segItem,
                { backgroundColor: active ? colors.primary : "transparent" },
              ]}
            >
              <Text
                style={{
                  color: active ? colors.primaryForeground : colors.foreground,
                  fontFamily: "Inter_700Bold",
                  fontSize: 14,
                }}
              >
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function OptionRow({
  selected,
  label,
  hint,
  onPress,
  accent,
}: {
  selected: boolean;
  label: string;
  hint: string;
  onPress: () => void;
  accent?: string;
}) {
  const colors = useColors();
  const tint = accent ?? colors.primary;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.option,
        {
          backgroundColor: selected ? colors.cardElevated : colors.card,
          borderColor: selected ? tint : colors.border,
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.optionLabel, { color: colors.foreground }]}>
          {label}
        </Text>
        <Text style={[styles.optionHint, { color: colors.mutedForeground }]}>
          {hint}
        </Text>
      </View>
      <View
        style={[
          styles.radio,
          {
            borderColor: selected ? tint : colors.border,
            backgroundColor: selected ? tint : "transparent",
          },
        ]}
      >
        {selected ? <Feather name="check" size={14} color={colors.primaryForeground} /> : null}
      </View>
    </Pressable>
  );
}

function MacroPreview({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const colors = useColors();
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text style={[styles.macroValue, { color }]}>{value}g</Text>
      <Text style={[styles.macroLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.4,
  },
  stepCounter: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  progressBar: {
    height: 4,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 16,
  },
  progressFill: { height: "100%", borderRadius: 999 },
  title: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    lineHeight: 20,
  },
  field: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
  },
  fieldInput: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    paddingTop: 6,
  },
  seg: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  segItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  optionLabel: { fontSize: 15, fontFamily: "Inter_700Bold" },
  optionHint: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  glp1Toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  toggleLabel: { fontSize: 14, fontFamily: "Inter_700Bold" },
  toggleHint: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  planCard: {
    padding: 22,
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
  },
  planLabel: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 1.5 },
  planValue: {
    fontSize: 56,
    fontFamily: "Inter_700Bold",
    letterSpacing: -2,
  },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  macroValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  macroLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  disclaimer: { fontSize: 12, fontFamily: "Inter_500Medium", lineHeight: 18 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 24,
  },
  backBtn: {
    width: 50,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
