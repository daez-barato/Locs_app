import { Stack } from "expo-router";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useThemeConfig } from "@/components/ui/use-theme-config";


export default function RootLayout() {
  return (
    <Providers>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }}/>
      </Stack>
    </Providers>
  );
}

function Providers({ children }: {children: React.ReactNode}){
  const theme = useThemeConfig();
  return (
    <GestureHandlerRootView style={{flex:1}}>
        {children}
    </GestureHandlerRootView>
  );
}