import React, { useState } from "react";
import { TextInput, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { supabase } from "@/lib/supabase";
import { isValidEmail } from "@/utils/parsing";
import { friendlyLoginError, friendlySignupError, usernameProblem } from "@/utils/auth-errors";

export default function SignIn() {
    const theme = useThemeConfig();
    const styles = useThemedStyles(createStyles);

    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    // Non-error feedback, e.g. "check your inbox" after signing up.
    const [notice, setNotice] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleLogin = async () => {
        setNotice("");
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

        try {
            const response = await supabase.auth.signUp({
                email: trimmedEmail,
                password: password,
                options: {
                    data: {
                        username: trimmedUsername,
                    },
                },
            })

            if (response.error) {
                setError(friendlySignupError(response.error));
                return;
            }

            setUsername("");
            setPassword("");
            setConfirmPassword("");
            setError("");
            setIsRegistering(false);
            // With email confirmation on there is no session yet; without this
            // the form just flipped to Login with no explanation.
            if (!response.data.session) {
                setNotice("Account created. Open the confirmation link we emailed you, then log in.");
            }

        } catch (error: any) {
            setError(friendlySignupError(error));
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
                        source={require('@/assets/images/SayWhen.png')}
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

                    {error ? (
                        <Text style={styles.error} accessibilityLiveRegion="polite" selectable>{error}</Text>
                    ) : null}
                    {notice ? (
                        <Text style={styles.notice} accessibilityLiveRegion="polite">{notice}</Text>
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
                        }}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>
                            {isRegistering ? "Switch to Login" : "Switch to Register"}
                        </Text>
                    </TouchableOpacity>

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
});
