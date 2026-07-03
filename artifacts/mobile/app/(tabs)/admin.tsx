import { useGetAdminDashboard } from "@workspace/api-client-react";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/contexts/UserContext";
import { Feather } from "@expo/vector-icons";

interface StatCardProps {
  label: string;
  value: string;
  color: string;
}

function StatCard({ label, value, color }: StatCardProps) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { isAdmin, setIsAdmin } = useUser();

  const { data: dashboard, isLoading, refetch, isRefetching } = useGetAdminDashboard({
    query: { queryKey: ["getAdminDashboard"] },
  });

  if (!isAdmin) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <View style={styles.locked}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={[styles.lockedTitle, { color: colors.foreground }]}>Admin Access</Text>
          <Text style={[styles.lockedText, { color: colors.mutedForeground }]}>
            Enable admin mode to manage rips, items, and packs
          </Text>
          <TouchableOpacity
            style={[styles.enableBtn, { backgroundColor: colors.primary }]}
            onPress={() => setIsAdmin(true)}
          >
            <Text style={styles.enableBtnText}>Enable Admin Mode</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPad + 80 }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
      }
    >
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Admin Panel</Text>
        <TouchableOpacity onPress={() => setIsAdmin(false)}>
          <Feather name="log-out" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={styles.statsGrid}>
            <StatCard label="Live Rips" value={String(dashboard?.activeRips ?? 0)} color={colors.success} />
            <StatCard label="Total Rips" value={String(dashboard?.totalRips ?? 0)} color={colors.primary} />
            <StatCard label="Spots Sold" value={String(dashboard?.totalSpotsSold ?? 0)} color={colors.accent} />
            <StatCard
              label="Revenue"
              value={`$${(dashboard?.totalRevenue ?? 0).toFixed(0)}`}
              color={colors.success}
            />
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Manage</Text>

          <View style={styles.menuGrid}>
            {[
              { label: "Manage Rips", icon: "zap" as const, route: "/admin/rips" },
              { label: "New Rip", icon: "plus-circle" as const, route: "/admin/create-rip" },
              { label: "Items", icon: "package" as const, route: "/admin/items" },
              { label: "Insta Rips", icon: "layers" as const, route: "/admin/insta-rips" },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                onPress={() => router.push(item.route as any)}
                style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Feather name={item.icon} size={28} color={colors.primary} />
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 24,
  },
  statCard: {
    width: "47%",
    marginHorizontal: "1.5%",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 8,
  },
  menuCard: {
    width: "47%",
    marginHorizontal: "1.5%",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    gap: 10,
  },
  menuLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  locked: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 40,
  },
  lockIcon: { fontSize: 56 },
  lockedTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  lockedText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  enableBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  enableBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
