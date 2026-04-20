import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
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
import { SectionHeader } from "@/components/SectionHeader";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { buildPlan } from "@/lib/nutrition";
import {
  displayHeight,
  displayWeight,
  parseHeight,
  parseWeight,
  type LengthUnit,
  type WeightUnit,
} from "@/lib/units";
import type { ActivityLevel, Goal, Sex } from "@/types";

const SEX: { key: Sex; label: string }[] = [
  { key: "male", label: "Male" },
  { key: "female", label: "Female" },
];

const ACTIVITY: { key: ActivityLevel; label: string }[] = [
  { key: "sedentary", label: "Sedentary" },
  { key: "light", label: "Light" },
  { key: "moderate", label: "Moderate" },
  { key: "active", label: "Active" },
  { key: "very_active", label: "Very active" },
];

const GOALS: { key: Goal; label: string }[] = [
  { key: "lose", label: "Lose" },
  { key: "maintain", label: "Maintain" },
  { key: "gain", label: "Gain" },
  { key: "glp1", label: "GLP-1" },
];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, updateUser, resetAll } = useApp();

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [heightInput, setHeightInput] = useState("");
  const [weightInput, setWeightInput] = useState("");
  const [heightUnit, setHeightUnit] = useState<LengthUnit>("cm");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [sex, setSex] = useState<Sex>("male");
  const [activity, setActivity] = useState<ActivityLevel>("moderate");
  const [goal, setGoal] = useState<Goal>("maintain");
  const [glp1Mode, setGlp1Mode] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setAge(String(user.age));
    setHeightInput(displayHeight(user.heightCm, heightUnit));
    setWeightInput(displayWeight(user.weightKg, weightUnit));
    setSex(user.sex);
    setActivity(user.activity);
    setGoal(user.goal);
    setGlp1Mode(user.glp1Mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onHeightUnitChange = (u: LengthUnit) => {
    const cm = parseHeight(heightInput, heightUnit);
    setHeightUnit(u);
    if (cm > 0) setHeightInput(displayHeight(cm, u));
  };
  const onWeightUnitChange = (u: WeightUnit) => {
    const kg = parseWeight(weightInput, weightUnit);
    setWeightUnit(u);
    if (kg > 0) setWeightInput(displayWeight(kg, u));
  };

  if (!user) return null;

  const heightCm = parseHeight(heightInput, heightUnit) || user.heightCm;
  const weightKg = parseWeight(weightInput, weightUnit) || user.weightKg;

  const previewPlan = buildPlan({
    age: Number(age) || user.age,
    sex,
    heightCm,
    weightKg,
    activity,
    goal,
    glp1Mode,
  });

  const save = async () => {
    const ageN = Number(age);
    const hN = parseHeight(heightInput, heightUnit);
    const wN = parseWeight(weightInput, weightUnit);
    if (!ageN || !hN || !wN) {
      Alert.alert("Please fill in age, height, and weight.");
      return;
    }
    await updateUser({
      name: name.trim() || "Friend",
      age: ageN,
      sex,
      heightCm: hN,
      weightKg: wN,
      activity,
      goal,
      glp1Mode,
    });
    Alert.alert("Saved", "Targets recalculated.");
  };

  const confirmReset = () => {
    Alert.alert(
      "Reset all data?",
      "This clears your profile, meals, and weight history.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: () => resetAll() },
      ],
    );
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
        <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Update your details — your targets adjust automatically.
        </Text>
      </View>

      <View style={[styles.targetCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.targetLabel, { color: colors.mutedForeground }]}>
            DAILY TARGET
          </Text>
          <Text style={[styles.targetValue, { color: colors.foreground }]}>
            {previewPlan.dailyCalories} kcal
          </Text>
          <Text style={[styles.targetMacros, { color: colors.mutedForeground }]}>
            <Text style={{ color: colors.protein }}>P {previewPlan.proteinG}g</Text>
            {"   "}
            <Text style={{ color: colors.carbs }}>C {previewPlan.carbsG}g</Text>
            {"   "}
            <Text style={{ color: colors.fat }}>F {previewPlan.fatG}g</Text>
          </Text>
        </View>
        <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
          <Feather name="target" size={22} color={colors.primary} />
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <SectionHeader label="ABOUT YOU" />
        <Field label="Name" value={name} onChangeText={setName} />
        <Field label="Age" value={age} onChangeText={setAge} keyboardType="number-pad" />
        <UnitField
          label="Height"
          value={heightInput}
          onChangeText={setHeightInput}
          units={[
            { key: "cm", label: "cm" },
            { key: "in", label: "in" },
          ]}
          unit={heightUnit}
          onUnitChange={(u) => onHeightUnitChange(u as LengthUnit)}
        />
        <UnitField
          label="Weight"
          value={weightInput}
          onChangeText={setWeightInput}
          units={[
            { key: "kg", label: "kg" },
            { key: "lbs", label: "lbs" },
          ]}
          unit={weightUnit}
          onUnitChange={(u) => onWeightUnitChange(u as WeightUnit)}
        />
        <Group label="Sex" options={SEX} value={sex} onChange={(v) => setSex(v as Sex)} />
      </View>

      <View style={{ gap: 10 }}>
        <SectionHeader label="LIFESTYLE" />
        <Group
          label="Activity"
          options={ACTIVITY}
          value={activity}
          onChange={(v) => setActivity(v as ActivityLevel)}
        />
        <Group
          label="Goal"
          options={GOALS}
          value={goal}
          onChange={(v) => {
            setGoal(v as Goal);
            if (v === "glp1") setGlp1Mode(true);
          }}
        />
        <View
          style={[
            styles.toggleRow,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.toggleLabel, { color: colors.foreground }]}>
              GLP-1 mode
            </Text>
            <Text style={[styles.toggleHint, { color: colors.mutedForeground }]}>
              Higher protein and gentler calorie deficit.
            </Text>
          </View>
          <Switch
            value={glp1Mode}
            onValueChange={setGlp1Mode}
            trackColor={{ false: colors.ringTrack, true: colors.primary }}
            thumbColor={colors.foreground}
          />
        </View>
      </View>

      <PrimaryButton label="Save changes" onPress={save} />

      <Pressable onPress={confirmReset} style={styles.dangerRow}>
        <Feather name="trash-2" size={16} color={colors.destructive} />
        <Text style={[styles.dangerText, { color: colors.destructive }]}>
          Reset all data
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: "number-pad" | "decimal-pad" | "default";
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
        {props.label}
      </Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        keyboardType={props.keyboardType ?? "default"}
        placeholderTextColor={colors.mutedForeground}
        style={[styles.fieldInput, { color: colors.foreground }]}
      />
    </View>
  );
}

