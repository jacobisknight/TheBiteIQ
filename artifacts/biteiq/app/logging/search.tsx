import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { searchFood } from "@/lib/ai";
import type { FoodItem, MealType } from "@/types";

export default function SearchLog() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addMeal } = useApp();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodItem[]>([]);
  const [selected, setSelected] = useState<FoodItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [mealType, setMealType] = useState<MealType>(inferMealType());
  const [saving, setSaving] = useState(false);

  const runSearch = async () => {
    if (query.trim().length < 2) return;
    setSearching(true);
    try {
      const r = await searchFood(query.trim());
      setResults(r);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const toggle = (item: FoodItem) => {
    if (selected.find((s) => s.id === item.id)) {
      setSelected(selected.filter((s) => s.id !== item.id));
    } else {
      setSelected([...selected, item]);
    }
  };

  const save = async () => {
    if (selected.length === 0) return;
    setSaving(true);
    await addMeal({ mealType, items: selected, source: "search" });
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
          Search foods
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={{ padding: 18, gap: 12 }}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={runSearch}
            placeholder="Try chicken burrito bowl"
            placeholderTextColor={colors.mutedForeground}
            returnKeyType="search"
            style={[styles.searchInput, { color: colors.foreground }]}
          />
          {query.length > 0 ? (
            <Pressable
              onPress={() => {
                setQuery("");
                setResults([]);
              }}
              hitSlop={8}
            >
              <Feather name="x-circle" size={16} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>
        <PrimaryButton
          label="Search"
          onPress={runSearch}
          loading={searching}
          disabled={query.trim().length < 2}
          icon={<Feather name="zap" size={16} color={colors.primaryForeground} />}
        />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingBottom: insets.bottom + 200,
          gap: 14,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {searching ? (
          <ActivityIndicator color={colors.primary} />
        ) : results.length === 0 ? (
          <View
            style={[
              styles.empty,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Feather name="search" size={20} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Try a dish or a brand — AI will return common variants.
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.section, { color: colors.mutedForeground }]}>
              RESULTS · TAP TO ADD
            </Text>
            {results.map((r) => {
              const isSelected = !!selected.find((s) => s.id === r.id);
              return (
                <Pressable
                  key={r.id}
                  onPress={() => toggle(r)}
                  style={[
                    styles.result,
                    {
                      backgroundColor: colors.card,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.resultName, { color: colors.foreground }]}>
                      {r.name}
                    </Text>
                    <Text style={[styles.resultMeta, { color: colors.mutedForeground }]}>
                      {r.servingDescription ?? "1 serving"} · {Math.round(r.calories)} kcal
                    </Text>
                    <Text style={[styles.resultMacros]}>
                      <Text style={{ color: colors.protein, fontFamily: "Inter_600SemiBold" }}>
                        P {Math.round(r.protein)}g
                      </Text>
                      {"   "}
                      <Text style={{ color: colors.carbs, fontFamily: "Inter_600SemiBold" }}>
                        C {Math.round(r.carbs)}g
                      </Text>
                      {"   "}
                      <Text style={{ color: colors.fat, fontFamily: "Inter_600SemiBold" }}>
                        F {Math.round(r.fat)}g
                      </Text>
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.addBtn,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Feather
                      name={isSelected ? "check" : "plus"}
                      size={16}
                      color={isSelected ? colors.primaryForeground : colors.foreground}
                    />
                  </View>
                </Pressable>
              );
            })}
          </>
        )}

        {selected.length > 0 ? (
          <View style={{ gap: 12, marginTop: 8 }}>
            <Text style={[styles.section, { color: colors.mutedForeground }]}>
              ADDING ({selected.length})
            </Text>
            <FoodItemList
              items={selected}
              onRemove={(id) => setSelected(selected.filter((s) => s.id !== id))}
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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  section: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
  },
  result: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  resultName: { fontSize: 14, fontFamily: "Inter_700Bold" },
  resultMeta: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  resultMacros: { fontSize: 11, marginTop: 4 },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  empty: {
    padding: 22,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    gap: 10,
  },
  emptyText: { fontSize: 13, fontFamily: "Inter_500Medium", textAlign: "center" },
});
