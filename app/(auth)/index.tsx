import React, { useEffect, useState } from "react";
import { TextInput, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as AppleAuthentication from "expo-apple-authentication";
import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";
import LegalAgreement from "@/components/ui/legal-agreement";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { supabase } from "@/lib/supabase";
import { isValidEmail } from "@/utils/parsing";
import { friendlyLoginError, friendlyOAuthError, friendlySignupError, usernameProblem } from "@/utils/auth-errors";
import * as Linking from "expo-linking";
import { EMAIL_CONFIRM_URL } from "@/constants/links";
import { rememberEventLink } from "@/utils/pending-link";
import { isAppleSignInAvailable, OAuthCancelledError, signInWithApple, signInWithGoogle } from "@/utils/oauth";

export default function SignIn() {
    const theme = useThemeConfig();
    const styles = useThemedStyles(createStyles);
    const router = useRouter();

    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    // Non-error feedback, e.g. "check your inbox" after signing up.
    const [notice, setNotice] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [termsAccepted, setTermsAccepted] = useState(false);
    // Set while an account is waiting on its confirmation email, so the
    // screen can offer to send it again.
    const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
    const [resending, setResending] = useState(false);
    const [oauthBusy, setOauthBusy] = useState<"google" | "apple" | null>(null);
    const [appleAvailable, setAppleAvailable] = useState(false);

    useEffect(() => {
        isAppleSignInAvailable().then(setAppleAvailable);
    }, []);

    // Includes the link that launched the app, so an event opened while
    // signed out is still waiting after login.
    const openedUrl = Linking.useURL();
    useEffect(() => rememberEventLink(openedUrl), [openedUrl]);

    const handleLogin = async () => {
        setNotice("");
        setUnconfirmedEmail(null);
        const trimmedEmail = email.trim();
        if (!isValidEmail(trimmedEmail)) {
            setError("That doesn't look like an email address. Check for typos or stray spaces.");
            return;
        }
        if (!password) {
            setError("Enter your password.");
            return;
        }
        try {
            const response = await supabase.auth.signInWithPassword({
                email: trimmedEmail,
                password: password,
            });
            setError(response.error ? friendlyLoginError(response.error) : "");
            if (response.error?.code === "email_not_confirmed") setUnconfirmedEmail(trimmedEmail);
        } catch (error: any) {
            setError(friendlyLoginError(error));
        }
    };

    const handleRegister = async () => {
        setNotice("");
        const trimmedEmail = email.trim();
        const trimmedUsername = username.trim();
        if (!trimmedUsername || !trimmedEmail || !password || !confirmPassword) {
            setError("Fill in every field to create an account.");
            return;
        }

        const badUsername = usernameProblem(trimmedUsername);
        if (badUsername) {
            setError(badUsername);
            return;
        }

        if (!isValidEmail(trimmedEmail)) {
            setError("That doesn't look like an email address. Check for typos or stray spaces.");
            return;
        }

        if (password.length < 6) {
            setError("Passwords need at least 6 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError("The two passwords don't match.");
            return;
        }

        if (!termsAccepted) {
            setError("You need to be 18 or older and agree to the Terms of Service and Privacy Policy to create an account.");
            return;
        }

        try {
            const response = await supabase.auth.signUp({
                email: trimmedEmail,
                password: password,
                options: {
                    data: {
                        username: trimmedUsername,
                        terms_accepted: true,
                    },
                    emailRedirectTo: EMAIL_CONFIRM_URL,
                },
            })

            if (response.error) {
                setError(friendlySignupError(response.error));
                return;
            }

            setUsername("");
            setPassword("");
            setConfirmPassword("");
            setTermsAccepted(false);
            setError("");
            setIsRegistering(false);
            // With email confirmation on there is no session yet; without this
            // the form just flipped to Login with no explanation.
            if (!response.data.session) {
                setNotice(`Account created. We sent a confirmation link to ${trimmedEmail}. Open it on this phone to sign straight in, or confirm anywhere and then log in.`);
                setUnconfirmedEmail(trimmedEmail);
            }

        } catch (error: any) {
            setError(friendlySignupError(error));
        }
    };

    const handleResend = async () => {
        if (!unconfirmedEmail) return;
        setResending(true);
        try {
            const { error } = await supabase.auth.resend({
                type: "signup",
                email: unconfirmedEmail,
                options: { emailRedirectTo: EMAIL_CONFIRM_URL },
            });
            if (error) {
                setError(
                    error.code === "over_email_send_rate_limit"
                        ? "An email was sent very recently. Wait a minute before asking for another."
                        : "Couldn't send the email. Try again in a moment."
                );
                return;
            }
            setError("");
            setNotice(`We sent a new confirmation link to ${unconfirmedEmail}. Check your spam folder too.`);
        } finally {
            setResending(false);
        }
    };

    const handleGoogle = async () => {
        setNotice("");
        setError("");
        setOauthBusy("google");
        try {
            await signInWithGoogle();
        } catch (error: any) {
            if (!(error instanceof OAuthCancelledError)) {
                setError(friendlyOAuthError(error));
            }
        } finally {
            setOauthBusy(null);
        }
    };

    const handleApple = async () => {
        setNotice("");
        setError("");
        setOauthBusy("apple");
        try {
            await signInWithApple();
        } catch (error: any) {
            if (!(error instanceof OAuthCancelledError)) {
                setError(friendlyOAuthError(error));
            }
        } finally {
            setOauthBusy(null);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                >
                    <Image
                        source={require('@/assets/images/Locs_Icon.png')}
                        style={styles.logo}
                        contentFit="contain"
                    />
                    <Text style={styles.title}>
                        {isRegistering ? "Register" : "Login"}
                    </Text>

                    {isRegistering && (
                        <TextInput
                            style={styles.input}
                            placeholder="Username"
                            placeholderTextColor={theme.cardTextFaint}
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                        />
                    )}
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor={theme.cardTextFaint}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor={theme.cardTextFaint}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    {isRegistering && (
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm Password"
                            placeholderTextColor={theme.cardTextFaint}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                        />
                    )}

                    {isRegistering && (
                        <LegalAgreement accepted={termsAccepted} onToggle={setTermsAccepted} />
                    )}

                    {error ? (
                        <Text style={styles.error} accessibilityLiveRegion="polite" selectable>{error}</Text>
                    ) : null}
                    {notice ? (
                        <Text style={styles.notice} accessibilityLiveRegion="polite">{notice}</Text>
                    ) : null}
                    {unconfirmedEmail ? (
                        <TouchableOpacity
                            onPress={handleResend}
                            disabled={resending}
                            accessibilityRole="button"
                            style={styles.resend}
                        >
                            <Text style={styles.resendText}>
                                {resending ? "Sending…" : "Resend confirmation email"}
                            </Text>
                        </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                        style={[styles.button, styles.primaryButton]}
                        onPress={isRegistering ? handleRegister : handleLogin}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                    >
                        <Text style={[styles.buttonText, styles.primaryButtonText]}>
                            {isRegistering ? "Register" : "Login"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.secondaryButton]}
                        accessibilityRole="button"
                        onPress={() => {
                            setIsRegistering(!isRegistering);
                            setError("");
                            setNotice("");
                            setTermsAccepted(false);
                        }}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>
                            {isRegistering ? "Switch to Login" : "Switch to Register"}
                        </Text>
                    </TouchableOpacity>

                    <Text style={styles.divider}>or</Text>

                    <TouchableOpacity
                        style={[styles.button, styles.socialButton, oauthBusy !== null && styles.buttonDisabled]}
                        onPress={handleGoogle}
                        disabled={oauthBusy !== null}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel="Continue with Google"
                    >
                        {oauthBusy === "google" ? (
                            <ActivityIndicator color={theme.cardText} />
                        ) : (
                            <>
                                <FontAwesome name="google" size={18} color={theme.cardText} style={styles.socialIcon} />
                                <Text style={styles.buttonText}>Continue with Google</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {appleAvailable && (
                        <AppleAuthentication.AppleAuthenticationButton
                            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                            cornerRadius={8}
                            style={styles.appleButton}
                            onPress={handleApple}
                        />
                    )}

                    <Text style={styles.socialDisclaimer}>
                        By continuing with Google or Apple you confirm you are 18 or older and agree to the{" "}
                        <Text
                            style={styles.socialDisclaimerLink}
                            onPress={() => router.push(`/legal/terms`)}
                            accessibilityRole="link"
                        >
                            Terms of Service
                        </Text>{" "}
                        and{" "}
                        <Text
                            style={styles.socialDisclaimerLink}
                            onPress={() => router.push(`/legal/privacy`)}
                            accessibilityRole="link"
                        >
                            Privacy Policy
                        </Text>
                    </Text>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const createStyles = (theme: Theme) => StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.background,
    },
    flex: {
        flex: 1,
    },
    container: {
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: theme.primary,
        marginBottom: 20,
    },
    input: {
        width: "100%",
        padding: 12,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: theme.cardBorder,
        borderRadius: 8,
        backgroundColor: theme.card,
        color: theme.cardText,
    },
    error: {
        color: theme.destructiveLabel,
        marginTop: 4,
        marginBottom: 10,
        textAlign: "center",
    },
    resend: {
        padding: 8,
        marginBottom: 4,
    },
    resendText: {
        color: theme.primary,
        fontSize: 14,
        fontWeight: "600",
        textDecorationLine: "underline",
    },
    notice: {
        color: theme.successLabel,
        marginTop: 4,
        marginBottom: 10,
        textAlign: "center",
    },
    logo: {
        borderRadius: 20,
        width: 140,
        height: 140,
        boxShadow: "0 3px 10px rgba(0, 0, 0, 0.2)",
        marginBottom: 20
    },
    button: {
        paddingVertical: 14,
        borderRadius: 8,
        width: "100%",
        alignItems: 'center',
        marginVertical: 8,
    },
    primaryButtonText: {
        color: theme.onPrimary,
    },
  primaryButton: {
        backgroundColor: theme.primary,
    },
    secondaryButton: {
        backgroundColor: theme.secondary,
    },
    buttonText: {
        color: theme.buttonText,
        fontSize: 16,
        fontWeight: '600',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    divider: {
        color: theme.cardTextFaint,
        marginVertical: 8,
    },
    socialButton: {
        flexDirection: "row",
        justifyContent: "center",
        backgroundColor: theme.neutralFill,
    },
    socialIcon: {
        marginRight: 10,
    },
    appleButton: {
        width: "100%",
        height: 48,
        marginVertical: 8,
    },
    socialDisclaimer: {
        color: theme.cardTextFaint,
        fontSize: 12,
        textAlign: "center",
        marginTop: 8,
    },
    socialDisclaimerLink: {
        color: theme.text,
        fontWeight: "600",
        textDecorationLine: "underline",
    },
});
