import { useListRips } from "@workspace/api-client-react";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/contexts/UserContext";

export default function MySpotsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { userName } = useUser();

  const { data: rips, isLoading, refetch, isRefetching } = useListRips(
    undefined,
    { query: { queryKey: ["listRips", "all"] } }
  );

  if (!userName) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <View style={styles.noUser}>
          <Text style={[styles.noUserIcon, { color: colors.mutedForeground }]}>👤</Text>
          <Text style={[styles.noUserTitle, { color: colors.foreground }]}>Set your username</Text>
          <Text style={[styles.noUserText, { color: colors.mutedForeground }]}>
            Add a username to track your spots
          </Text>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/username")}
          >
            <Text style={styles.btnText}>Set Username</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const myRips = (rips ?? []).filter((r) => {
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>My Spots</Text>
        <TouchableOpacity
          onPress={() => router.push("/username")}
          style={[styles.userBadge, { backgroundColor: colors.secondary, borderColor: colors.border }]}
        >
          <Text style={[styles.userBadgeText, { color: colors.primary }]}>
            @{userName}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={myRips}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: bottomPad + 80 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/rip/${item.id}`)}
              style={[styles.ripRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.ripInfo}>
                <Text style={[styles.ripName, { color: colors.foreground }]}>{item.itemName}</Text>
                <Text style={[styles.ripStatus, { color: colors.mutedForeground }]}>
                  {item.status.toUpperCase()} · ${item.spotPrice.toFixed(2)}/spot
                </Text>
              </View>
              {item.winnerName === userName && (
                <View style={[styles.wonBadge, { backgroundColor: colors.accent + "33" }]}>
                  <Text style={[styles.wonText, { color: colors.accent }]}>WON</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No rips to show. Browse and buy spots!
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  userBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  userBadgeText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  ripRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  ripInfo: { flex: 1 },
  ripName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 3,
  },
  ripStatus: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  wonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  wonText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  empty: {
    paddingTop: 80,
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  noUser: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 40,
  },
  noUserIcon: { fontSize: 56 },
  noUserTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  noUserText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  btn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  btnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
