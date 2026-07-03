import {
  useListItems,
  useCreateRip,
  getListRipsQueryKey,
  getListItemsQueryKey,
} from "@workspace/api-client-react";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";

export default function CreateRipScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const queryClient = useQueryClient();

  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [spotCount, setSpotCount] = useState("10");
  const [spotPrice, setSpotPrice] = useState("19.99");
  const [startActive, setStartActive] = useState(false);

  const { data: items, isLoading: itemsLoading } = useListItems({
    query: { queryKey: getListItemsQueryKey() },
  });

  const createMutation = useCreateRip({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRipsQueryKey() });
        router.back();
      },
    },
  });

  const handleCreate = () => {
    if (!selectedItemId) {
      Alert.alert("Error", "Select an item");
      return;
    }
    if (!spotCount || !spotPrice) {
      Alert.alert("Error", "Fill in all fields");
      return;
    }
    createMutation.mutate({
      data: {
        itemId: selectedItemId,
        spotCount: Number(spotCount),
        spotPrice: Number(spotPrice),
        status: startActive ? "active" : "pending",
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={[styles.header, { paddingTop: topPad + 8 }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.back, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>Create Rip</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.form}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Select Item</Text>
          {itemsLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <View style={styles.itemsList}>
              {(items ?? []).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setSelectedItemId(item.id)}
                  style={[
                    styles.itemOption,
                    {
                      backgroundColor: selectedItemId === item.id ? colors.primary + "22" : colors.card,
                      borderColor: selectedItemId === item.id ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.itemOptionName, { color: colors.foreground }]}>{item.name}</Text>
                  <Text style={[styles.itemOptionMeta, { color: colors.mutedForeground }]}>
                    {item.category} · ${item.estimatedValue}
                  </Text>
                </TouchableOpacity>
              ))}
              {(items ?? []).length === 0 && (
                <Text style={[styles.noItems, { color: colors.mutedForeground }]}>
                  No items yet. Create an item first.
                </Text>
              )}
            </View>
          )}

          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Rip Settings</Text>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Number of Spots</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
            value={spotCount}
            onChangeText={setSpotCount}
            placeholder="10"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="number-pad"
          />

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Price Per Spot ($)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
            value={spotPrice}
            onChangeText={setSpotPrice}
            placeholder="19.99"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
          />

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Status</Text>
          <View style={styles.statusRow}>
            {["Pending", "Active"].map((s) => {
              const isSelected = startActive ? s === "Active" : s === "Pending";
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => setStartActive(s === "Active")}
                  style={[
                    styles.statusBtn,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.card,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.statusBtnText, { color: isSelected ? "#fff" : colors.mutedForeground }]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.summaryTitle, { color: colors.foreground }]}>Summary</Text>
            <Text style={[styles.summaryLine, { color: colors.mutedForeground }]}>
              {spotCount} spots × ${spotPrice} = ${(Number(spotCount) * Number(spotPrice)).toFixed(2)} max revenue
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: colors.primary }]}
            onPress={handleCreate}
            disabled={createMutation.isPending}
          >
            <Text style={styles.createBtnText}>
              {createMutation.isPending ? "Creating..." : "Create Rip"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  form: { paddingHorizontal: 16, gap: 12 },
  sectionLabel: { fontSize: 17, fontFamily: "Inter_600SemiBold", marginTop: 8 },
  itemsList: { gap: 8 },
  itemOption: { padding: 12, borderRadius: 12, borderWidth: 1 },
  itemOptionName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  itemOptionMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  noItems: { textAlign: "center", fontSize: 14, paddingVertical: 20 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  statusRow: { flexDirection: "row", gap: 10 },
  statusBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  statusBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  summary: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    marginTop: 4,
  },
  summaryTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  summaryLine: { fontSize: 13, fontFamily: "Inter_400Regular" },
  createBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  createBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
