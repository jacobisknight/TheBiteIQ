import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Tabs, useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { useColors } from "@/hooks/useColors";

function CenterAddButton({ tint, bg }: { tint: string; bg: string }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        router.push("/(tabs)/add");
      }}
      style={({ pressed }) => [
        styles.fab,
        { backgroundColor: bg, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <Feather name="plus" size={26} color={tint} />
    </Pressable>
  );
}

export default function TabsLayout() {
  const colors = useColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === "web" ? 84 : 90,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 28 : 12,
        },
        tabBarLabelStyle: {
          fontFamily: "Inter_600SemiBold",
          fontSize: 11,
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: "Diary",
          tabBarIcon: ({ color }) => <Feather name="book-open" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "",
          tabBarIcon: () => (
            <View pointerEvents="none">
              <CenterAddButton tint={colors.primaryForeground} bg={colors.primary} />
            </View>
          ),
          tabBarButton: (props) => (
            <Pressable
              {...(props as object)}
              onPress={(e) => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                props.onPress?.(e);
              }}
              style={styles.centerSlot}
            >
              {props.children}
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: ({ color }) => <Feather name="trending-up" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <Feather name="user" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -18,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  centerSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
