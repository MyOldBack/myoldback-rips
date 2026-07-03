import {
  useBuySpots,
  useGetRip,
  useSpinRip,
  useUpdateRip,
  getGetRipQueryKey,
  getListRipsQueryKey,
} from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { SpinWheel } from "@/components/SpinWheel";
import { SpotGrid } from "@/components/SpotGrid";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/contexts/UserContext";

export default function RipDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ripId = Number(id);
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { userName, isAdmin } = useUser();
  const queryClient = useQueryClient();

  const [buyQty, setBuyQty] = useState(1);
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<{ winnerName: string; winnerSlot: number; allSlots: string[] } | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [customName, setCustomName] = useState(userName ?? "");

  const { data: rip, isLoading, refetch, isRefetching } = useGetRip(ripId, {
    query: { queryKey: getGetRipQueryKey(ripId) },
  });

  const buySpotsMutation = useBuySpots({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetRipQueryKey(ripId) });
        setShowBuyModal(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
    },
  });

  const spinMutation = useSpinRip({
    mutation: {
      onSuccess: (result) => {
        setSpinResult({ winnerName: result.winnerName, winnerSlot: result.winnerSlot, allSlots: result.allSlots });
        setSpinning(true);
        queryClient.invalidateQueries({ queryKey: getGetRipQueryKey(ripId) });
        queryClient.invalidateQueries({ queryKey: getListRipsQueryKey() });
      },
    },
  });

  const updateRipMutation = useUpdateRip({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetRipQueryKey(ripId) });
        queryClient.invalidateQueries({ queryKey: getListRipsQueryKey() });
      },
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!rip) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>Rip not found</Text>
      </View>
    );
  }

  const availableSpots = rip.spotCount - rip.spotsSold;
  const canBuy = availableSpots > 0 && rip.status === "active";
  const wheelSlots = (rip.spots ?? []).map((s) => s.userName);
  const winnerIdx = spinResult
    ? (rip.spots ?? []).findIndex((s) => s.slotNumber === spinResult.winnerSlot)
    : null;

  const handleBuy = () => {
    if (!customName.trim()) {
      Alert.alert("Username required", "Enter a username to buy spots");
      return;
    }
    buySpotsMutation.mutate({
      id: ripId,
      data: { userName: customName.trim(), quantity: buyQty },
    });
  };

  const handleSpin = () => {
    Alert.alert("Spin the Wheel?", "This will pick a random winner and close the rip.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Spin!",
        style: "destructive",
        onPress: () => spinMutation.mutate({ id: ripId }),
      },
    ]);
  };

  const handleActivate = () => {
    updateRipMutation.mutate({ id: ripId, data: { status: "active" } });
  };

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: bottomPad + 100 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        {/* Back button */}
        <View style={[styles.backRow, { paddingTop: topPad + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Item info */}
        <View style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.itemImage, { backgroundColor: colors.secondary }]}>
            <Text style={styles.itemImageIcon}>🃏</Text>
          </View>
          <View style={styles.itemInfo}>
            <Text style={[styles.itemName, { color: colors.foreground }]}>{rip.itemName}</Text>
            <Text style={[styles.itemDesc, { color: colors.mutedForeground }]}>{rip.itemDescription}</Text>
            <Text style={[styles.itemValue, { color: colors.accent }]}>
              ~${rip.itemEstimatedValue.toFixed(0)} est. value
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: "Spot Price", value: `$${rip.spotPrice.toFixed(2)}`, color: colors.primary },
            { label: "Available", value: `${availableSpots}/${rip.spotCount}`, color: colors.foreground },
            {
              label: "Status",
              value: rip.status.toUpperCase(),
              color: rip.status === "active" ? colors.success : rip.status === "completed" ? colors.mutedForeground : colors.accent,
            },
          ].map((s) => (
            <View key={s.label} style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Spin wheel (show when spinning or completed) */}
        {(spinning || rip.status === "completed") && wheelSlots.length > 0 && (
          <View style={styles.wheelSection}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {spinning ? "Spinning..." : "Result"}
            </Text>
            <SpinWheel
              slots={wheelSlots}
              winnerIndex={winnerIdx}
              spinning={spinning}
              size={300}
              onSpinComplete={() => {
                setSpinning(false);
                setTimeout(() => setShowWinnerModal(true), 400);
              }}
            />
            {rip.status === "completed" && rip.winnerName && !spinning && (
              <View style={[styles.winnerBanner, { backgroundColor: colors.accent + "22", borderColor: colors.accent }]}>
                <Text style={[styles.winnerBannerText, { color: colors.accent }]}>
                  🏆 {rip.winnerName} wins!
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Spots grid */}
        <Text style={[styles.sectionTitle, { color: colors.foreground, paddingHorizontal: 16 }]}>
          Spots ({rip.spotsSold}/{rip.spotCount})
        </Text>
        <SpotGrid
          totalSpots={rip.spotCount}
          spots={(rip.spots ?? []).map((s) => ({ ...s, isWinner: s.isWinner ?? false }))}
          myUserName={userName}
        />

        {/* Admin controls */}
        {isAdmin && (
          <View style={styles.adminSection}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Admin Controls</Text>
            <View style={styles.adminBtns}>
              {rip.status === "pending" && (
                <TouchableOpacity
                  style={[styles.adminBtn, { backgroundColor: colors.success }]}
                  onPress={handleActivate}
                >
                  <Text style={styles.adminBtnText}>Activate Rip</Text>
                </TouchableOpacity>
              )}
              {rip.status === "active" && rip.spotsSold > 0 && (
                <TouchableOpacity
                  style={[styles.adminBtn, { backgroundColor: colors.accent }]}
                  onPress={handleSpin}
                  disabled={spinMutation.isPending}
                >
                  <Text style={[styles.adminBtnText, { color: "#0A0F1E" }]}>
                    {spinMutation.isPending ? "Spinning..." : "Spin Wheel"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Buy button */}
      {canBuy && (
        <View style={[styles.buyBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: bottomPad + 8 }]}>
          <View>
            <Text style={[styles.buyBarPrice, { color: colors.primary }]}>${rip.spotPrice.toFixed(2)}</Text>
            <Text style={[styles.buyBarLabel, { color: colors.mutedForeground }]}>per spot</Text>
          </View>
          <TouchableOpacity
            style={[styles.buyBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              setCustomName(userName ?? "");
              setShowBuyModal(true);
            }}
          >
            <Text style={styles.buyBtnText}>Buy Spots</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Buy Modal */}
      <Modal visible={showBuyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Buy Spots</Text>

            <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>Your username</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border }]}
              value={customName}
              onChangeText={setCustomName}
              placeholder="Enter username"
              placeholderTextColor={colors.mutedForeground}
            />

            <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>Number of spots</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity
                style={[styles.qtyBtn, { backgroundColor: colors.secondary }]}
                onPress={() => setBuyQty(Math.max(1, buyQty - 1))}
              >
                <Text style={[styles.qtyBtnText, { color: colors.foreground }]}>-</Text>
              </TouchableOpacity>
              <Text style={[styles.qtyNum, { color: colors.foreground }]}>{buyQty}</Text>
              <TouchableOpacity
                style={[styles.qtyBtn, { backgroundColor: colors.secondary }]}
                onPress={() => setBuyQty(Math.min(availableSpots, buyQty + 1))}
              >
                <Text style={[styles.qtyBtnText, { color: colors.foreground }]}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.totalText, { color: colors.accent }]}>
              Total: ${(rip.spotPrice * buyQty).toFixed(2)}
            </Text>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => setShowBuyModal(false)}
              >
                <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                onPress={handleBuy}
                disabled={buySpotsMutation.isPending}
              >
                <Text style={styles.confirmBtnText}>
                  {buySpotsMutation.isPending ? "Buying..." : "Confirm"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Winner Modal */}
      <Modal visible={showWinnerModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.winnerModal, { backgroundColor: colors.card }]}>
            <Text style={styles.trophyEmoji}>🏆</Text>
            <Text style={[styles.winnerModalTitle, { color: colors.accent }]}>Winner!</Text>
            <Text style={[styles.winnerModalName, { color: colors.foreground }]}>
              {spinResult?.winnerName}
            </Text>
            <Text style={[styles.winnerModalSlot, { color: colors.mutedForeground }]}>
              Slot #{spinResult?.winnerSlot}
            </Text>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: colors.primary, marginTop: 20 }]}
              onPress={() => setShowWinnerModal(false)}
            >
              <Text style={styles.confirmBtnText}>Awesome!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { fontSize: 16 },
  backRow: { paddingHorizontal: 16, marginBottom: 12 },
  backBtn: {},
  backText: { fontSize: 16, fontFamily: "Inter_500Medium" },
  itemCard: {
    flexDirection: "row",
    gap: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  itemImage: {
    width: 80,
    height: 100,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  itemImageIcon: { fontSize: 36 },
  itemInfo: { flex: 1, gap: 4 },
  itemName: { fontSize: 17, fontFamily: "Inter_700Bold", lineHeight: 22 },
  itemDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  itemValue: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginTop: 4 },
  statsRow: { flexDirection: "row", paddingHorizontal: 12, gap: 8, marginBottom: 20 },
  statBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  statValue: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 2 },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },
  wheelSection: { alignItems: "center", paddingVertical: 20, gap: 16 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
  winnerBanner: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  winnerBannerText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  adminSection: { paddingHorizontal: 16, paddingTop: 24, gap: 12 },
  adminBtns: { flexDirection: "row", gap: 10 },
  adminBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  adminBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  buyBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  buyBarPrice: { fontSize: 22, fontFamily: "Inter_700Bold" },
  buyBarLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  buyBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buyBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#00000088",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 14,
  },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 4 },
  modalLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnText: { fontSize: 24, fontFamily: "Inter_400Regular" },
  qtyNum: { fontSize: 28, fontFamily: "Inter_700Bold", minWidth: 40, textAlign: "center" },
  totalText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  winnerModal: {
    margin: 32,
    padding: 32,
    borderRadius: 24,
    alignItems: "center",
    alignSelf: "center",
    width: "80%",
    gap: 8,
  },
  trophyEmoji: { fontSize: 64 },
  winnerModalTitle: { fontSize: 32, fontFamily: "Inter_700Bold" },
  winnerModalName: { fontSize: 22, fontFamily: "Inter_700Bold" },
  winnerModalSlot: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
