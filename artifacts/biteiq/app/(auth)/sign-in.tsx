import { Feather } from "@expo/vector-icons";
import { useSignIn, useSSO } from "@clerk/expo";
import { useSignInWithApple } from "@clerk/expo/apple";
import * as AppleAuthentication from "expo-apple-authentication";
import * as AuthSession from "expo-auth-session";
import { Link } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useState } from "react";
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

import { useColors } from "@/hooks/useColors";

WebBrowser.maybeCompleteAuthSession();

function useWarmUpBrowser() {
  useEffect(() => {
    if (Platform.OS !== "android") return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
}

export default function SignInScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn, errors, fetchStatus } = useSignIn();
  const { startSSOFlow } = useSSO();
  const { startAppleAuthenticationFlow } = useSignInWithApple();
  useWarmUpBrowser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    setSubmitError(null);
    const { error } = await signIn.password({
      emailAddress: email.trim(),
      password,
    });
    if (error) {
      setSubmitError(readableError(error));
      return;
    }
    if (signIn.status === "complete") {
      await signIn.finalize();
    } else if (signIn.status !== "needs_second_factor" && signIn.status !== "needs_client_trust") {
      setSubmitError("We couldn't sign you in. Check your credentials and try again.");
    }
  }, [email, password, signIn]);

  const handleGoogle = useCallback(async () => {
    setSubmitError(null);
    setGoogleLoading(true);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: AuthSession.makeRedirectUri(),
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err) {
      setSubmitError(readableError(err));
    } finally {
      setGoogleLoading(false);
    }
  }, [startSSOFlow]);

  const handleApple = useCallback(async () => {
    setSubmitError(null);
    setAppleLoading(true);
    try {
      const { createdSessionId, setActive } = await startAppleAuthenticationFlow();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err) {
      setSubmitError(readableError(err));
    } finally {
      setAppleLoading(false);
    }
  }, [startAppleAuthenticationFlow]);

  const busy = fetchStatus === "fetching";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 40,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 24,
          justifyContent: "center",
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoWrap}>
          <View style={[styles.logo, { backgroundColor: colors.primarySoft }]}>
            <Feather name="zap" size={26} color={colors.primary} />
          </View>
          <Text style={[styles.brand, { color: colors.foreground }]}>BiteIQ</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
            Sign in to track smarter
          </Text>
        </View>

        {Platform.OS === "ios" ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={14}
            style={styles.appleBtn}
            onPress={appleLoading || googleLoading || busy ? () => {} : handleApple}
          />
        ) : null}

        <Pressable
          onPress={handleGoogle}
          disabled={googleLoading || busy || appleLoading}
          style={({ pressed }) => [
            styles.oauthBtn,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: googleLoading || busy || appleLoading ? 0.6 : pressed ? 0.85 : 1,
            },
          ]}
        >
          {googleLoading ? (
            <ActivityIndicator size="small" color={colors.foreground} />
          ) : (
            <Feather name="chrome" size={18} color={colors.foreground} />
          )}
          <Text style={[styles.oauthText, { color: colors.foreground }]}>
            Continue with Google
          </Text>
        </Pressable>

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>OR</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        <Text style={[styles.label, { color: colors.mutedForeground }]}>EMAIL</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          style={[
            styles.input,
            { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground },
          ]}
        />
        {errors?.fields?.identifier ? (
          <Text style={[styles.fieldError, { color: colors.destructive }]}>
            {errors.fields.identifier.message}
          </Text>
        ) : null}

        <Text style={[styles.label, { color: colors.mutedForeground }]}>PASSWORD</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Your password"
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry
          autoComplete="password"
          style={[
            styles.input,
            { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground },
          ]}
        />
        {errors?.fields?.password ? (
          <Text style={[styles.fieldError, { color: colors.destructive }]}>
            {errors.fields.password.message}
          </Text>
        ) : null}

        {submitError ? (
          <Text style={[styles.fieldError, { color: colors.destructive, marginTop: 10 }]}>
            {submitError}
          </Text>
        ) : null}

        <Pressable
          onPress={handleSubmit}
          disabled={busy || !email.trim() || !password}
          style={({ pressed }) => [
            styles.primaryBtn,
            {
              backgroundColor: colors.primary,
              opacity: busy || !email.trim() || !password ? 0.6 : pressed ? 0.9 : 1,
            },
          ]}
        >
          {busy ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
              Sign in
            </Text>
          )}
        </Pressable>

        <View style={styles.footer}>
          <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_500Medium" }}>
            New here?{" "}
          </Text>
          <Link href="/(auth)/sign-up" asChild>
            <Pressable>
              <Text style={{ color: colors.primary, fontFamily: "Inter_700Bold" }}>
                Create an account
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function readableError(err: unknown): string {
  if (!err) return "Something went wrong. Please try again.";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyErr = err as any;
  const first =
    anyErr?.errors?.[0]?.message ||
    anyErr?.message ||
    (typeof anyErr === "string" ? anyErr : null);
  return first || "Something went wrong. Please try again.";
}

const styles = StyleSheet.create({
  logoWrap: { alignItems: "center", marginBottom: 36 },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  brand: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.6,
  },
  tagline: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  appleBtn: {
    width: "100%",
    height: 50,
    marginBottom: 12,
  },
  oauthBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  oauthText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 20,
  },
  dividerLine: { height: StyleSheet.hairlineWidth, flex: 1 },
  dividerText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.4,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  fieldError: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 6 },
  primaryBtn: {
    marginTop: 22,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 22,
  },
});
