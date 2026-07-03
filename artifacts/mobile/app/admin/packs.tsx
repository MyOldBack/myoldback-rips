import { useListPacks, useCreatePack, useUpdatePack, useDeletePack, getListPacksQueryKey } from "@workspace/api-client-react";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

export default function AdminPacksScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [spotCount, setSpotCount] = useState("3");
  const [price, setPrice] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: packs, isLoading, refetch, isRefetching } = useListPacks({
    query: { queryKey: getListPacksQueryKey() },
  });

  const createMutation = useCreatePack({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPacksQueryKey() });
        resetAndClose();
      },
    },
  });

  const updateMutation = useUpdatePack({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPacksQueryKey() });
        resetAndClose();
      },
    },
  });

  const deleteMutation = useDeletePack({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListPacksQueryKey() }),
    },
  });

  const resetAndClose = () => {
    setShowModal(false);
    setName(""); setSpotCount("3"); setPrice(""); setIsActive(true); setEditingId(null);
  };

  const openEdit = (pack: any) => {
    setEditingId(pack.id);
    setName(pack.name);
    setSpotCount(String(pack.spotCount));
    setPrice(String(pack.price));
    setIsActive(pack.isActive);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!name || !spotCount || !price) {
      Alert.alert("Error", "Fill in all fields");
      return;
    }
    const data = { name, spotCount: Number(spotCount), price: Number(price), isActive };
    if (editingId != null) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate({ data });
    }
  };

  const handleDelete = (id: number, packName: string) => {
    Alert.alert("Delete Pack", `Delete "${packName}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate({ id }) },
    ]);
  };

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 8 }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.back, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>Packs</Text>
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
            data={packs}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
            }
            renderItem={({ item }) => (
              <View style={[styles.packRow, { backgroundColor: colors.card, borderColor: colors.border, opacity: item.isActive ? 1 : 0.5 }]}>
                <View style={styles.packInfo}>
                  <Text style={[styles.packName, { color: colors.foreground }]}>{item.name}</Text>
                  <Text style={[styles.packMeta, { color: colors.mutedForeground }]}>
                    {item.spotCount} spots · ${item.price}
                    {item.discount > 0 ? ` (${item.discount}% off)` : ""}
                  </Text>
                  {!item.isActive && (
                    <Text style={[styles.inactiveTag, { color: colors.destructive }]}>Inactive</Text>
                  )}
                </View>
                <View style={styles.packActions}>
                  <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
                    <Feather name="edit-2" size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.actionBtn}>
                    <Feather name="trash-2" size={16} color={colors.destructive} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: colors.mutedForeground }]}>No packs configured</Text>
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
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
              {editingId ? "Edit Pack" : "New Pack"}
            </Text>

            {[
              { label: "Pack Name", value: name, onChange: setName, placeholder: "e.g. Value Pack" },
              { label: "Number of Spots", value: spotCount, onChange: setSpotCount, placeholder: "5", keyboardType: "number-pad" as const },
              { label: "Price ($)", value: price, onChange: setPrice, placeholder: "24.99", keyboardType: "decimal-pad" as const },
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

            <View style={styles.switchRow}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Active</Text>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ true: colors.primary, false: colors.secondary }}
                thumbColor={isActive ? "#fff" : colors.mutedForeground}
              />
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={resetAndClose}
              >
                <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                onPress={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                <Text style={styles.confirmText}>
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
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
  packRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  packInfo: { flex: 1 },
  packName: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  packMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  inactiveTag: { fontSize: 11, fontFamily: "Inter_500Medium", marginTop: 2 },
  packActions: { flexDirection: "row", gap: 12 },
  actionBtn: { padding: 4 },
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
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  cancelText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  confirmBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: "center" },
  confirmText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
});
