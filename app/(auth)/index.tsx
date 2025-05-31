import React, { useState } from "react";
import { View, TextInput, Button, Text, StyleSheet } from "react-native";
import { useAuth } from "@/api/context/AuthContext";
import { useThemeConfig } from "@/components/ui/use-theme-config";

export default function SignIn() {
    const colors = useThemeConfig();
    const { onLogin, onRegister } = useAuth();

    const [isRegistering, setIsRegistering] = useState(false); // Toggle between login and register
    const [username, setUsername] = useState(""); // For registration
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

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

    const handleRegister = async () => {
        if (onRegister) {
            const result = await onRegister(username, email, password);
            if (result?.error) {
                setError(result.msg);
            } else {
                setError(""); // Clear error on success
            }
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.title, { color: colors.primary }]}>
                {isRegistering ? "Register" : "Login"}
            </Text>

            {isRegistering && (
                <TextInput
                    style={styles.input}
                    placeholder="Username"
                    placeholderTextColor={colors.secondary}
                    value={username}
                    onChangeText={setUsername}
                />
            )}

            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={colors.secondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.secondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
                title={isRegistering ? "Register" : "Login"}
                onPress={isRegistering ? handleRegister : handleLogin}
                color={colors.primary}
            />

            <Button
                title={isRegistering ? "Switch to Login" : "Switch to Register"}
                onPress={() => {
                    setIsRegistering(!isRegistering);
                    setError(""); // Clear error when switching modes
                }}
                color={colors.secondary}
            />
        </View>
    );
}

const styles = StyleSheet.create({
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
});