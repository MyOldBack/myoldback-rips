import { useListInstaRips } from "@workspace/api-client-react";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const RARITY_COLORS = {
  common: "#9CA3AF",
  rare: "#3B82F6",
  chase: "#F59E0B",
};

function OddsBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  const colors = useColors();
  return (
    <View style={styles.oddsRow}>
      <Text style={[styles.oddsLabel, { color }]}>{label}</Text>
      <View style={[styles.oddsTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.oddsBar, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[styles.oddsPct, { color }]}>{pct}%</Text>
    </View>
  );
}

export default function InstaRipsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { data: rips, isLoading, refetch, isRefetching } = useListInstaRips();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#0f0618", colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.35 }}
      />
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Insta Rips</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Spin the wheel. Hit the ultra rare.
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} size="large" />
      ) : (
        <FlatList
          data={rips ?? []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPad + 100, gap: 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🎴</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No packs available yet
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => item.isActive && router.push(`/insta-rip/${item.id}` as any)}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
                !item.isActive && styles.cardInactive,
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.packName, { color: colors.foreground }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text
                    style={[styles.packDesc, { color: colors.mutedForeground }]}
                    numberOfLines={2}
                  >
                    {item.description}
                  </Text>
                </View>
                <View style={styles.costBadge}>
                  <Text style={styles.costText}>${item.cost.toFixed(2)}</Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Text style={[styles.oddsTitle, { color: colors.mutedForeground }]}>ODDS</Text>
              <OddsBar label="Common" pct={item.commonOdds} color={RARITY_COLORS.common} />
              <OddsBar label="Rare" pct={item.rareOdds} color={RARITY_COLORS.rare} />
              <OddsBar label="Chase" pct={item.chaseOdds} color={RARITY_COLORS.chase} />

              <View style={styles.cardFooter}>
                <Text style={[styles.cardCount, { color: colors.mutedForeground }]}>
                  {item.cards.length} card{item.cards.length !== 1 ? "s" : ""} in pool
                </Text>
                <View style={[styles.openBtn, !item.isActive && { backgroundColor: colors.muted }]}>
                  <Text
                    style={[styles.openBtnText, !item.isActive && { color: colors.mutedForeground }]}
                  >
                    {item.isActive ? "Open Pack →" : "Inactive"}
                  </Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 30, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 2 },
  card: { borderRadius: 20, borderWidth: 1, padding: 20, overflow: "hidden" },
  cardInactive: { opacity: 0.55 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 4 },
  packName: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 4 },
  packDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  costBadge: {
    backgroundColor: "#F59E0B22",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#F59E0B55",
  },
  costText: { color: "#F59E0B", fontFamily: "Inter_700Bold", fontSize: 16 },
  divider: { height: 1, marginVertical: 14 },
  oddsTitle: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5, marginBottom: 8 },
  oddsRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  oddsLabel: { fontSize: 12, fontFamily: "Inter_500Medium", width: 58 },
  oddsTrack: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  oddsBar: { height: 6, borderRadius: 3 },
  oddsPct: { fontSize: 12, fontFamily: "Inter_600SemiBold", width: 32, textAlign: "right" },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16 },
  cardCount: { fontSize: 12, fontFamily: "Inter_400Regular" },
  openBtn: { backgroundColor: "#7C3AED", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  openBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 13 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyIcon: { fontSize: 56 },
  emptyText: { fontSize: 16, fontFamily: "Inter_400Regular" },
});
