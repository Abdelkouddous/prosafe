import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Chip } from "@/components/Chip";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/constants/Languages";
import {
  InventoryCategory,
  InventoryCondition,
  InventoryItem,
  fetchInventory,
  reportDefect,
  updateInventoryQuantity,
} from "@/services/inventoryApi";

const PAGE_SIZE = 20;
const DAY = 24 * 3600 * 1000;

const CATEGORIES: { id: InventoryCategory; key: TranslationKey }[] = [
  { id: "ppe", key: "catPpe" },
  { id: "fire_extinguisher", key: "catFireExtinguisher" },
  { id: "first_aid", key: "catFirstAid" },
  { id: "detection", key: "catDetection" },
  { id: "signage", key: "catSignage" },
  { id: "tools", key: "catTools" },
  { id: "consumables", key: "catConsumables" },
  { id: "other", key: "catOther" },
];

const notify = (msg: string) => {
  if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
  else Alert.alert(msg);
};

const expiryState = (iso: string | null): "expired" | "soon" | null => {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return "expired";
  return diff <= 30 * DAY ? "soon" : null;
};

export default function StockScreen() {
  const { t, isRTL, currentLanguage } = useLanguage();
  const { user } = useAuth();
  const isManager = user?.role === "admin" || user?.role === "sst_manager";

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<InventoryCategory | null>(null);
  const [condition, setCondition] = useState<InventoryCondition | null>(null);

  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [defectOpen, setDefectOpen] = useState(false);
  const [defectText, setDefectText] = useState("");
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const reqId = useRef(0);

  useEffect(() => {
    const h = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(h);
  }, [searchInput]);

  const load = useCallback(
    async (target: number, append: boolean) => {
      const id = ++reqId.current;
      try {
        const res = await fetchInventory({
          page: target,
          limit: PAGE_SIZE,
          search: search || undefined,
          category: category ?? undefined,
          condition: condition ?? undefined,
        });
        if (id !== reqId.current) return;
        setItems((cur) => (append ? [...cur, ...res.items] : res.items));
        setPage(target);
        setTotalPages(res.totalPages);
        setError(false);
      } catch {
        if (id === reqId.current) setError(true);
      } finally {
        if (id === reqId.current) {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
        }
      }
    },
    [search, category, condition]
  );

  useEffect(() => {
    setLoading(true);
    load(1, false);
  }, [load]);

  const onEnd = () => {
    if (loading || loadingMore || error || page >= totalPages) return;
    setLoadingMore(true);
    load(page + 1, true);
  };

  const submitDefect = async () => {
    if (!selected || !defectText.trim()) return;
    setSending(true);
    try {
      await reportDefect(selected.id, defectText.trim());
      setDefectOpen(false);
      setDefectText("");
      notify(t("defectReported"));
    } catch {
      notify(t("defectFailed"));
    } finally {
      setSending(false);
    }
  };

  const adjustQuantity = async (delta: number) => {
    if (!selected || updating) return;
    const next = selected.quantity + delta;
    if (next < 0) {
      notify(t("insufficientStock"));
      return;
    }
    setUpdating(true);
    try {
      await updateInventoryQuantity(selected.id, next);
      const upd = { ...selected, quantity: next };
      setSelected(upd);
      setItems((cur) => cur.map((i) => (i.id === upd.id ? upd : i)));
    } catch {
      notify(t("stockUpdateFailed"));
    } finally {
      setUpdating(false);
    }
  };

  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString(currentLanguage) : t("notSpecified");

  const catLabel = (c: InventoryCategory) =>
    t(CATEGORIES.find((x) => x.id === c)?.key ?? "catOther");

  const badges = (item: InventoryItem) => {
    const out: { label: string; color: string }[] = [];
    if (item.condition === "non_functional")
      out.push({ label: t("condNonFunctional"), color: "#DC2626" });
    if (item.quantity <= 0) out.push({ label: t("outOfStock"), color: "#EA580C" });
    else if (item.quantity <= item.min_stock_level)
      out.push({ label: t("lowStock"), color: "#EA580C" });
    const exp = expiryState(item.expiryDate);
    if (exp === "expired") out.push({ label: t("expired"), color: "#DC2626" });
    else if (exp === "soon")
      out.push({ label: `${t("expiresOn")} ${fmt(item.expiryDate)}`, color: "#EA580C" });
    if (out.length === 0 && item.condition === "functional")
      out.push({ label: t("condFunctional"), color: "#16A34A" });
    return out;
  };

  const renderItem = ({ item }: { item: InventoryItem }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelected(item)}>
      <View style={styles.cardRow}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.qty}>x{item.quantity}</Text>
      </View>
      <Text style={styles.meta}>
        {catLabel(item.category)}
        {item.location ? ` · ${item.location}` : ""}
      </Text>
      <View style={styles.badgeRow}>
        {badges(item).map((b) => (
          <View key={b.label} style={[styles.badge, { backgroundColor: b.color }]}>
            <Text style={styles.badgeText}>{b.label}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );

  const back = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)/menu"));

  return (
    <View style={[styles.container, { direction: isRTL ? "rtl" : "ltr" }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={back} style={styles.backBtn} accessibilityRole="button">
          <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>{t("equipmentTitle")}</Text>
      </View>

      <TextInput
        style={styles.search}
        value={searchInput}
        onChangeText={setSearchInput}
        placeholder={t("searchEquipment")}
        placeholderTextColor="#9CA3AF"
        textAlign={isRTL ? "right" : "left"}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={styles.chipsContent}>
        <Chip label={t("all")} selected={category === null} onPress={() => setCategory(null)} />
        {CATEGORIES.map((c) => (
          <Chip key={c.id} label={t(c.key)} selected={category === c.id} onPress={() => setCategory(c.id)} />
        ))}
      </ScrollView>
      <View style={styles.chipsContent}>
        <Chip label={t("all")} selected={condition === null} onPress={() => setCondition(null)} />
        <Chip label={t("condFunctional")} color="#16A34A" selected={condition === "functional"} onPress={() => setCondition("functional")} />
        <Chip label={t("condNonFunctional")} color="#DC2626" selected={condition === "non_functional"} onPress={() => setCondition("non_functional")} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} size="large" color="#2563EB" />
      ) : error && items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{t("loadFailed")}</Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              setLoading(true);
              load(1, false);
            }}
          >
            <Text style={styles.primaryBtnText}>{t("retry")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load(1, false);
              }}
            />
          }
          onEndReached={onEnd}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={<Text style={styles.empty}>{t("noEquipment")}</Text>}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ margin: 16 }} /> : null}
        />
      )}

      <Modal visible={!!selected && !defectOpen} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { direction: isRTL ? "rtl" : "ltr" }]}>
            {selected && (
              <>
                <Text style={styles.sheetTitle}>{selected.name}</Text>
                {!!selected.description && <Text style={styles.meta}>{selected.description}</Text>}
                <View style={styles.badgeRow}>
                  {badges(selected).map((b) => (
                    <View key={b.label} style={[styles.badge, { backgroundColor: b.color }]}>
                      <Text style={styles.badgeText}>{b.label}</Text>
                    </View>
                  ))}
                </View>
                <DetailRow label={t("quantityLabel")} value={String(selected.quantity)} />
                <DetailRow label={t("locationLabel")} value={selected.location || t("notSpecified")} />
                <DetailRow label={t("nextInspection")} value={fmt(selected.nextInspectionAt)} />
                <DetailRow label={t("expiryDateLabel")} value={fmt(selected.expiryDate)} />

                {isManager && (
                  <View style={styles.stockRow}>
                    <TouchableOpacity
                      style={[styles.stepBtn, { backgroundColor: "#DC2626" }]}
                      disabled={updating}
                      onPress={() => adjustQuantity(-1)}
                      accessibilityLabel={t("stockOut")}
                    >
                      <Ionicons name="remove" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.stockQty}>{selected.quantity}</Text>
                    <TouchableOpacity
                      style={[styles.stepBtn, { backgroundColor: "#16A34A" }]}
                      disabled={updating}
                      onPress={() => adjustQuantity(1)}
                      accessibilityLabel={t("stockIn")}
                    >
                      <Ionicons name="add" size={22} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: "#EA580C" }]} onPress={() => setDefectOpen(true)}>
                  <Text style={styles.primaryBtnText}>{t("reportDefect")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setSelected(null)}>
                  <Text style={styles.secondaryBtnText}>{t("close")}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={defectOpen} transparent animationType="fade" onRequestClose={() => setDefectOpen(false)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { direction: isRTL ? "rtl" : "ltr" }]}>
            <Text style={styles.sheetTitle}>{t("reportDefect")}</Text>
            <Text style={styles.meta}>{selected?.name}</Text>
            <TextInput
              style={styles.textarea}
              value={defectText}
              onChangeText={setDefectText}
              placeholder={t("defectDescription")}
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={500}
              textAlign={isRTL ? "right" : "left"}
            />
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: "#DC2626", opacity: defectText.trim() && !sending ? 1 : 0.5 }]}
              disabled={!defectText.trim() || sending}
              onPress={submitDefect}
            >
              {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{t("send")}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setDefectOpen(false)}>
              <Text style={styles.secondaryBtnText}>{t("cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  topBar: { flexDirection: "row", alignItems: "center", paddingTop: 48, paddingHorizontal: 12, paddingBottom: 8, backgroundColor: "#fff" },
  backBtn: { padding: 8 },
  topTitle: { flex: 1, fontSize: 20, fontWeight: "700", color: "#1F2937", marginHorizontal: 8 },
  search: { margin: 12, marginBottom: 4, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#fff", fontSize: 16, color: "#111827" },
  chips: { flexGrow: 0 },
  chipsContent: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 12, paddingVertical: 6 },
  list: { padding: 12, paddingBottom: 40 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#E5E7EB" },
  cardRow: { flexDirection: "row", justifyContent: "space-between" },
  name: { flex: 1, fontSize: 16, fontWeight: "600", color: "#111827" },
  qty: { fontSize: 16, fontWeight: "700", color: "#374151" },
  meta: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  center: { alignItems: "center", marginTop: 40, padding: 16 },
  errorText: { color: "#DC2626", marginBottom: 12, fontSize: 16 },
  empty: { textAlign: "center", color: "#6B7280", marginTop: 40, fontSize: 16 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  sheetTitle: { fontSize: 20, fontWeight: "700", color: "#111827" },
  detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  detailLabel: { color: "#6B7280", fontSize: 15 },
  detailValue: { color: "#111827", fontSize: 15, fontWeight: "600" },
  stockRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20, marginTop: 12 },
  stepBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  stockQty: { fontSize: 22, fontWeight: "700", minWidth: 40, textAlign: "center" },
  primaryBtn: { marginTop: 14, backgroundColor: "#2563EB", padding: 14, borderRadius: 10, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  secondaryBtn: { marginTop: 8, padding: 12, alignItems: "center" },
  secondaryBtnText: { color: "#374151", fontSize: 16 },
  textarea: { marginTop: 12, minHeight: 100, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, padding: 10, fontSize: 16, textAlignVertical: "top", color: "#111827" },
});
