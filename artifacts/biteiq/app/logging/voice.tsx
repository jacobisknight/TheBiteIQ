import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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

import { FoodItemList } from "@/components/FoodItemList";
import { MealTypePicker, inferMealType } from "@/components/MealTypePicker";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { parseFoodFromText, UpgradeRequiredError } from "@/lib/ai";
import type { FoodItem, MealType } from "@/types";

const SUGGESTIONS = [
  "Two scrambled eggs with toast and a coffee with oat milk",
  "Grilled chicken Caesar salad, large",
  "Greek yogurt with berries and a tablespoon of honey",
];

export default function VoiceLog() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addMeal } = useApp();

  const [text, setText] = useState("");
  const [items, setItems] = useState<FoodItem[]>([]);
  const [mealType, setMealType] = useState<MealType>(inferMealType());
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);

  const parse = async () => {
    if (text.trim().length < 3) return;
    setParsing(true);
    try {
      const result = await parseFoodFromText(text.trim());
      if (result.length === 0) {
        Alert.alert("Hmm", "Try describing what you ate in a bit more detail.");
      }
      setItems(result);
    } catch (err) {
      if (err instanceof UpgradeRequiredError) return;
      Alert.alert("Couldn't parse", "Please try again.");
    } finally {
      setParsing(false);
    }
  };

  const save = async () => {
    if (items.length === 0) return;
    setSaving(true);
    await addMeal({
      mealType,
      items,
      source: "voice",
      note: text.trim(),
    });
    setSaving(false);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 12, borderBottomColor: colors.border },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="x" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Voice log
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 18,
          paddingBottom: insets.bottom + 120,
          gap: 18,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroRow}>
          <View style={[styles.micBubble, { backgroundColor: colors.accentSoft }]}>
            <Feather name="mic" size={22} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Describe your meal
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Tap the microphone on your keyboard to dictate, or type it out.
              AI will pull out the items and macros.
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.inputCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="e.g. A bowl of oatmeal with banana, peanut butter, and honey"
            placeholderTextColor={colors.mutedForeground}
            multiline
            style={[styles.input, { color: colors.foreground }]}
          />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={[styles.section, { color: colors.mutedForeground }]}>
            QUICK PICKS
          </Text>
          <View style={{ gap: 8 }}>
            {SUGGESTIONS.map((s) => (
              <Pressable
                key={s}
                onPress={() => setText(s)}
                style={[
                  styles.suggestion,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Feather name="message-circle" size={14} color={colors.mutedForeground} />
                <Text
                  numberOfLines={2}
                  style={[styles.suggestionText, { color: colors.foreground }]}
                >
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <PrimaryButton
          label="Parse with AI"
          onPress={parse}
          loading={parsing}
          disabled={text.trim().length < 3}
          icon={<Feather name="zap" size={16} color={colors.primaryForeground} />}
        />

        {items.length > 0 ? (
          <View style={{ gap: 14 }}>
            <Text style={[styles.section, { color: colors.mutedForeground }]}>
              DETECTED ITEMS
            </Text>
            <FoodItemList
              items={items}
              onRemove={(id) => setItems(items.filter((i) => i.id !== id))}
            />
            <Text style={[styles.section, { color: colors.mutedForeground }]}>
              MEAL
            </Text>
            <MealTypePicker value={mealType} onChange={setMealType} />
            <PrimaryButton
              label="Add to diary"
              onPress={save}
              loading={saving}
              icon={<Feather name="check" size={16} color={colors.primaryForeground} />}
            />
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  heroRow: { flexDirection: "row", gap: 14 },
  micBubble: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 4,
    lineHeight: 18,
  },
  inputCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  input: {
    minHeight: 100,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    textAlignVertical: "top",
  },
  section: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
  },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  suggestionText: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
