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
      <RootNavigator />
    </Providers>
  );
}

function RootNavigator() {
  const { isLoggedIn, isLoading, user } = useAuthContext();
  
  if (isLoading) {
    return <SplashScreenController />;
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