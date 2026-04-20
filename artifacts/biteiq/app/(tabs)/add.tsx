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

import { useColors } from "@/hooks/useColors";

export default function AddScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const options = [
    {
      key: "photo",
      icon: "camera" as const,
      title: "Snap a meal",
      subtitle: "AI will identify food and estimate macros from a photo.",
      tint: colors.primary,
      bg: colors.primarySoft,
      onPress: () => router.push("/logging/photo"),
    },
    {
      key: "voice",
      icon: "mic" as const,
      title: "Describe what you ate",
      subtitle: "Type or dictate — AI parses your meal into items.",
      tint: colors.accent,
      bg: colors.accentSoft,
      onPress: () => router.push("/logging/voice"),
    },
    {
      key: "search",
      icon: "search" as const,
      title: "Search foods",
      subtitle: "Find common foods with macros pulled by AI.",
      tint: colors.glp1,
      bg: "#241B36",
      onPress: () => router.push("/logging/search"),
    },
  ];

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
      <View style={{ gap: 6 }}>
        <Text style={[styles.title, { color: colors.foreground }]}>Log a meal</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Pick the fastest way for this moment.
        </Text>
      </View>

      <View style={{ gap: 12 }}>
        {options.map((o) => (
          <Pressable
            key={o.key}
            onPress={o.onPress}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={[styles.icon, { backgroundColor: o.bg }]}>
              <Feather name={o.icon} size={22} color={o.tint} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                {o.title}
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>
                {o.subtitle}
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.6 },
  subtitle: { fontSize: 14, fontFamily: "Inter_500Medium" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  cardSubtitle: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 4 },
});
