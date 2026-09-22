import { Stack } from "expo-router";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AuthProvider from "@/providers/auth-provider";
import { CoinProvider } from "@/providers/coin-provider";
import { useAuthContext } from "@/hooks/use-auth-context";
import { SplashScreenController } from "@/components/splash-screen-controller";

export default function RootLayout() {
  return (
    <Providers>
      {/* Mounted unconditionally so it can actually hide the splash once auth
          settles; RootNavigator renders nothing until then. */}
      <SplashScreenController />
      <RootNavigator />
    </Providers>
  );
}

function RootNavigator() {
  const { isLoggedIn, isInitializing, user } = useAuthContext();

  // Render no routes until auth is resolved. Rendering the Stack here would
  // briefly evaluate the guards against an unresolved session and show the
  // login screen over a stored one.
  if (isInitializing) {
    return null;
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Protected guard={isLoggedIn && user !== undefined}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="event/[eventId]" options={{ headerShown: false }} />
          <Stack.Screen name="studio/[studio]" options={{ keyboardHandlingEnabled: false, headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={!isLoggedIn || user === undefined}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CoinProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          {children}
        </GestureHandlerRootView>
      </CoinProvider>
    </AuthProvider>
  );
}