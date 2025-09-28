import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

interface Flashcard {
  id: string;
  category: string;
  question: string;
  answer: string;
  difficulty: "easy" | "medium" | "hard";
}

interface Category {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  count: number;
}

const Flashcards = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completedCards, setCompletedCards] = useState<Set<string>>(new Set());
  const [flipAnimation] = useState(new Animated.Value(0));

  const categories: Category[] = [
    { id: "ppe", name: "PPE Safety", icon: "shield", color: "#10B981", count: 8 },
    { id: "fire", name: "Fire Safety", icon: "flame", color: "#EF4444", count: 6 },
    { id: "chemical", name: "Chemical Safety", icon: "flask", color: "#F59E0B", count: 7 },
    { id: "electrical", name: "Electrical Safety", icon: "flash", color: "#3B82F6", count: 5 },
    { id: "ergonomics", name: "Ergonomics", icon: "body", color: "#8B5CF6", count: 4 },
    { id: "emergency", name: "Emergency Procedures", icon: "medical", color: "#EF4444", count: 6 },
  ];

  const flashcards: Flashcard[] = [
    // PPE Safety
    {
      id: "ppe1",
      category: "ppe",
      question: "What are the main types of PPE required on construction sites?",
      answer: "Hard hat, safety glasses, steel-toed boots, high-visibility clothing, and hearing protection when noise levels exceed 85 dB.",
      difficulty: "easy"
    },
    {
      id: "ppe2",
      category: "ppe",
      question: "How often should safety harnesses be inspected?",
      answer: "Before each use and formally inspected every 6 months by a competent person.",
      difficulty: "medium"
    },
    // Fire Safety
    {
      id: "fire1",
      category: "fire",
      question: "What does the acronym PASS stand for in fire extinguisher use?",
      answer: "Pull the pin, Aim at the base of the fire, Squeeze the handle, Sweep from side to side.",
      difficulty: "easy"
    },
    {
      id: "fire2",
      category: "fire",
      question: "What type of fire extinguisher should be used for electrical fires?",
      answer: "Class C (CO2 or dry chemical) extinguishers should be used for electrical fires.",
      difficulty: "medium"
    },
    // Chemical Safety
    {
      id: "chem1",
      category: "chemical",
      question: "What information is found on a Safety Data Sheet (SDS)?",
      answer: "Chemical composition, hazards, safe handling procedures, emergency measures, and disposal information.",
      difficulty: "medium"
    },
    {
      id: "chem2",
      category: "chemical",
      question: "What should you do if chemicals splash in your eyes?",
      answer: "Immediately flush with clean water for at least 15 minutes and seek medical attention.",
      difficulty: "easy"
    },
    // Electrical Safety
    {
      id: "elec1",
      category: "electrical",
      question: "What is the minimum safe distance from overhead power lines?",
      answer: "At least 10 feet (3 meters) for lines up to 50kV, more for higher voltages.",
      difficulty: "hard"
    },
    {
      id: "elec2",
      category: "electrical",
      question: "What does LOTO stand for?",
      answer: "Lockout/Tagout - a safety procedure to ensure equipment is properly shut off and cannot be started up again.",
      difficulty: "medium"
    },
    // Ergonomics
    {
      id: "ergo1",
      category: "ergonomics",
      question: "What is the maximum safe lifting weight for one person?",
      answer: "Generally 23kg (50 lbs), but depends on individual capability, lifting technique, and frequency.",
      difficulty: "medium"
    },
    {
      id: "ergo2",
      category: "ergonomics",
      question: "What are the key principles of safe lifting?",
      answer: "Keep back straight, bend knees, lift with legs, keep load close to body, avoid twisting.",
      difficulty: "easy"
    },
    // Emergency Procedures
    {
      id: "emerg1",
      category: "emergency",
      question: "What are the steps in emergency response?",
      answer: "1. Assess the situation, 2. Ensure personal safety, 3. Call for help, 4. Provide first aid if trained, 5. Evacuate if necessary.",
      difficulty: "medium"
    },
    {
      id: "emerg2",
      category: "emergency",
      question: "Where should you go during a fire evacuation?",
      answer: "To the designated assembly point, away from the building, and wait for further instructions.",
      difficulty: "easy"
    },
  ];

  const filteredCards = selectedCategory
    ? flashcards.filter(card => card.category === selectedCategory)
    : [];

  const currentCard = filteredCards[currentCardIndex];

  const flipCard = () => {
    Animated.timing(flipAnimation, {
      toValue: isFlipped ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const nextCard = () => {
    if (currentCardIndex < filteredCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
      flipAnimation.setValue(0);
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
      flipAnimation.setValue(0);
    }
  };

  const markAsCompleted = () => {
    if (currentCard) {
      setCompletedCards(prev => new Set([...prev, currentCard.id]));
    }
  };

  const resetProgress = () => {
    setCompletedCards(new Set());
    setCurrentCardIndex(0);
    setIsFlipped(false);
    flipAnimation.setValue(0);
  };

  const frontAnimatedStyle = {
    transform: [
      {
        rotateY: flipAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "180deg"],
        }),
      },
    ],
  };

  const backAnimatedStyle = {
    transform: [
      {
        rotateY: flipAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: ["180deg", "360deg"],
        }),
      },
    ],
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "#10B981";
      case "medium": return "#F59E0B";
      case "hard": return "#EF4444";
      default: return "#6B7280";
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (selectedCategory) {
              setSelectedCategory(null);
              setCurrentCardIndex(0);
              setIsFlipped(false);
              flipAnimation.setValue(0);
            } else {
              router.back();
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {selectedCategory ? "Flashcards" : "Safety Flashcards"}
        </Text>
        {selectedCategory && (
          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetProgress}
          >
            <Ionicons name="refresh" size={24} color="#1F2937" />
          </TouchableOpacity>
        )}
        {!selectedCategory && <View style={styles.placeholder} />}
      </View>

      <ScrollView style={styles.content}>
        {!selectedCategory ? (
          <>
            <Text style={styles.sectionTitle}>Choose a Category</Text>
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
                  <Text style={styles.categoryTitle}>{category.name}</Text>
                  <Text style={styles.categoryCount}>{category.count} cards</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <>
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                {currentCardIndex + 1} of {filteredCards.length}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${((currentCardIndex + 1) / filteredCards.length) * 100}%` }
                  ]}
                />
              </View>
              <Text style={styles.completedText}>
                {completedCards.size} completed
              </Text>
            </View>

            {/* Flashcard */}
            {currentCard && (
              <View style={styles.cardContainer}>
                <TouchableOpacity onPress={flipCard} style={styles.card}>
                  <Animated.View style={[styles.cardFace, styles.cardFront, frontAnimatedStyle]}>
                    <View style={styles.cardHeader}>
                      <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(currentCard.difficulty) }]}>
                        <Text style={styles.difficultyText}>{currentCard.difficulty.toUpperCase()}</Text>
                      </View>
                      {completedCards.has(currentCard.id) && (
                        <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                      )}
                    </View>
                    <View style={styles.cardContent}>
                      <Ionicons name="help-circle" size={48} color="#3B82F6" style={styles.cardIcon} />
                      <Text style={styles.questionText}>{currentCard.question}</Text>
                      <Text style={styles.tapHint}>Tap to reveal answer</Text>
                    </View>
                  </Animated.View>

                  <Animated.View style={[styles.cardFace, styles.cardBack, backAnimatedStyle]}>
                    <View style={styles.cardHeader}>
                      <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(currentCard.difficulty) }]}>
                        <Text style={styles.difficultyText}>{currentCard.difficulty.toUpperCase()}</Text>
                      </View>
                      {completedCards.has(currentCard.id) && (
                        <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                      )}
                    </View>
                    <View style={styles.cardContent}>
                      <Ionicons name="bulb" size={48} color="#10B981" style={styles.cardIcon} />
                      <Text style={styles.answerText}>{currentCard.answer}</Text>
                    </View>
                  </Animated.View>
                </TouchableOpacity>

                {/* Card Controls */}
                <View style={styles.cardControls}>
                  <TouchableOpacity
                    style={[styles.controlButton, currentCardIndex === 0 && styles.controlButtonDisabled]}
                    onPress={prevCard}
                    disabled={currentCardIndex === 0}
                  >
                    <Ionicons name="chevron-back" size={24} color={currentCardIndex === 0 ? "#9CA3AF" : "#1F2937"} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.completedButton,
                      completedCards.has(currentCard.id) && styles.completedButtonActive
                    ]}
                    onPress={markAsCompleted}
                  >
                    <Ionicons
                      name={completedCards.has(currentCard.id) ? "checkmark-circle" : "checkmark-circle-outline"}
                      size={24}
                      color={completedCards.has(currentCard.id) ? "#FFFFFF" : "#10B981"}
                    />
                    <Text style={[
                      styles.completedButtonText,
                      completedCards.has(currentCard.id) && styles.completedButtonTextActive
                    ]}>
                      {completedCards.has(currentCard.id) ? "Completed" : "Mark Complete"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.controlButton, currentCardIndex === filteredCards.length - 1 && styles.controlButtonDisabled]}
                    onPress={nextCard}
                    disabled={currentCardIndex === filteredCards.length - 1}
                  >
                    <Ionicons name="chevron-forward" size={24} color={currentCardIndex === filteredCards.length - 1 ? "#9CA3AF" : "#1F2937"} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
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
  resetButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
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
  progressContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    marginHorizontal: 16,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3B82F6",
    borderRadius: 4,
  },
  completedText: {
    fontSize: 12,
    color: "#10B981",
  },
  cardContainer: {
    alignItems: "center",
  },
  card: {
    width: width - 40,
    height: 400,
    marginBottom: 20,
  },
  cardFace: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    backfaceVisibility: "hidden",
  },
  cardFront: {
    backgroundColor: "#FFFFFF",
  },
  cardBack: {
    backgroundColor: "#F8FAFC",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  cardContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cardIcon: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 20,
  },
  answerText: {
    fontSize: 16,
    color: "#374151",
    textAlign: "center",
    lineHeight: 24,
  },
  tapHint: {
    fontSize: 14,
    color: "#6B7280",
    fontStyle: "italic",
  },
  cardControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  controlButtonDisabled: {
    backgroundColor: "#F3F4F6",
  },
  completedButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#10B981",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completedButtonActive: {
    backgroundColor: "#10B981",
  },
  completedButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981",
    marginLeft: 8,
  },
  completedButtonTextActive: {
    color: "#FFFFFF",
  },
});

export default Flashcards;