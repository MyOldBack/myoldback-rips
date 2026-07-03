import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface RipCardProps {
  rip: {
    id: number;
    itemName: string;
    itemImageUrl: string | null;
    itemEstimatedValue: number;
    spotCount: number;
    spotPrice: number;
    spotsSold: number;
    status: string;
    winnerName: string | null;
  };
}

export function RipCard({ rip }: RipCardProps) {
  const colors = useColors();
  const pct = rip.spotCount > 0 ? (rip.spotsSold / rip.spotCount) * 100 : 0;
  const isFull = rip.spotsSold >= rip.spotCount;

  const statusColor =
    rip.status === "active"
      ? colors.success
      : rip.status === "spinning"
      ? colors.accent
      : rip.status === "completed"
      ? colors.mutedForeground
      : colors.mutedForeground;

  const statusLabel =
    rip.status === "active"
      ? "LIVE"
      : rip.status === "spinning"
      ? "SPINNING"
      : rip.status === "completed"
      ? "DONE"
      : "UPCOMING";

  return (
    <TouchableOpacity
      onPress={() => router.push(`/rip/${rip.id}`)}
      activeOpacity={0.85}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      {rip.status === "active" && (
        <View style={[styles.liveBadge, { backgroundColor: colors.live }]}>
          <Text style={styles.liveBadgeText}>● LIVE</Text>
        </View>
      )}

      <View style={styles.header}>
        <View style={[styles.imagePlaceholder, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.imagePlaceholderText, { color: colors.mutedForeground }]}>🃏</Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={2}>
            {rip.itemName}
          </Text>
          <Text style={[styles.value, { color: colors.accent }]}>
            ~${rip.itemEstimatedValue.toFixed(0)} value
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + "22" }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>
      </View>

      <View style={styles.priceRow}>
        <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>Per Spot</Text>
        <Text style={[styles.price, { color: colors.primary }]}>${rip.spotPrice.toFixed(2)}</Text>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressLabels}>
          <Text style={[styles.progressText, { color: colors.mutedForeground }]}>
            {rip.spotsSold}/{rip.spotCount} spots
          </Text>
          <Text style={[styles.progressPct, { color: isFull ? colors.accent : colors.primary }]}>
            {pct.toFixed(0)}%
          </Text>
        </View>
        <View style={[styles.progressBg, { backgroundColor: colors.secondary }]}>
          <LinearGradient
            colors={[colors.primary, colors.accent] as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${Math.min(pct, 100)}%` as any }]}
          />
        </View>
      </View>

      {rip.status === "completed" && rip.winnerName && (
        <View style={[styles.winnerRow, { backgroundColor: colors.accent + "22" }]}>
          <Text style={[styles.winnerLabel, { color: colors.accent }]}>
            🏆 Winner: {rip.winnerName}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    overflow: "hidden",
  },
  liveBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  header: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  imagePlaceholder: {
    width: 72,
    height: 90,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: {
    fontSize: 32,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 20,
  },
  value: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 2,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  price: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  progressSection: {
    gap: 6,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  progressPct: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  progressBg: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  winnerRow: {
    marginTop: 12,
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  winnerLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
