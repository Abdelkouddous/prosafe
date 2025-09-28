import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: "safety" | "company" | "industry" | "regulatory";
  priority: "low" | "medium" | "high" | "urgent";
  publishedAt: string;
  author: string;
  imageUrl?: string;
  tags: string[];
  readTime: number;
  isRead: boolean;
}

const News = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<NewsArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  const categories = [
    { id: "all", name: "All", icon: "newspaper", color: "#6B7280" },
    { id: "safety", name: "Safety", icon: "shield-checkmark", color: "#10B981" },
    { id: "company", name: "Company", icon: "business", color: "#3B82F6" },
    { id: "industry", name: "Industry", icon: "construct", color: "#F59E0B" },
    { id: "regulatory", name: "Regulatory", icon: "document-text", color: "#EF4444" },
  ];

  const priorityColors = {
    low: "#10B981",
    medium: "#F59E0B",
    high: "#EF4444",
    urgent: "#7C2D12",
  };

  const mockArticles: NewsArticle[] = [
    {
      id: "1",
      title: "New Safety Protocol Implementation",
      summary: "Updated safety protocols for chemical handling procedures are now in effect.",
      content: "Following recent safety assessments, we are implementing enhanced protocols for chemical handling. All personnel must complete the updated training module by the end of this month. Key changes include mandatory double-checking procedures, updated PPE requirements, and new emergency response protocols.",
      category: "safety",
      priority: "high",
      publishedAt: "2024-01-15T10:30:00Z",
      author: "Safety Department",
      tags: ["protocols", "chemical", "training"],
      readTime: 3,
      isRead: false,
    },
    {
      id: "2",
      title: "Q4 Safety Performance Review",
      summary: "Company achieves record-low incident rate in Q4 2023.",
      content: "We're proud to announce that our Q4 2023 safety performance shows a 25% reduction in incidents compared to the previous quarter. This achievement is the result of our collective commitment to safety excellence. Special recognition goes to the maintenance team for their zero-incident record.",
      category: "company",
      priority: "medium",
      publishedAt: "2024-01-12T14:15:00Z",
      author: "Management Team",
      tags: ["performance", "achievements", "recognition"],
      readTime: 2,
      isRead: true,
    },
    {
      id: "3",
      title: "OSHA Updates Workplace Safety Standards",
      summary: "New federal regulations affect workplace safety requirements.",
      content: "The Occupational Safety and Health Administration has updated several workplace safety standards that will take effect next quarter. Key changes include revised fall protection requirements, updated respiratory protection standards, and new guidelines for workplace violence prevention programs.",
      category: "regulatory",
      priority: "urgent",
      publishedAt: "2024-01-10T09:00:00Z",
      author: "Regulatory Affairs",
      tags: ["OSHA", "regulations", "compliance"],
      readTime: 5,
      isRead: false,
    },
    {
      id: "4",
      title: "Industry Best Practices: Digital Safety Management",
      summary: "How leading companies are leveraging technology for safety management.",
      content: "A comprehensive look at how industry leaders are implementing digital solutions for safety management. From IoT sensors for real-time monitoring to AI-powered risk assessment tools, technology is revolutionizing workplace safety. Learn about the latest trends and their practical applications.",
      category: "industry",
      priority: "medium",
      publishedAt: "2024-01-08T16:45:00Z",
      author: "Industry Research",
      tags: ["technology", "digital", "innovation"],
      readTime: 4,
      isRead: false,
    },
    {
      id: "5",
      title: "Emergency Response Drill Results",
      summary: "Monthly emergency drill shows improved response times.",
      content: "Our January emergency response drill demonstrated significant improvements in evacuation procedures. Average evacuation time decreased by 15% compared to last month. Areas for improvement include better communication during the initial alert phase and clearer assembly point procedures.",
      category: "safety",
      priority: "low",
      publishedAt: "2024-01-05T11:20:00Z",
      author: "Emergency Response Team",
      tags: ["drill", "emergency", "evacuation"],
      readTime: 2,
      isRead: true,
    },
  ];

  useEffect(() => {
    setArticles(mockArticles);
    setFilteredArticles(mockArticles);
  }, []);

  useEffect(() => {
    filterArticles();
  }, [selectedCategory, searchQuery, articles]);

  const filterArticles = () => {
    let filtered = articles;

    if (selectedCategory !== "all") {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Sort by priority and date
    filtered.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    setFilteredArticles(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const markAsRead = (articleId: string) => {
    setArticles(prev =>
      prev.map(article =>
        article.id === articleId ? { ...article, isRead: true } : article
      )
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const renderArticleDetail = () => (
    <View style={styles.articleDetail}>
      <View style={styles.articleDetailHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedArticle(null)}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.articleDetailTitle}>Article</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.articleContent}>
        <View style={[
          styles.priorityBadge,
          { backgroundColor: priorityColors[selectedArticle!.priority] }
        ]}>
          <Text style={styles.priorityText}>
            {selectedArticle!.priority.toUpperCase()}
          </Text>
        </View>

        <Text style={styles.articleTitle}>{selectedArticle!.title}</Text>
        
        <View style={styles.articleMeta}>
          <Text style={styles.articleAuthor}>By {selectedArticle!.author}</Text>
          <Text style={styles.articleDate}>
            {formatDate(selectedArticle!.publishedAt)} • {selectedArticle!.readTime} min read
          </Text>
        </View>

        <View style={styles.articleTags}>
          {selectedArticle!.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.articleBody}>{selectedArticle!.content}</Text>
      </ScrollView>
    </View>
  );

  const renderArticleCard = (article: NewsArticle) => (
    <TouchableOpacity
      key={article.id}
      style={[styles.articleCard, !article.isRead && styles.unreadCard]}
      onPress={() => {
        markAsRead(article.id);
        setSelectedArticle(article);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={[
          styles.categoryBadge,
          { backgroundColor: categories.find(c => c.id === article.category)?.color || "#6B7280" }
        ]}>
          <Ionicons
            name={categories.find(c => c.id === article.category)?.icon as any || "newspaper"}
            size={12}
            color="#FFFFFF"
          />
          <Text style={styles.categoryText}>
            {categories.find(c => c.id === article.category)?.name || "News"}
          </Text>
        </View>
        
        <View style={[
          styles.priorityIndicator,
          { backgroundColor: priorityColors[article.priority] }
        ]} />
      </View>

      <Text style={styles.cardTitle} numberOfLines={2}>
        {article.title}
      </Text>
      
      <Text style={styles.cardSummary} numberOfLines={3}>
        {article.summary}
      </Text>

      <View style={styles.cardFooter}>
        <Text style={styles.cardDate}>{formatDate(article.publishedAt)}</Text>
        <Text style={styles.readTime}>{article.readTime} min read</Text>
        {!article.isRead && <View style={styles.unreadDot} />}
      </View>
    </TouchableOpacity>
  );

  if (selectedArticle) {
    return renderArticleDetail();
  }

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
        <Text style={styles.headerTitle}>News & Updates</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications" size={24} color="#1F2937" />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationCount}>
              {articles.filter(a => !a.isRead).length}
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
            placeholder="Search news..."
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
              selectedCategory === category.id && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Ionicons
              name={category.icon as any}
              size={16}
              color={selectedCategory === category.id ? "#FFFFFF" : category.color}
            />
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === category.id && styles.categoryButtonTextActive
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Articles */}
      <ScrollView
        style={styles.articlesContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredArticles.length > 0 ? (
          <View style={styles.articlesList}>
            {filteredArticles.map(renderArticleCard)}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="newspaper-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>No articles found</Text>
            <Text style={styles.emptyStateText}>
              Try adjusting your search or category filter
            </Text>
          </View>
        )}
      </ScrollView>
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
  notificationButton: {
    padding: 8,
    position: "relative",
  },
  notificationBadge: {
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
  notificationCount: {
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
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  categoriesContent: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 12,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  categoryButtonActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    marginLeft: 6,
  },
  categoryButtonTextActive: {
    color: "#FFFFFF",
  },
  articlesContainer: {
    flex: 1,
  },
  articlesList: {
    padding: 20,
    gap: 16,
  },
  articleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#3B82F6",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 4,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
    lineHeight: 22,
  },
  cardSummary: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  readTime: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3B82F6",
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
  articleDetail: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  articleDetailHeader: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  articleDetailTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  articleContent: {
    flex: 1,
    padding: 20,
  },
  priorityBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  articleTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    lineHeight: 32,
    marginBottom: 16,
  },
  articleMeta: {
    marginBottom: 16,
  },
  articleAuthor: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  articleDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  articleTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  tag: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  articleBody: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
  },
});

export default News;