import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { EmailOtpType } from "@supabase/supabase-js";
import { SafeAreaView } from "react-native-safe-area-context";
import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { supabase } from "@/lib/supabase";

const EMAIL_TYPES: EmailOtpType[] = ["signup", "email", "invite", "magiclink", "recovery", "email_change"];

/**
 * Where the sign-up confirmation link lands when the app is installed:
 * https://locsapp.net/auth/confirm?token_hash=…&type=email opens here instead
 * of the website. Verifying the token hash confirms the address and signs the
 * person in, on any device — unlike a PKCE code, it needs no verifier from the
 * device that registered. Registered outside the Protected groups in
 * app/_layout.tsx so it is reachable while signed out.
 */
export default function ConfirmEmail() {
    const theme = useThemeConfig();
    const styles = useThemedStyles(createStyles);
    const router = useRouter();
    const { token_hash, type } = useLocalSearchParams<{ token_hash?: string; type?: string }>();
    const { isLoggedIn, user } = useAuthContext();

    const [error, setError] = useState("");
    const [confirmed, setConfirmed] = useState(false);
    // A link is single use; guard against React re-running the effect.
    const attempted = useRef(false);

    useEffect(() => {
        if (attempted.current) return;
        attempted.current = true;

        const otpType = EMAIL_TYPES.includes(type as EmailOtpType) ? (type as EmailOtpType) : "email";
        if (!token_hash) {
            setError("This confirmation link is incomplete. Open the latest email we sent you and tap the link again.");
            return;
        }

        supabase.auth
            .verifyOtp({ token_hash, type: otpType })
            .then(({ error }) => {
                if (error) {
                    console.error("Email confirmation error:", error);
                    setError(
                        error.code === "otp_expired"
                            ? "This link has expired or was already used. Log in, or register again to get a new one."
                            : "We couldn't confirm your email. Try the link again, or log in if you already confirmed it."
                    );
                    return;
                }
                setConfirmed(true);
            });
    }, [token_hash, type]);

    // The session from verifyOtp reaches the auth provider a moment later;
    // leave once the profile is loaded, and the guards pick the right screen.
    useEffect(() => {
        if (confirmed && isLoggedIn && user) router.replace("/");
    }, [confirmed, isLoggedIn, user, router]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {error ? (
                    <>
                        <Text style={styles.title}>Couldn&apos;t confirm</Text>
                        <Text style={styles.body} selectable>{error}</Text>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => router.replace("/")}
                            accessibilityRole="button"
                        >
                            <Text style={styles.buttonText}>{isLoggedIn ? "Continue" : "Go to login"}</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <ActivityIndicator size="large" color={theme.primary} />
                        <Text style={styles.body}>
                            {confirmed ? "Email confirmed. Signing you in…" : "Confirming your email…"}
                        </Text>
                    </>
                )}
            </View>
        </SafeAreaView>
    );
}

const createStyles = (theme: Theme) => StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.background,
    },
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        gap: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: theme.primary,
        textAlign: "center",
    },
    body: {
        color: theme.cardTextSecondary,
        fontSize: 15,
        textAlign: "center",
    },
    button: {
        backgroundColor: theme.primary,
        paddingVertical: 14,
        borderRadius: 8,
        width: "100%",
        alignItems: "center",
    },
    buttonText: {
        color: theme.onPrimary,
        fontSize: 16,
        fontWeight: "600",
    },
});
