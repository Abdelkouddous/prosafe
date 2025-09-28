export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
}

export type LanguageCode = "ar-DZ" | "fr" | "en";

export type TranslationKey =
  | "prosafe"
  | "safetyManagementSystem"
  | "signIn"
  | "signUp"
  | "email"
  | "password"
  | "confirmPassword"
  | "firstName"
  | "lastName"
  | "createAccount"
  | "newToProsafe"
  | "alreadyHaveAccount"
  | "createYourAccount"
  | "fillAllFields"
  | "invalidEmail"
  | "passwordTooShort"
  | "passwordsDoNotMatch"
  | "loginFailed"
  | "registrationSuccessful"
  | "registrationFailed"
  | "signingIn"
  | "creatingAccount"
  | "enterEmail"
  | "enterPassword"
  | "confirmYourPassword"
  | "enterFirstName"
  | "enterLastName"
  | "error"
  | "success"
  | "ok"
  | "accountPendingApproval"
  | "accountBlocked";

export const LANGUAGES: Language[] = [
  {
    code: "ar-DZ",
    name: "Arabic (Algeria)",
    nativeName: "العربية (الجزائر)",
    flag: "🇩🇿",
    rtl: true,
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    rtl: false,
  },
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇺🇸",
    rtl: false,
  },
];

export const TRANSLATIONS = {
  "ar-DZ": {
    // App
    prosafe: "بروسيف",
    safetyManagementSystem: "نظام إدارة السلامة",

    // Authentication
    signIn: "تسجيل الدخول",
    signUp: "إنشاء حساب",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    firstName: "الاسم الأول",
    lastName: "اسم العائلة",
    createAccount: "إنشاء حساب",
    newToProsafe: "جديد على بروسيف؟",
    alreadyHaveAccount: "لديك حساب بالفعل؟",
    createYourAccount: "إنشاء حسابك",

    // Form validation
    fillAllFields: "يرجى ملء جميع الحقول",
    invalidEmail: "يرجى إدخال عنوان بريد إلكتروني صحيح",
    passwordTooShort: "يجب أن تكون كلمة المرور 6 أحرف على الأقل",
    passwordsDoNotMatch: "كلمات المرور غير متطابقة",

    // Messages
    loginFailed: "فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.",
    registrationSuccessful: "تم التسجيل بنجاح! يرجى تسجيل الدخول.",
    registrationFailed: "فشل التسجيل. يرجى المحاولة مرة أخرى.",
    signingIn: "جاري تسجيل الدخول...",
    creatingAccount: "جاري إنشاء الحساب...",

    // Placeholders
    enterEmail: "أدخل بريدك الإلكتروني",
    enterPassword: "أدخل كلمة المرور",
    confirmYourPassword: "أكد كلمة المرور",
    enterFirstName: "أدخل اسمك الأول",
    enterLastName: "أدخل اسم العائلة",

    // Common
    error: "خطأ",
    success: "نجح",
    ok: "موافق",
    accountPendingApproval: "حسابك في انتظار الموافقة",
    accountBlocked: "تم حظر حسابك. يرجى الاتصال بالمسؤول",
  },

  fr: {
    // App
    prosafe: "Prosafe",
    safetyManagementSystem: "Système de Gestion de la Sécurité",

    // Authentication
    signIn: "Se connecter",
    signUp: "S'inscrire",
    email: "Email",
    password: "Mot de passe",
    confirmPassword: "Confirmer le mot de passe",
    firstName: "Prénom",
    lastName: "Nom de famille",
    createAccount: "Créer un compte",
    newToProsafe: "Nouveau sur Prosafe?",
    alreadyHaveAccount: "Vous avez déjà un compte?",
    createYourAccount: "Créez votre compte",

    // Form validation
    fillAllFields: "Veuillez remplir tous les champs",
    invalidEmail: "Veuillez entrer une adresse email valide",
    passwordTooShort: "Le mot de passe doit contenir au moins 6 caractères",
    passwordsDoNotMatch: "Les mots de passe ne correspondent pas",

    // Messages
    loginFailed: "Échec de la connexion. Veuillez réessayer.",
    registrationSuccessful: "Inscription réussie! Veuillez vous connecter.",
    registrationFailed: "Échec de l'inscription. Veuillez réessayer.",
    signingIn: "Connexion en cours...",
    creatingAccount: "Création du compte...",

    // Placeholders
    enterEmail: "Entrez votre email",
    enterPassword: "Entrez votre mot de passe",
    confirmYourPassword: "Confirmez votre mot de passe",
    enterFirstName: "Entrez votre prénom",
    enterLastName: "Entrez votre nom de famille",

    // Common
    error: "Erreur",
    success: "Succès",
    ok: "OK",
    accountPendingApproval: "Votre compte est en attente d'approbation",
    accountBlocked:
      "Votre compte a été bloqué. Veuillez contacter l'administrateur",
  },

  en: {
    // App
    prosafe: "Prosafe",
    safetyManagementSystem: "Safety Management System",

    // Authentication
    signIn: "Sign In",
    signUp: "Sign Up",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    firstName: "First Name",
    lastName: "Last Name",
    createAccount: "Create Account",
    newToProsafe: "New to Prosafe?",
    alreadyHaveAccount: "Already have an account?",
    createYourAccount: "Create Your Account",

    // Form validation
    fillAllFields: "Please fill in all fields",
    invalidEmail: "Please enter a valid email address",
    passwordTooShort: "Password must be at least 6 characters",
    passwordsDoNotMatch: "Passwords do not match",

    // Messages
    loginFailed: "Login failed. Please try again.",
    registrationSuccessful: "Registration successful! Please sign in.",
    registrationFailed: "Registration failed. Please try again.",
    signingIn: "Signing in...",
    creatingAccount: "Creating account...",

    // Placeholders
    enterEmail: "Enter your email",
    enterPassword: "Enter your password",
    confirmYourPassword: "Confirm your password",
    enterFirstName: "Enter your first name",
    enterLastName: "Enter your last name",

    // Common
    error: "Error",
    success: "Success",
    ok: "OK",
    accountPendingApproval: "Your account is waiting approval",
    accountBlocked:
      "Your account has been blocked. Please contact administrator",
  },
};
