import { Stack } from "expo-router";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/api/context/AuthContext";
import { CoinProvider } from "@/api/context/coinContext";

export default function RootLayout() {

  return (
    <Providers>
        <StatusBar style="auto"/>
          <Stack>
              <Stack.Screen name="(auth)" options={{ headerShown: false }}/>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }}/>
              <Stack.Screen name="event/[eventId]" options={{ headerShown: false }}/>
              <Stack.Screen name="studio/[studio]" options={{keyboardHandlingEnabled: false, headerShown: false }}/>
          </Stack>
    </Providers>
  );
}

function Providers({ children }: {children: React.ReactNode}){
  return (
    <AuthProvider>
      <CoinProvider>
        <GestureHandlerRootView style={{flex:1}}>
          {children}
        </GestureHandlerRootView>
      </CoinProvider>
    </AuthProvider>
  );
}