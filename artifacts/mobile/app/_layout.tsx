import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setBaseUrl } from "@workspace/api-client-react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { UserProvider } from "@/contexts/UserContext";

// Set the API base URL for Expo (runs outside the shared proxy)
setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 10_000,
    },
  },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="rip/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="username" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="card-pack-rip/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="admin/items" options={{ headerShown: false }} />
      <Stack.Screen name="admin/packs" options={{ headerShown: false }} />
      <Stack.Screen name="admin/create-rip" options={{ headerShown: false }} />
      <Stack.Screen name="admin/rips" options={{ headerShown: false }} />
      <Stack.Screen name="admin/item-cards/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="admin/rip-cards/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="admin/insta-rips" options={{ headerShown: false }} />
      <Stack.Screen name="admin/insta-rip-cards/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="insta-rip/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <UserProvider>
                <RootLayoutNav />
              </UserProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
