import { useListItems, useCreateItem, useDeleteItem, getListItemsQueryKey } from "@workspace/api-client-react";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

export default function AdminItemsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [category, setCategory] = useState("Baseball");

  // Track which item id is in "confirm delete" mode
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const { data: items, isLoading, refetch, isRefetching } = useListItems({
    query: { queryKey: getListItemsQueryKey() },
  });

  const createMutation = useCreateItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListItemsQueryKey() });
        setShowModal(false);
        setName(""); setDescription(""); setValue(""); setCategory("Baseball");
      },
    },
  });

  const deleteMutation = useDeleteItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListItemsQueryKey() });
        setConfirmDeleteId(null);
      },
      onError: () => {
        setConfirmDeleteId(null);
      },
    },
  });

  const handleCreate = () => {
    if (!name || !description || !value) return;
    createMutation.mutate({
      data: { name, description, estimatedValue: Number(value), category, imageUrl: null },
    });
  };

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 8 }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.back, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>Items</Text>
          <TouchableOpacity
            onPress={() => setShowModal(true)}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
          >
            <Feather name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
            }
            renderItem={({ item }) => {
              const isConfirming = confirmDeleteId === item.id;
              const isDeleting = deleteMutation.isPending && confirmDeleteId === item.id;

              return (
                <View style={[styles.itemRow, { backgroundColor: colors.card, borderColor: isConfirming ? colors.destructive : colors.border }]}>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, { color: colors.foreground }]}>{item.name}</Text>
                    <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>
                      {item.category} · ${item.estimatedValue}
                    </Text>
                  </View>

                  {isConfirming ? (
                    <View style={styles.confirmRow}>
                      <TouchableOpacity
                        style={[styles.confirmBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                        onPress={() => setConfirmDeleteId(null)}
                      >
                        <Text style={[styles.confirmBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.confirmBtn, { backgroundColor: colors.destructive }]}
                        onPress={() => deleteMutation.mutate({ id: item.id })}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={[styles.confirmBtnText, { color: "#fff" }]}>Delete</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.rowActions}>
                      <TouchableOpacity
                        style={[styles.cardsBtn, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "44" }]}
                        onPress={() => router.push(`/admin/item-cards/${item.id}` as any)}
                      >
                        <Feather name="credit-card" size={13} color={colors.primary} />
                        <Text style={[styles.cardsBtnText, { color: colors.primary }]}>Cards</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteHitArea}
                        onPress={() => setConfirmDeleteId(item.id)}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      >
                        <Feather name="trash-2" size={18} color={colors.destructive} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            }}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: colors.mutedForeground }]}>No items yet</Text>
            }
          />
        )}
      </View>

      <Modal visible={showModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>New Item</Text>

            {[
              { label: "Name", value: name, onChange: setName, placeholder: "e.g. 2023 Topps Chrome Box" },
              { label: "Description", value: description, onChange: setDescription, placeholder: "Brief description" },
              { label: "Estimated Value ($)", value: value, onChange: setValue, placeholder: "99.99", keyboardType: "decimal-pad" as const },
              { label: "Category", value: category, onChange: setCategory, placeholder: "Baseball, Basketball..." },
            ].map((f) => (
              <View key={f.label}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{f.label}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border }]}
                  value={f.value}
                  onChangeText={f.onChange}
                  placeholder={f.placeholder}
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType={f.keyboardType}
                />
              </View>
            ))}

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => setShowModal(false)}
              >
                <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmCreateBtn, { backgroundColor: colors.primary }]}
                onPress={handleCreate}
                disabled={createMutation.isPending}
              >
                <Text style={styles.confirmCreateText}>
                  {createMutation.isPending ? "Creating..." : "Create"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 64,
  },
  itemInfo: { flex: 1, marginRight: 10 },
  itemName: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  itemMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  deleteHitArea: {
    padding: 10,
    marginRight: -4,
  },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  cardsBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  confirmRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  confirmBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 64,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 34,
  },
  confirmBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  empty: { textAlign: "center", marginTop: 60, fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: "#00000088", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12 },
  sheetTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 4 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  cancelText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  confirmCreateBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: "center" },
  confirmCreateText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
});
