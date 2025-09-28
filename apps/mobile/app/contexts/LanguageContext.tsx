import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  TRANSLATIONS,
  LANGUAGES,
  LanguageCode,
  TranslationKey,
} from "../constants/Languages";

interface LanguageContextType {
  currentLanguage: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: TranslationKey) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>("en");

  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem("selectedLanguage");
      if (savedLanguage && TRANSLATIONS[savedLanguage as LanguageCode]) {
        setCurrentLanguage(savedLanguage as LanguageCode);
      }
    } catch (error) {
      console.error("Error loading saved language:", error);
    }
  };

  const setLanguage = async (language: LanguageCode) => {
    try {
      await AsyncStorage.setItem("selectedLanguage", language);
      setCurrentLanguage(language);
    } catch (error) {
      console.error("Error saving language:", error);
    }
  };

  const t = (key: TranslationKey): string => {
    return TRANSLATIONS[currentLanguage][key] || TRANSLATIONS.en[key] || key;
  };

  const isRTL = currentLanguage === "ar-DZ";

  return (
    <LanguageContext.Provider
      value={{ currentLanguage, setLanguage, t, isRTL }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
