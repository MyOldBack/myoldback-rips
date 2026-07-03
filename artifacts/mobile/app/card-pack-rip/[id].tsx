import { useGetCardPackRip, useOpenCardPackRip } from "@workspace/api-client-react";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/contexts/UserContext";
import PackRevealModal from "@/components/PackRevealModal";

const RARITY_COLORS: Record<string, string> = {
  common: "#6B7280",
  uncommon: "#10B981",
  rare: "#3B82F6",
  "ultra-rare": "#8B5CF6",
  legendary: "#F59E0B",
};

const RARITY_LABEL: Record<string, string> = {
  common: "COMMON",
  uncommon: "UNCOMMON",
  rare: "RARE",
  "ultra-rare": "✨ ULTRA RARE",
  legendary: "🔥 LEGENDARY",
};

export default function CardPackRipDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { username } = useUser();

  const [customUsername, setCustomUsername] = useState(username ?? "");
  const [modalVisible, setModalVisible] = useState(false);
  const [openResult, setOpenResult] = useState<{
    hitItemName: string;
    hitItemEstimatedValue: number;
    hitItemCategory: string;
    hitRarity: string;
  } | null>(null);

  const { data: pack, isLoading, refetch } = useGetCardPackRip(Number(id));
  const { mutate: openPack, isPending } = useOpenCardPackRip();

  const handleOpen = () => {
    if (!customUsername.trim() || !pack) return;
    openPack(
      { id: Number(id), data: { userName: customUsername.trim() } },
      {
        onSuccess: (result) => {
          setOpenResult(result);
          setModalVisible(true);
          // Refresh pack to update totalOpened count
          refetch();
        },
      }
    );
  };

  if (isLoading || !pack) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <LinearGradient
        colors={["#7C3AED33", "#0A0F1E00"] as [string, string]}
        style={[styles.headerGradient, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}
      >
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: "#A78BFA" }]}>‹ Back</Text>
        </Pressable>
        <Text style={[styles.packName, { color: colors.foreground }]}>{pack.name}</Text>
        <Text style={[styles.packDesc, { color: colors.mutedForeground }]}>{pack.description}</Text>

        <View style={styles.statsRow}>
          <View style={[styles.statChip, { backgroundColor: colors.card + "88" }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>${pack.price.toFixed(2)}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Per Open</Text>
          </View>
          <View style={[styles.statChip, { backgroundColor: colors.card + "88" }]}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{pack.totalOpened}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Opened</Text>
          </View>
          <View style={[styles.statChip, { backgroundColor: colors.card + "88" }]}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{pack.entries.length}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Items</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Content ── */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Possible hits */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>POSSIBLE HITS</Text>
          {pack.entries.map((entry) => {
            const color = RARITY_COLORS[entry.rarity] ?? "#fff";
            const totalWeight = pack.entries.reduce((s, e) => s + e.weight, 0);
            const pct = ((entry.weight / totalWeight) * 100).toFixed(1);
            return (
              <View
                key={entry.id}
                style={[styles.entryCard, { backgroundColor: colors.card, borderColor: color + "33" }]}
              >
                <View style={[styles.entryRarityBar, { backgroundColor: color }]} />
                <View style={styles.entryContent}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.entryName, { color: colors.foreground }]}>{entry.itemName}</Text>
                    <Text style={[styles.entryCategory, { color: colors.mutedForeground }]}>{entry.itemCategory}</Text>
                    <View style={[styles.rarityPill, { backgroundColor: color + "22" }]}>
                      <Text style={[styles.rarityPillText, { color }]}>{RARITY_LABEL[entry.rarity]}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 4 }}>
                    <Text style={[styles.entryValue, { color: colors.primary }]}>
                      ${entry.itemEstimatedValue.toFixed(0)}
                    </Text>
                    <Text style={[styles.entryOdds, { color: colors.mutedForeground }]}>{pct}% odds</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Probability breakdown */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ODDS BREAKDOWN</Text>
          <View style={[styles.oddsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {pack.entries.map((e) => {
              const color = RARITY_COLORS[e.rarity] ?? "#fff";
              const total = pack.entries.reduce((s, en) => s + en.weight, 0);
              const pct = (e.weight / total) * 100;
              return (
                <View key={e.id} style={styles.oddsRow}>
                  <View style={[styles.oddsDot, { backgroundColor: color }]} />
                  <Text style={[styles.oddsName, { color: colors.foreground }]} numberOfLines={1}>
                    {e.itemName}
                  </Text>
                  <View style={styles.oddsBarWrap}>
                    <View
                      style={[
                        styles.oddsBarFill,
                        { width: `${pct}%` as any, backgroundColor: color + "88" },
                      ]}
                    />
                  </View>
                  <Text style={[styles.oddsPct, { color }]}>{pct.toFixed(0)}%</Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* ── Open bar ── */}
      <View
        style={[
          styles.openBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + 8,
          },
        ]}
      >
        <TextInput
          style={[
            styles.usernameInput,
            {
              backgroundColor: colors.background,
              color: colors.foreground,
              borderColor: colors.border,
            },
          ]}
          value={customUsername}
          onChangeText={setCustomUsername}
          placeholder="Your username"
          placeholderTextColor={colors.mutedForeground}
        />
        <Pressable
          style={[
            styles.openButton,
            {
              backgroundColor: customUsername.trim() ? "#7C3AED" : colors.muted,
              opacity: isPending ? 0.6 : 1,
            },
          ]}
          onPress={handleOpen}
          disabled={isPending || !customUsername.trim()}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.openButtonText}>Open — ${pack.price.toFixed(2)}</Text>
          )}
        </Pressable>
      </View>

      {/* ── Slot machine reveal modal ── */}
      <PackRevealModal
        visible={modalVisible}
        entries={pack.entries.map((e) => ({
          id: e.id,
          itemId: e.itemId,
          itemName: e.itemName,
          rarity: e.rarity,
        }))}
        result={openResult}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerGradient: { paddingHorizontal: 20, paddingBottom: 20 },
  backButton: { marginBottom: 12 },
  backText: { fontSize: 17, fontFamily: "Inter_500Medium" },
  packName: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 6 },
  packDesc: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20, marginBottom: 16 },
  statsRow: { flexDirection: "row", gap: 10 },
  statChip: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12 },
  statValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  section: { paddingHorizontal: 16, paddingTop: 20, gap: 10 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginBottom: 4,
  },
  entryCard: {
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    overflow: "hidden",
  },
  entryRarityBar: { width: 4 },
  entryContent: { flex: 1, flexDirection: "row", padding: 14, gap: 12 },
  entryName: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  entryCategory: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 6 },
  rarityPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  rarityPillText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  entryValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  entryOdds: { fontSize: 12, fontFamily: "Inter_400Regular" },
  oddsCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 12 },
  oddsRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  oddsDot: { width: 8, height: 8, borderRadius: 4 },
  oddsName: { width: 130, fontSize: 13, fontFamily: "Inter_500Medium" },
  oddsBarWrap: {
    flex: 1,
    height: 8,
    backgroundColor: "#ffffff11",
    borderRadius: 4,
    overflow: "hidden",
  },
  oddsBarFill: { height: "100%", borderRadius: 4 },
  oddsPct: { width: 36, fontSize: 12, fontFamily: "Inter_600SemiBold", textAlign: "right" },
  openBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  usernameInput: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  openButton: {
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  openButtonText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
});
