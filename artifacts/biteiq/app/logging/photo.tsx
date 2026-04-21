import { Feather } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FoodItemList } from "@/components/FoodItemList";
import { MealTypePicker, inferMealType } from "@/components/MealTypePicker";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { recognizeFoodFromImage } from "@/lib/ai";
import type { FoodItem, MealType } from "@/types";

export default function PhotoLog() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addMeal } = useApp();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [mealType, setMealType] = useState<MealType>(inferMealType());
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  const analyze = async (base64?: string) => {
    if (!base64) return;
    setAnalyzing(true);
    try {
      const result = await recognizeFoodFromImage(base64);
      if (result.length === 0) {
        Alert.alert("No food found", "Try another photo with the meal in focus.");
      }
      setItems(result);
    } catch {
      Alert.alert("Couldn't analyze", "Please try again in a moment.");
    } finally {
      setAnalyzing(false);
    }
  };

  const toJpegBase64 = async (uri: string): Promise<string | undefined> => {
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        },
      );
      return manipulated.base64 ?? undefined;
    } catch {
      return undefined;
    }
  };

  const fromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Camera permission needed", "Enable camera access in settings.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setImageUri(asset.uri);
    setItems([]);
    const jpegBase64 = await toJpegBase64(asset.uri);
    await analyze(jpegBase64);
  };

  const fromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setImageUri(asset.uri);
    setItems([]);
    const jpegBase64 = await toJpegBase64(asset.uri);
    await analyze(jpegBase64);
  };

  const save = async () => {
    if (items.length === 0) return;
    setSaving(true);
    await addMeal({ mealType, items, source: "photo" });
    setSaving(false);
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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
          Photo scan
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 18,
          paddingBottom: insets.bottom + 120,
          gap: 18,
        }}
      >
        <Pressable
          onPress={fromCamera}
          style={[
            styles.imageBox,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <View style={styles.placeholder}>
              <View style={[styles.bigIcon, { backgroundColor: colors.primarySoft }]}>
                <Feather name="camera" size={28} color={colors.primary} />
              </View>
              <Text style={[styles.placeholderTitle, { color: colors.foreground }]}>
                Tap to capture your meal
              </Text>
              <Text
                style={[styles.placeholderHint, { color: colors.mutedForeground }]}
              >
                Frame the whole plate. Good lighting helps.
              </Text>
            </View>
          )}
        </Pressable>

        <View style={styles.row}>
          <PrimaryButton
            label={imageUri ? "Retake" : "Take photo"}
            variant={imageUri ? "ghost" : "primary"}
            icon={
              <Feather
                name="camera"
                size={16}
                color={imageUri ? colors.foreground : colors.primaryForeground}
              />
            }
            onPress={fromCamera}
            style={{ flex: 1 }}
          />
          {Platform.OS !== "web" ? (
            <PrimaryButton
              label="Library"
              variant="ghost"
              icon={<Feather name="image" size={16} color={colors.foreground} />}
              onPress={fromLibrary}
              style={{ flex: 1 }}
            />
          ) : null}
        </View>

        {analyzing ? (
          <View
            style={[
              styles.statusCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Feather name="zap" size={16} color={colors.primary} />
            <Text style={[styles.statusText, { color: colors.foreground }]}>
              Analyzing food...
            </Text>
          </View>
        ) : null}

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
    </View>
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
  imageBox: {
    height: 280,
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  image: { width: "100%", height: "100%" },
  placeholder: { alignItems: "center", gap: 10, padding: 24 },
  bigIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginTop: 6 },
  placeholderHint: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  row: { flexDirection: "row", gap: 10 },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  section: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
  },
});
