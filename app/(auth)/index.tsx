import React, { useState } from "react";
import { TextInput, Text, StyleSheet, Image, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { supabase } from "@/lib/supabase";
import { isValidEmail } from "@/utils/parsing";

export default function SignIn() {
    const theme = useThemeConfig();
    const styles = useThemedStyles(createStyles);

    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleLogin = async () => {
        try {
            if (!isValidEmail(email)) {
                setError("Invalid email format.");
                return;
            }
            const response = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (response.error) {
                throw new Error();
            }

        } catch (error) {
            setError("Login failed. Please check your credentials.");
        }
    };

    const handleRegister = async () => {
        if (!username || !email || !password || !confirmPassword) {
            setError("All fields are required.");
            return;
        }

        if (!isValidEmail(email)) {
            setError("Invalid email format.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            const response = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        username: username,
                    },
                },
            })

            if (response.error) {
                throw new Error();
            }

            setUsername("");
            setEmail("");
            setPassword("");
            setConfirmPassword("");
            setError("");
            setIsRegistering(false);

        } catch (error) {
            setError("Registration failed. Check your input and please try again.");
        }
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
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
                        resizeMode="contain"
                    />
                    <Text style={[styles.title, { color: theme.primary }]}>
                        {isRegistering ? "Register" : "Login"}
                    </Text>

                    {isRegistering && (
                        <TextInput
                            style={styles.input}
                            placeholder="Username"
                            placeholderTextColor={theme.cardText + '80'}
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                        />
                    )}
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor={theme.cardText + '80'}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor={theme.cardText + '80'}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    {isRegistering && (
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm Password"
                            placeholderTextColor={theme.cardText + '80'}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                        />
                    )}

                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.primary }]}
                        onPress={isRegistering ? handleRegister : handleLogin}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>
                            {isRegistering ? "Register" : "Login"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.secondary }]}
                        onPress={() => {
                            setIsRegistering(!isRegistering);
                            setError("");
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
        fontWeight: "bold",
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
        color: theme.destructive,
        marginTop: 4,
        marginBottom: 10,
        textAlign: "center",
    },
    logo: {
        borderRadius: 20,
        width: 140,
        height: 140,
        elevation: 5,
        marginBottom: 20
    },
    button: {
        paddingVertical: 14,
        borderRadius: 8,
        width: "100%",
        alignItems: 'center',
        marginVertical: 8,
    },
    buttonText: {
        color: theme.buttonText,
        fontSize: 16,
        fontWeight: '600',
    },
});
