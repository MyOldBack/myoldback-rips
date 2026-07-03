import {
  useListRips,
  useUpdateRip,
  useDeleteRip,
  useListItems,
  getListRipsQueryKey,
  getListItemsQueryKey,
} from "@workspace/api-client-react";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

const STATUS_COLOR: Record<string, string> = {
  pending: "#F59E0B",
  active: "#10B981",
  spinning: "#3B82F6",
  completed: "#6B7280",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  active: "Active",
  spinning: "Spinning",
  completed: "Done",
};

export default function AdminRipsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const qc = useQueryClient();

  // Which rip is having its item changed (null = picker closed)
  const [changingRipId, setChangingRipId] = useState<number | null>(null);

  const { data: rips, isLoading, refetch, isRefetching } = useListRips({
    query: { queryKey: getListRipsQueryKey() },
  });
  const { data: items } = useListItems({
    query: { queryKey: getListItemsQueryKey() },
  });

  const updateMutation = useUpdateRip({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListRipsQueryKey() });
        setChangingRipId(null);
      },
    },
  });

  const deleteMutation = useDeleteRip({
    mutation: {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListRipsQueryKey() }),
    },
  });

  const handleChangeItem = (ripId: number, itemId: number) => {
    updateMutation.mutate({ id: ripId, data: { itemId } });
  };

  const handleDelete = (ripId: number, itemName: string) => {
    Alert.alert(
      "Delete Rip",
      `Delete the rip for "${itemName}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate({ id: ripId }),
        },
      ]
    );
  };

  const changingRip = rips?.find((r) => r.id === changingRipId);

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPad + 8 }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.back, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>Manage Rips</Text>
          <TouchableOpacity
            onPress={() => router.push("/admin/create-rip" as any)}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
          >
            <Feather name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={rips}
            keyExtractor={(r) => String(r.id)}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={[styles.emptyIcon]}>📦</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  No rips yet. Tap + to create one.
                </Text>
              </View>
            }
            renderItem={({ item: rip }) => {
              const statusColor = STATUS_COLOR[rip.status] ?? colors.mutedForeground;
              return (
                <View style={[styles.ripCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {/* Status bar accent */}
                  <View style={[styles.statusBar, { backgroundColor: statusColor }]} />

                  <View style={styles.ripBody}>
                    {/* Top row: item name + status */}
                    <View style={styles.ripTopRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
                          {rip.itemName}
                        </Text>
                        <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>
                          ${rip.itemEstimatedValue.toFixed(2)} · {rip.spotsSold}/{rip.spotCount} spots
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusColor + "22" }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                          {STATUS_LABEL[rip.status] ?? rip.status}
                        </Text>
                      </View>
                    </View>

                    {/* Divider */}
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    {/* Action row */}
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "44" }]}
                        onPress={() => setChangingRipId(rip.id)}
                        disabled={rip.status === "completed"}
                      >
                        <Feather name="package" size={14} color={colors.primary} />
                        <Text style={[styles.actionBtnText, { color: colors.primary }]}>Change Item</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: "#F59E0B18", borderColor: "#F59E0B44" }]}
                        onPress={() => router.push(`/admin/rip-cards/${rip.id}` as any)}
                      >
                        <Feather name="credit-card" size={14} color="#F59E0B" />
                        <Text style={[styles.actionBtnText, { color: "#F59E0B" }]}>Cards</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.destructive + "18", borderColor: colors.destructive + "44" }]}
                        onPress={() => handleDelete(rip.id, rip.itemName)}
                      >
                        <Feather name="trash-2" size={14} color={colors.destructive} />
                        <Text style={[styles.actionBtnText, { color: colors.destructive }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>

      {/* ── Item picker bottom sheet ── */}
      <Modal
        visible={changingRipId !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setChangingRipId(null)}
      >
        <View style={styles.sheetOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setChangingRipId(null)} />
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            <View style={styles.sheetHandle} />

            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
              Change Item
            </Text>
            {changingRip && (
              <Text style={[styles.sheetSub, { color: colors.mutedForeground }]}>
                Currently: {changingRip.itemName}
              </Text>
            )}

            {updateMutation.isPending ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
            ) : (
              <ScrollView
                style={styles.itemPickerList}
                showsVerticalScrollIndicator={false}
              >
                {(items ?? []).map((item) => {
                  const isCurrent = item.id === changingRip?.itemId;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.itemPickerRow,
                        {
                          backgroundColor: isCurrent ? colors.primary + "18" : colors.background,
                          borderColor: isCurrent ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => {
                        if (changingRipId !== null) {
                          handleChangeItem(changingRipId, item.id);
                        }
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.pickerItemName, { color: colors.foreground }]}>
                          {item.name}
                        </Text>
                        <Text style={[styles.pickerItemMeta, { color: colors.mutedForeground }]}>
                          {item.category} · ${item.estimatedValue.toFixed(2)}
                        </Text>
                      </View>
                      {isCurrent && (
                        <Feather name="check-circle" size={18} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
                {(items ?? []).length === 0 && (
                  <Text style={[styles.noItemsText, { color: colors.mutedForeground }]}>
                    No items in catalog. Create items first.
                  </Text>
                )}
              </ScrollView>
            )}

            <TouchableOpacity
              style={[styles.cancelSheetBtn, { borderColor: colors.border }]}
              onPress={() => setChangingRipId(null)}
            >
              <Text style={[styles.cancelSheetText, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  back: { fontSize: 16, fontFamily: "Inter_500Medium" },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },

  // Rip card
  ripCard: {
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    overflow: "hidden",
  },
  statusBar: { width: 4 },
  ripBody: { flex: 1, padding: 14, gap: 10 },
  ripTopRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  itemName: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  itemMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  divider: { height: 1 },
  actionRow: { flexDirection: "row", gap: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  // Empty
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center" },

  // Bottom sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: "#00000088",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    maxHeight: "80%",
    gap: 12,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: "#ffffff33",
    alignSelf: "center",
    marginBottom: 4,
  },
  sheetTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  sheetSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: -4 },
  itemPickerList: { maxHeight: 320 },
  itemPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  pickerItemName: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  pickerItemMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  noItemsText: { textAlign: "center", fontSize: 14, paddingVertical: 20 },
  cancelSheetBtn: {
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    marginTop: 4,
  },
  cancelSheetText: { fontSize: 15, fontFamily: "Inter_500Medium" },
});
