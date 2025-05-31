import { useAuth } from "@/api/context/AuthContext";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback } from "react";

export default function AuthLayout() {
    const { authState } = useAuth();
    const router = useRouter();

    useFocusEffect(
        useCallback( () => {
            if (authState?.authenticated) {
            router.replace('/(tabs)');
            }
        }, [authState?.authenticated])
    );

    return (
    <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index"/>
    </Stack>
    );
}