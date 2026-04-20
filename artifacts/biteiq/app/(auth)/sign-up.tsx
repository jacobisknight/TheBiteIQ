import { Feather } from "@expo/vector-icons";
import { useSignUp, useSSO } from "@clerk/expo";
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

export default function SignUpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signUp, errors, fetchStatus } = useSignUp();
  const { startSSOFlow } = useSSO();
  useWarmUpBrowser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    setSubmitError(null);
    const { error } = await signUp.password({
      emailAddress: email.trim(),
      password,
    });
    if (error) {
      setSubmitError(readableError(error));
      return;
    }
    await signUp.verifications.sendEmailCode();
  }, [email, password, signUp]);

  const handleVerify = useCallback(async () => {
    setSubmitError(null);
    await signUp.verifications.verifyEmailCode({ code: code.trim() });
    if (signUp.status === "complete") {
      await signUp.finalize();
    } else {
      setSubmitError("Verification failed. Check the code and try again.");
    }
  }, [code, signUp]);

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

  const busy = fetchStatus === "fetching";
  const needsVerification =
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields?.includes("email_address") &&
    (signUp.missingFields?.length ?? 0) === 0;

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
            {needsVerification
              ? "Check your email for a verification code"
              : "Create your account to get started"}
          </Text>
        </View>

        {needsVerification ? (
          <>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              VERIFICATION CODE
            </Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="6-digit code"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="number-pad"
              maxLength={8}
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                  letterSpacing: 4,
                },
              ]}
            />
            {errors?.fields?.code ? (
              <Text style={[styles.fieldError, { color: colors.destructive }]}>
                {errors.fields.code.message}
              </Text>
            ) : null}
            {submitError ? (
              <Text style={[styles.fieldError, { color: colors.destructive, marginTop: 10 }]}>
                {submitError}
              </Text>
            ) : null}
            <Pressable
              onPress={handleVerify}
              disabled={busy || code.trim().length < 4}
              style={({ pressed }) => [
                styles.primaryBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: busy || code.trim().length < 4 ? 0.6 : pressed ? 0.9 : 1,
                },
              ]}
            >
              {busy ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
                  Verify & continue
                </Text>
              )}
            </Pressable>
            <Pressable
              onPress={() => signUp.verifications.sendEmailCode()}
              style={styles.resendBtn}
            >
              <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }}>
                Resend code
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              onPress={handleGoogle}
              disabled={googleLoading || busy}
              style={({ pressed }) => [
                styles.oauthBtn,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: googleLoading || busy ? 0.6 : pressed ? 0.85 : 1,
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
            {errors?.fields?.emailAddress ? (
              <Text style={[styles.fieldError, { color: colors.destructive }]}>
                {errors.fields.emailAddress.message}
              </Text>
            ) : null}

            <Text style={[styles.label, { color: colors.mutedForeground }]}>PASSWORD</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              autoComplete="password-new"
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
                  Create account
                </Text>
              )}
            </Pressable>

            {/* Required for Clerk sign-up bot protection */}
            <View nativeID="clerk-captcha" />

            <View style={styles.footer}>
              <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_500Medium" }}>
                Already have an account?{" "}
              </Text>
              <Link href="/(auth)/sign-in" asChild>
                <Pressable>
                  <Text style={{ color: colors.primary, fontFamily: "Inter_700Bold" }}>
                    Sign in
                  </Text>
                </Pressable>
              </Link>
            </View>
          </>
        )}
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
  brand: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.6 },
  tagline: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
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
  dividerText: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1.4 },
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
  resendBtn: { marginTop: 14, alignItems: "center" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 22 },
});
