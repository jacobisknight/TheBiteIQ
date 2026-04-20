import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { ClerkLoaded, ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { useFonts } from "expo-font";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider, useApp } from "@/context/AppContext";
import colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
const proxyUrl = process.env.EXPO_PUBLIC_CLERK_PROXY_URL || undefined;

function AuthGate() {
  const { isLoaded, isSignedIn } = useAuth();
  const { ready, user } = useApp();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!isLoaded || !ready) return;
    const group = segments[0];
    const inAuth = group === "(auth)";
    const inOnboarding = group === "onboarding";

    if (!isSignedIn) {
      if (!inAuth) router.replace("/(auth)/sign-in");
      return;
    }

    if (!user) {
      if (!inOnboarding) router.replace("/onboarding");
      return;
    }

    if (inAuth || inOnboarding) {
      router.replace("/(tabs)");
    }
  }, [isLoaded, isSignedIn, ready, user, segments, router]);

  return null;
}

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.light.background },
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen
        name="logging/photo"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="logging/voice"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="logging/search"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen name="coach" options={{ headerShown: false }} />
    </Stack>
  );
}

function LoadingScreen() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.light.background,
      }}
    >
      <ActivityIndicator size="large" color={colors.light.primary} />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  if (!publishableKey) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.light.background,
          padding: 24,
        }}
      >
        <ActivityIndicator size="large" color={colors.light.primary} />
      </View>
    );
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      tokenCache={tokenCache}
      proxyUrl={proxyUrl}
    >
      <ClerkLoaded>
        <SafeAreaProvider>
          <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
              <GestureHandlerRootView
                style={{ flex: 1, backgroundColor: colors.light.background }}
              >
                <KeyboardProvider>
                  <AppProvider>
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: colors.light.background,
                      }}
                    >
                      <StatusBar style="light" />
                      <AuthGate />
                      <RootLayoutNav />
                    </View>
                  </AppProvider>
                </KeyboardProvider>
              </GestureHandlerRootView>
            </QueryClientProvider>
          </ErrorBoundary>
        </SafeAreaProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
