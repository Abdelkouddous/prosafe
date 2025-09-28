import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

interface InfoCategory {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  items: InfoItem[];
}

interface InfoItem {
  id: string;
  title: string;
  content: string;
  category: string;
}

const Information = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<InfoItem | null>(null);

  const categories: InfoCategory[] = [
    {
      id: "safety",
      title: "Safety Guidelines",
      icon: "shield-checkmark",
      color: "#10B981",
      items: [
        {
          id: "ppe",
          title: "Personal Protective Equipment",
          content: "Always wear appropriate PPE including hard hats, safety glasses, steel-toed boots, and high-visibility clothing when required.",
          category: "safety"
        },
        {
          id: "emergency",
          title: "Emergency Procedures",
          content: "In case of emergency, follow the evacuation plan, report to designated assembly points, and contact emergency services if needed.",
          category: "safety"
        }
      ]
    },
    {
      id: "policies",
      title: "Company Policies",
      icon: "document-text",
      color: "#3B82F6",
      items: [
        {
          id: "conduct",
          title: "Code of Conduct",
          content: "All employees must maintain professional behavior, respect colleagues, and follow ethical guidelines in all business activities.",
          category: "policies"
        },
        {
          id: "attendance",
          title: "Attendance Policy",
          content: "Regular attendance is expected. Report absences in advance when possible and follow proper notification procedures.",
          category: "policies"
        }
      ]
    },
    {
      id: "procedures",
      title: "Work Procedures",
      icon: "clipboard",
      color: "#F59E0B",
      items: [
        {
          id: "lockout",
          title: "Lockout/Tagout",
          content: "Follow proper LOTO procedures when working on equipment. Ensure all energy sources are isolated and locked out.",
          category: "procedures"
        },
        {
          id: "permits",
          title: "Work Permits",
          content: "Obtain proper work permits for hot work, confined space entry, and other high-risk activities before starting work.",
          category: "procedures"
        }
      ]
    },
    {
      id: "contacts",
      title: "Emergency Contacts",
      icon: "call",
      color: "#EF4444",
      items: [
        {
          id: "emergency",
          title: "Emergency Services",
          content: "Fire/Police/Ambulance: 911\nSecurity: ext. 2222\nFirst Aid: ext. 3333",
          category: "contacts"
        },
        {
          id: "management",
          title: "Management Contacts",
          content: "Safety Manager: ext. 1111\nHR Department: ext. 4444\nMaintenance: ext. 5555",
          category: "contacts"
        }
      ]
    }
  ];

  const allItems = categories.flatMap(cat => cat.items);
  const filteredItems = allItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayItems = selectedCategory
    ? categories.find(cat => cat.id === selectedCategory)?.items || []
    : searchQuery
    ? filteredItems
    : [];

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
        <Text style={styles.headerTitle}>Information Center</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search information..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery("")}
            >
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content}>
        {!selectedCategory && !searchQuery && (
          <>
            <Text style={styles.sectionTitle}>Information Categories</Text>
            <View style={styles.categoriesGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                    <Ionicons name={category.icon} size={32} color="#FFFFFF" />
                  </View>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  <Text style={styles.categoryCount}>
                    {category.items.length} items
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {(selectedCategory || searchQuery) && (
          <>
            <View style={styles.breadcrumb}>
              {selectedCategory && (
                <TouchableOpacity
                  onPress={() => setSelectedCategory(null)}
                  style={styles.breadcrumbButton}
                >
                  <Text style={styles.breadcrumbText}>Categories</Text>
                  <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                </TouchableOpacity>
              )}
              <Text style={styles.breadcrumbCurrent}>
                {selectedCategory
                  ? categories.find(cat => cat.id === selectedCategory)?.title
                  : `Search Results (${filteredItems.length})`}
              </Text>
            </View>

            <View style={styles.itemsList}>
              {displayItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.itemCard}
                  onPress={() => setSelectedItem(item)}
                >
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemPreview} numberOfLines={2}>
                    {item.content}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Item Detail Modal */}
      {selectedItem && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedItem.title}</Text>
              <TouchableOpacity
                onPress={() => setSelectedItem(null)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalText}>{selectedItem.content}</Text>
            </ScrollView>
          </View>
        </View>
      )}
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
  placeholder: {
    width: 40,
  },
  searchContainer: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: "#1F2937",
  },
  clearButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  categoryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    width: "48%",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 12,
    color: "#6B7280",
  },
  breadcrumb: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  breadcrumbButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  breadcrumbText: {
    fontSize: 14,
    color: "#3B82F6",
    marginRight: 4,
  },
  breadcrumbCurrent: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  itemsList: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
    marginBottom: 4,
  },
  itemPreview: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
    marginRight: 12,
  },
  modal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    margin: 20,
    maxHeight: "80%",
    width: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#374151",
  },
});

export default Information;