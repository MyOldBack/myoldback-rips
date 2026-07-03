import { useListRips } from "@workspace/api-client-react";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RipCard } from "@/components/RipCard";
import { useColors } from "@/hooks/useColors";

const logo = require("@/assets/images/logo.png");

export default function LiveScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { data: liveRips, isLoading, refetch, isRefetching } = useListRips(
    { status: "active" },
    { query: { queryKey: getListRipsQueryKey({ status: "active" }) } }
  );
  const { data: spinningRips } = useListRips(
    { status: "spinning" },
    { query: { queryKey: getListRipsQueryKey({ status: "spinning" }) } }
  );

  const allActive = [
    ...(spinningRips ?? []),
    ...(liveRips ?? []),
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#FF6B0022", "#0A0F1E00"] as [string, string]}
        style={[styles.headerGradient, { paddingTop: topPad + 8 }]}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
              {allActive.length} live rip{allActive.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <View style={[styles.liveIndicator, { backgroundColor: colors.live + "22" }]}>
            <View style={[styles.liveDot, { backgroundColor: colors.live }]} />
            <Text style={[styles.liveText, { color: colors.live }]}>LIVE</Text>
          </View>
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={allActive}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <RipCard rip={item} />}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: bottomPad + 80 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyIcon, { color: colors.mutedForeground }]}>🔥</Text>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No live rips</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Check back soon for upcoming rips
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function getListRipsQueryKey(params?: { status?: string }) {
  return ["listRips", params];
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "column",
    justifyContent: "center",
  },
  logo: {
    width: 180,
    height: 60,
    marginBottom: 2,
  },
  headerSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 8,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
