import React, { useState } from "react";
import { View, TextInput, Button, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useAuth } from "@/api/context/AuthContext";
import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";

export default function SignIn() {
    const theme = useThemeConfig();
    const { onLogin, onRegister } = useAuth();

    const [isRegistering, setIsRegistering] = useState(false); // Toggle between login and register
    const [username, setUsername] = useState(""); // For registration
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleLogin = async () => {
        if (onLogin) {
            const result = await onLogin(email, password);
            if (result?.error) {
                setError(result.msg);
            } else {
                setError(""); // Clear error on success
            }
        }
    };

    const isValidEmail = (email: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
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

        if (onRegister) {
            const result = await onRegister(username, email, password);
            setError(result?.error ? result.msg : "");
        }
    };

    return (
        <View style={[styles(theme).container, { backgroundColor: theme.background }]}>
            <Image
                source={require('@/assets/images/SayWhen.png')} 
                style={styles(theme).logo}
                resizeMode="contain"
            />
            <Text style={[styles(theme).title, { color: theme.primary }]}>
                {isRegistering ? "Register" : "Login"}
            </Text>

            {isRegistering && (
                <TextInput
                    style={styles(theme).input}
                    placeholder="Username"
                    placeholderTextColor={theme.secondary}
                    value={username}
                    onChangeText={setUsername}
                />
            )}
            <TextInput
                style={styles(theme).input}
                placeholder="Email"
                placeholderTextColor={theme.secondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            <TextInput
                style={styles(theme).input}
                placeholder="Password"
                placeholderTextColor={theme.secondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            {isRegistering && (
                <TextInput
                    style={styles(theme).input}
                    placeholder="Confirm Password"
                    placeholderTextColor={theme.secondary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                />
            )}

            {error ? <Text style={styles(theme).error}>{error}</Text> : null}

            <TouchableOpacity
            style={[styles(theme).button, { backgroundColor: theme.primary }]}
            onPress={isRegistering ? handleRegister : handleLogin}
            >
            <Text style={styles(theme).buttonText}>
                {isRegistering ? "Register" : "Login"}
            </Text>
            </TouchableOpacity>

            <TouchableOpacity
            style={[styles(theme).button, { backgroundColor: theme.secondary }]}
            onPress={() => {
                setIsRegistering(!isRegistering);
                setError("");
            }}
            >
            <Text style={styles(theme).buttonText}>
                {isRegistering ? "Switch to Login" : "Switch to Register"}
            </Text>
            </TouchableOpacity>

        </View>
    );
}

const styles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
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
        padding: 10,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 5,
        color: "#000",
    },
    error: {
        color: "red",
        marginBottom: 10,
    },
    logo: {
        borderRadius: 20,
        width: 140,
        height: 140,
        elevation: 5,
        marginBottom: 20
    },
    button: {
        paddingVertical: 12,
        borderRadius: 8,
        width: 200,
        alignItems: 'center',
        marginVertical: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});