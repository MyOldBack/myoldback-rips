import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/contexts/UserContext";

export default function UsernameScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { userName, setUserName } = useUser();
  const [name, setName] = useState(userName ?? "");

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Username cannot be empty");
      return;
    }
    await setUserName(name.trim());
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.content, { paddingTop: topPad + 20 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.body}>
          <Text style={styles.icon}>👤</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Your Username</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            This name appears on spot slots when you buy into a rip
          </Text>

          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
            value={name}
            onChangeText={setName}
            placeholder="Enter username..."
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            maxLength={20}
          />

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            onPress={handleSave}
          >
            <Text style={styles.saveBtnText}>Save Username</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24 },
  backBtn: { marginBottom: 40 },
  backText: { fontSize: 16, fontFamily: "Inter_500Medium" },
  body: { flex: 1, alignItems: "center", gap: 16 },
  icon: { fontSize: 64 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    fontSize: 18,
    fontFamily: "Inter_500Medium",
    marginTop: 12,
    textAlign: "center",
  },
  saveBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