function UnitField({
  label,
  value,
  onChangeText,
  units,
  unit,
  onUnitChange,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  units: { key: string; label: string }[];
  unit: string;
  onUnitChange: (v: string) => void;
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
      <View style={styles.unitRow}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.fieldInput,
            { color: colors.foreground, flex: 1, paddingTop: 0 },
          ]}
        />
        <View style={[styles.unitSeg, { backgroundColor: colors.background, borderColor: colors.border }]}>
          {units.map((u) => {
            const active = u.key === unit;
            return (
              <Pressable
                key={u.key}
                onPress={() => onUnitChange(u.key)}
                style={[
                  styles.unitSegItem,
                  { backgroundColor: active ? colors.primary : "transparent" },
                ]}
              >
                <Text
                  style={{
                    color: active ? colors.primaryForeground : colors.foreground,
                    fontFamily: "Inter_700Bold",
                    fontSize: 12,
                  }}
                >
                  {u.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function Group<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const colors = useColors();
  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground, paddingLeft: 4 }]}>
        {label}
      </Text>
      <View style={styles.chipsRow}>
        {options.map((o) => {
          const active = value === o.key;
          return (
            <Pressable
              key={o.key}
              onPress={() => onChange(o.key)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.primary : colors.card,
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
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.6 },
  subtitle: { fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 4 },
  targetCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    gap: 14,
  },
  targetLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1.5 },
  targetValue: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
    marginTop: 4,
  },
  targetMacros: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginTop: 6 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  field: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
  },
  fieldInput: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    paddingTop: 4,
  },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  unitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
  },
  unitSeg: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
  },
  unitSegItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 7,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  toggleLabel: { fontSize: 14, fontFamily: "Inter_700Bold" },
  toggleHint: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  dangerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  dangerText: { fontSize: 13, fontFamily: "Inter_700Bold" },
});
