import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useColors } from "@/hooks/useColors";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "flame", selected: "flame.fill" }} />
        <Label>Live</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="browse">
        <Icon sf={{ default: "square.grid.2x2", selected: "square.grid.2x2.fill" }} />
        <Label>Browse</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="packs">
        <Icon sf={{ default: "rectangle.stack", selected: "rectangle.stack.fill" }} />
        <Label>Insta Rips</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="my-spots">
        <Icon sf={{ default: "ticket", selected: "ticket.fill" }} />
        <Label>My Spots</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="admin">
        <Icon sf={{ default: "gearshape", selected: "gearshape.fill" }} />
        <Label>Admin</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
          ),
        tabBarLabelStyle: {
          fontFamily: "Inter_600SemiBold",
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Live",
          tabBarIcon: ({ color, size }) =>
            isIOS ? (
              <SymbolView name="flame.fill" tintColor={color} size={size} />
            ) : (
              <MaterialIcons name="whatshot" size={size} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: "Browse",
          tabBarIcon: ({ color, size }) =>
            isIOS ? (
              <SymbolView name="square.grid.2x2.fill" tintColor={color} size={size} />
            ) : (
              <Feather name="grid" size={size} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="packs"
        options={{
          title: "Insta Rips",
          tabBarIcon: ({ color, size }) =>
            isIOS ? (
              <SymbolView name="rectangle.stack.fill" tintColor={color} size={size} />
            ) : (
              <MaterialIcons name="style" size={size} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="my-spots"
        options={{
          title: "My Spots",
          tabBarIcon: ({ color, size }) =>
            isIOS ? (
              <SymbolView name="ticket.fill" tintColor={color} size={size} />
            ) : (
              <MaterialIcons name="confirmation-number" size={size} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
          tabBarIcon: ({ color, size }) =>
            isIOS ? (
              <SymbolView name="gearshape.fill" tintColor={color} size={size} />
            ) : (
              <Feather name="settings" size={size} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
