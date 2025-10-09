import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import api from "../services/api";

enum InventoryCategory {
  ELECTRONICS = "electronics",
  OFFICE_SUPPLIES = "office_supplies",
  FURNITURE = "furniture",
  SAFETY_EQUIPMENT = "safety_equipment",
  TOOLS = "tools",
  CONSUMABLES = "consumables",
  OTHER = "other",
}

enum InventoryStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  OUT_OF_STOCK = "out_of_stock",
  DISCONTINUED = "discontinued",
  LOW_STOCK = "low_stock",
}

interface StockItem {
  id: string | number;
  name: string;
  category: InventoryCategory;
  currentStock: number;
  minStock: number;
  maxStock?: number;
  unit?: string;
  location?: string;
  lastUpdated?: string;
  status: InventoryStatus;
  supplier?: string;
  cost?: number;
  description: string;
}

interface StockTransaction {
  id: string;
  itemId: string;
  type: "in" | "out" | "adjustment";
  quantity: number;
  reason: string;
  timestamp: string;
  user: string;
}

const Stock = () => {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<StockItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionType, setTransactionType] = useState<"in" | "out">("in");
  const [transactionQuantity, setTransactionQuantity] = useState("");
  const [transactionReason, setTransactionReason] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<InventoryStatus | "all">(
    "all"
  );

  const categories = [
    { id: "all", name: "All", icon: "cube", color: "#6B7280" },
    {
      id: InventoryCategory.ELECTRONICS,
      name: "Electronics",
      icon: "hardware-chip",
      color: "#3B82F6",
    },
    {
      id: InventoryCategory.OFFICE_SUPPLIES,
      name: "Office Supplies",
      icon: "archive",
      color: "#8B5CF6",
    },
    {
      id: InventoryCategory.FURNITURE,
      name: "Furniture",
      icon: "bed",
      color: "#F59E0B",
    },
    {
      id: InventoryCategory.SAFETY_EQUIPMENT,
      name: "Safety Equipment",
      icon: "shield-checkmark",
      color: "#10B981",
    },
    {
      id: InventoryCategory.TOOLS,
      name: "Tools",
      icon: "hammer",
      color: "#F97316",
    },
    {
      id: InventoryCategory.CONSUMABLES,
      name: "Consumables",
      icon: "beaker",
      color: "#EF4444",
    },
    {
      id: InventoryCategory.OTHER,
      name: "Other",
      icon: "apps",
      color: "#6B7280",
    },
  ];

  const statusColors = {
    active: "#10B981",
    low_stock: "#F59E0B",
    out_of_stock: "#EF4444",
    inactive: "#6B7280",
    discontinued: "#9CA3AF",
  } as const;

  // const mockStockItems: StockItem[] = [
  //   {
  //     id: "1",
  //     name: "Safety Helmets",
  //     category: "ppe",
  //     currentStock: 45,
  //     minStock: 20,
  //     maxStock: 100,
  //     unit: "pieces",
  //     location: "Storage Room A",
  //     lastUpdated: "2024-01-15T10:30:00Z",
  //     status: "in_stock",
  //     supplier: "SafetyFirst Corp",
  //     cost: 25.99,
  //     description: "Hard hats with adjustable suspension system",
  //   },
  //   {
  //     id: "2",
  //     name: "Safety Goggles",
  //     category: "ppe",
  //     currentStock: 8,
  //     minStock: 15,
  //     maxStock: 50,
  //     unit: "pieces",
  //     location: "Storage Room A",
  //     lastUpdated: "2024-01-14T14:20:00Z",
  //     status: "low_stock",
  //     supplier: "VisionProtect Ltd",
  //     cost: 12.5,
  //     description: "Anti-fog safety goggles with UV protection",
  //   },
  //   {
  //     id: "3",
  //     name: "Drill Bits Set",
  //     category: "tools",
  //     currentStock: 0,
  //     minStock: 5,
  //     maxStock: 25,
  //     unit: "sets",
  //     location: "Tool Room",
  //     lastUpdated: "2024-01-12T09:15:00Z",
  //     status: "out_of_stock",
  //     supplier: "ToolMaster Inc",
  //     cost: 89.99,
  //     description: "Professional grade HSS drill bit set",
  //   },
  //   {
  //     id: "4",
  //     name: "Cleaning Solvent",
  //     category: "chemicals",
  //     currentStock: 12,
  //     minStock: 8,
  //     maxStock: 30,
  //     unit: "liters",
  //     location: "Chemical Storage",
  //     lastUpdated: "2024-01-13T16:45:00Z",
  //     status: "in_stock",
  //     supplier: "ChemClean Solutions",
  //     cost: 15.75,
  //     description: "Industrial degreasing solvent",
  //   },
  //   {
  //     id: "5",
  //     name: "Fire Extinguishers",
  //     category: "equipment",
  //     currentStock: 25,
  //     minStock: 20,
  //     maxStock: 40,
  //     unit: "pieces",
  //     location: "Equipment Bay",
  //     lastUpdated: "2024-01-10T11:30:00Z",
  //     status: "in_stock",
  //     supplier: "FireSafe Equipment",
  //     cost: 45.0,
  //     description: "ABC dry chemical fire extinguishers",
  //   },
  //   {
  //     id: "6",
  //     name: "First Aid Kits",
  //     category: "supplies",
  //     currentStock: 3,
  //     minStock: 10,
  //     maxStock: 25,
  //     unit: "kits",
  //     location: "Medical Supply Room",
  //     lastUpdated: "2024-01-11T13:20:00Z",
  //     status: "low_stock",
  //     supplier: "MedSupply Co",
  //     cost: 35.99,
  //     description: "Complete workplace first aid kits",
  //   },
  // ];

  const mapInventoryToStock = (item: any): StockItem => ({
    id: item?.id ?? "",
    name: item?.name ?? "Unnamed Item",
    category: (item?.category as InventoryCategory) ?? InventoryCategory.OTHER,
    currentStock: Number(item?.quantity ?? 0),
    minStock: Number(item?.min_stock_level ?? 0),
    maxStock: Number(item?.min_stock_level ?? 0) * 2,
    unit: "units",
    location: item?.location ?? "",
    lastUpdated: item?.updated_at ?? item?.created_at ?? "",
    status: (item?.status as InventoryStatus) ?? InventoryStatus.ACTIVE,
    supplier: item?.supplier ?? "",
    cost: Number(item?.price ?? 0),
    description: item?.description ?? "",
  });

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const params: any = { page, limit };
      if (selectedCategory !== "all") params.category = selectedCategory;
      if (selectedStatus !== "all") params.status = selectedStatus;
      const res = await api.get("/inventory", { params });
      const { items, totalPages: tp } = res.data;
      setStockItems(items.map(mapInventoryToStock));
      setTotalPages(tp);
    } catch (error) {
      console.error("Failed to load inventory", error);
      Alert.alert("Error", "Failed to load inventory");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [selectedCategory, selectedStatus, page, limit]);

  useEffect(() => {
    filterItems();
  }, [selectedCategory, searchQuery, stockItems]);

  const filterItems = () => {
    let filtered = stockItems.filter(Boolean);

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (item) =>
          item && item.category === (selectedCategory as InventoryCategory)
      );
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item &&
          (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.location || "")
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    const statusPriority: Record<InventoryStatus, number> = {
      out_of_stock: 5,
      low_stock: 4,
      discontinued: 3,
      inactive: 2,
      active: 1,
    };
    filtered.sort(
      (a, b) => statusPriority[b.status] - statusPriority[a.status]
    );

    setFilteredItems(filtered);
  };

  const getStatusText = (status: InventoryStatus) => {
    switch (status) {
      case "active":
        return "Active";
      case "inactive":
        return "Inactive";
      case "low_stock":
        return "Low Stock";
      case "out_of_stock":
        return "Out of Stock";
      case "discontinued":
        return "Discontinued";
      default:
        return "Unknown";
    }
  };

  const handleTransaction = async () => {
    if (!selectedItem || !transactionQuantity || !transactionReason) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const quantityDelta = parseInt(transactionQuantity, 10);
    if (isNaN(quantityDelta) || quantityDelta <= 0) {
      Alert.alert("Error", "Please enter a valid quantity");
      return;
    }

    const newQuantity =
      transactionType === "in"
        ? selectedItem.currentStock + quantityDelta
        : selectedItem.currentStock - quantityDelta;

    if (newQuantity < 0) {
      Alert.alert("Error", "Insufficient stock for this transaction");
      return;
    }

    try {
      await api.patch(`/inventory/${selectedItem.id}`, {
        quantity: newQuantity,
      });
      setStockItems((prev) =>
        prev.map((item) =>
          item.id === selectedItem.id
            ? {
                ...item,
                currentStock: newQuantity,
                status: getStockStatus(newQuantity, item.minStock),
                lastUpdated: new Date().toISOString(),
              }
            : item
        )
      );
      setShowTransactionModal(false);
      setTransactionQuantity("");
      setTransactionReason("");
    } catch (error) {
      console.error("Failed to update inventory", error);
      Alert.alert("Error", "Failed to update inventory");
    }
  };

  const getStockStatus = (
    quantity: number,
    minStock: number
  ): InventoryStatus => {
    if (quantity === 0) return InventoryStatus.OUT_OF_STOCK;
    if (quantity <= minStock) return InventoryStatus.LOW_STOCK;
    return InventoryStatus.ACTIVE;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const getStockPercentage = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100);
  };

  const renderStockCard = (item: StockItem) => {
    const categoryMeta = categories.find((c) => c.id === item?.category) || {
      color: "#6B7280",
      icon: "cube",
      name: "Unknown",
    };

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.stockCard,
          item.status === "out_of_stock" && styles.outOfStockCard,
        ]}
        onPress={() => setSelectedItem(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.itemInfo}>
            <View
              style={[
                styles.categoryIcon,
                { backgroundColor: categoryMeta.color },
              ]}
            >
              <Ionicons
                name={categoryMeta.icon as any}
                size={16}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemLocation}>{item.location || ""}</Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColors[item.status] },
            ]}
          >
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        <View style={styles.stockInfo}>
          <View style={styles.stockNumbers}>
            <Text style={styles.currentStock}>
              {item.currentStock} {item.unit}
            </Text>
            <Text style={styles.stockRange}>
              Min: {item.minStock} | Max: {item.maxStock}
            </Text>
          </View>

          <View style={styles.stockBar}>
            <View
              style={[
                styles.stockFill,
                {
                  width: `${getStockPercentage(item.currentStock, item.maxStock || 1)}%`,
                  backgroundColor: statusColors[item.status],
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.lastUpdated}>
            Updated: {formatDate(item.lastUpdated || "")}
          </Text>
          <Text style={styles.itemCost}>
            ${item.cost ? item.cost.toFixed(2) : "N/A"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderItemDetail = () => {
    if (!selectedItem) return null;

    const categoryMeta = categories.find(
      (c) => c.id === selectedItem.category
    ) || {
      color: "#6B7280",
      icon: "cube",
      name: "Unknown",
    };

    return (
      <Modal
        visible={!!selectedItem}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedItem(null)}
            >
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Stock Details</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.itemDetailCard}>
              <View style={styles.itemDetailHeader}>
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: categoryMeta.color },
                  ]}
                >
                  <Ionicons
                    name={categoryMeta.icon as any}
                    size={24}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.itemDetailInfo}>
                  <Text style={styles.itemDetailName}>{selectedItem.name}</Text>
                  <Text style={styles.itemDetailCategory}>
                    {categoryMeta.name}
                  </Text>
                </View>
              </View>

              <Text style={styles.itemDescription}>
                {selectedItem!.description}
              </Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Current Stock:</Text>
                <Text
                  style={[
                    styles.detailValue,
                    { color: statusColors[selectedItem!.status] },
                  ]}
                >
                  {selectedItem!.currentStock} {selectedItem!.unit}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusColors[selectedItem!.status] },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {getStatusText(selectedItem!.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Location:</Text>
                <Text style={styles.detailValue}>{selectedItem!.location}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Supplier:</Text>
                <Text style={styles.detailValue}>
                  {selectedItem!.supplier || "N/A"}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Unit Cost:</Text>
                <Text style={styles.detailValue}>
                  ${selectedItem!.cost?.toFixed(2) || "N/A"}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Stock Range:</Text>
                <Text style={styles.detailValue}>
                  {selectedItem!.minStock} - {selectedItem!.maxStock}{" "}
                  {selectedItem!.unit}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Last Updated:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(selectedItem!.lastUpdated || "")}
                </Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.stockInButton]}
                onPress={() => {
                  setTransactionType("in");
                  setShowTransactionModal(true);
                }}
              >
                <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Stock In</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.stockOutButton]}
                onPress={() => {
                  setTransactionType("out");
                  setShowTransactionModal(true);
                }}
              >
                <Ionicons name="remove-circle" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Stock Out</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  const renderTransactionModal = () => (
    <Modal
      visible={showTransactionModal}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.transactionModalOverlay}>
        <View style={styles.transactionModal}>
          <View style={styles.transactionHeader}>
            <Text style={styles.transactionTitle}>
              {transactionType === "in" ? "Stock In" : "Stock Out"}
            </Text>
            <TouchableOpacity onPress={() => setShowTransactionModal(false)}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          <View style={styles.transactionForm}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Quantity</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter quantity"
                value={transactionQuantity}
                onChangeText={setTransactionQuantity}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Reason</Text>
              <TextInput
                style={styles.formTextArea}
                placeholder="Enter reason for transaction"
                value={transactionReason}
                onChangeText={setTransactionReason}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.transactionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowTransactionModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  transactionType === "in"
                    ? styles.stockInButton
                    : styles.stockOutButton,
                ]}
                onPress={handleTransaction}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stock Management</Text>
        <TouchableOpacity style={styles.alertButton}>
          <Ionicons name="alert-circle" size={24} color="#EF4444" />
          <View style={styles.alertBadge}>
            <Text style={styles.alertCount}>
              {
                stockItems.filter(
                  (item) =>
                    item.status === "out_of_stock" ||
                    item.status === "low_stock"
                ).length
              }
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stock items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Ionicons
              name={category.icon as any}
              size={16}
              color={
                selectedCategory === category.id ? "#FFFFFF" : category.color
              }
            />
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === category.id &&
                  styles.categoryButtonTextActive,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Stock Items */}
      <ScrollView style={styles.stockContainer}>
        {filteredItems.length > 0 ? (
          <View style={styles.stockList}>
            {filteredItems.map(renderStockCard)}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>No items found</Text>
            <Text style={styles.emptyStateText}>
              Try adjusting your search or category filter
            </Text>
          </View>
        )}
      </ScrollView>

      {renderItemDetail()}
      {renderTransactionModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  alertButton: {
    padding: 8,
    position: "relative",
  },
  alertBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#EF4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  alertCount: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: "#1F2937",
  },
  categoriesContainer: {
    maxHeight: 60,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  categoriesContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  categoryButtonActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    marginLeft: 4,
  },
  categoryButtonTextActive: {
    color: "#FFFFFF",
  },
  stockContainer: {
    flex: 1,
  },
  stockList: {
    padding: 20,
    gap: 16,
  },
  stockCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  outOfStockCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  itemInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
  },
  itemLocation: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  stockInfo: {
    marginBottom: 12,
  },
  stockNumbers: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  currentStock: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  stockRange: {
    fontSize: 12,
    color: "#6B7280",
  },
  stockBar: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
  },
  stockFill: {
    height: "100%",
    borderRadius: 3,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastUpdated: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  itemCost: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  itemDetailCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  itemDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  itemDetailInfo: {
    flex: 1,
  },
  itemDetailName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  itemDetailCategory: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  detailValue: {
    fontSize: 14,
    color: "#1F2937",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  stockInButton: {
    backgroundColor: "#10B981",
  },
  stockOutButton: {
    backgroundColor: "#EF4444",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  transactionModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  transactionModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  transactionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  transactionForm: {
    gap: 16,
  },
  formGroup: {
    gap: 8,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  formTextArea: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top",
  },
  transactionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default Stock;
