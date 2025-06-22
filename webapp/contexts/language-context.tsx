"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type Language = "en" | "es"

interface LanguageContextType {
  language: Language
  toggleLanguage: () => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Translation objects
const translations = {
  en: {
    // Header
    "header.title": "Immigration Rights Assistant",
    "header.title.short": "Immigration Assistant",
    "header.faq": "FAQ",
    "header.map": "Map",
    "header.ragEnabled": "RAG Enabled",
    "header.fallbackMode": "Fallback Mode",
    "header.ready": "Ready",
    "header.poweredBy": "Gemini 2.0",

    // Welcome Screen
    "welcome.title": "Know Your Immigration Rights",
    "welcome.subtitle": "Get reliable information about your rights when encountering immigration authorities.",
    "welcome.multimodal": "Now with multimodal image support",
    "welcome.knowledgeBase": "Enhanced with specialized immigration knowledge base",
    "welcome.callAssistant": "Call live assistant at (510) 906-2617",
    "welcome.disclaimer": "This provides general information only. Consult an immigration attorney for legal advice.",

    // Quick Prompts
    "prompts.iceRights": "What are my rights during an ICE encounter?",
    "prompts.documents": "Do I have to show my documents?",
    "prompts.homeVisit": "What if ICE comes to my home?",
    "prompts.remainSilent": "Can I remain silent?",
    "prompts.findLawyer": "How do I find a lawyer?",

    // Input Area
    "input.placeholder.mobile": "Ask about your rights...",
    "input.placeholder.desktop": "Ask about your immigration rights or upload an image...",
    "input.upload": "Upload",
    "input.shareDocuments": "Share Documents",
    "input.send": "Send",
    "input.photographDocuments": "Photograph Documents",
    "input.explain": "Explain",
    "input.translate": "Translate",

    // Chat
    "chat.searching": "Searching knowledge base...",
    "chat.thinking": "Thinking...",
    "chat.contactLawyer": "Information not verified - Contact a lawyer",

    // Panic Mode
    "panic.setup": "Set Up Panic Mode",
    "panic.panicMode": "Panic Mode",
    "panic.sending": "Sending...",
    "panic.stopRecording": "Stop Recording",
    "panic.recording": "Recording",
    "panic.setupTitle": "Set Up Panic Mode",
    "panic.emailLabel": "Emergency Contact Email",
    "panic.emailPlaceholder": "lawyer@example.com",
    "panic.emailDescription": "This email will receive emergency recordings when panic mode is activated.",
    "panic.cancel": "Cancel",
    "panic.save": "Save",

    // FAQ Page
    "faq.title": "Immigration Rights FAQ",
    "faq.backToChat": "Back to Chat",
    "faq.back": "Back",
    "faq.mainTitle": "Frequently Asked Questions",
    "faq.subtitle":
      "Common questions about immigration rights and ICE encounters. This information is for educational purposes only and does not constitute legal advice.",
    "faq.disclaimer.title": "Important Disclaimer",
    "faq.disclaimer.content":
      "This information is provided for educational purposes only and does not constitute legal advice. Immigration law is complex and constantly changing. For specific legal advice about your situation, please consult with a qualified immigration attorney.",
    "faq.emergency.title": "Emergency Resources",
    "faq.emergency.nilc": "National Immigration Law Center:",
    "faq.emergency.aclu": "ACLU Immigrants' Rights Project:",
    "faq.emergency.uwd": "United We Dream Hotline:",

    // FAQ Questions and Answers
    "faq.q1.question": "What are my basic rights during an ICE encounter?",
    "faq.q1.answer":
      "You have the right to remain silent, the right to an attorney, and the right to refuse to sign any documents. These rights apply regardless of your immigration status.",
    "faq.q2.question": "Do I have to open the door if ICE comes to my home?",
    "faq.q2.answer":
      "No, you do not have to open the door unless ICE has a valid warrant signed by a judge. You can ask to see the warrant through the door or window before opening.",
    "faq.q3.question": "What documents do I need to show ICE?",
    "faq.q3.answer":
      "You are not required to show documents to ICE unless they have a warrant. However, if you choose to show documents, only show immigration documents, not other personal documents.",
    "faq.q4.question": "Can I record an ICE encounter?",
    "faq.q4.answer":
      "Yes, you generally have the right to record ICE encounters in public spaces. However, be aware that this may escalate the situation.",
    "faq.q5.question": "What should I do if ICE arrests me?",
    "faq.q5.answer":
      "Remain calm, exercise your right to remain silent, ask for an attorney immediately, and do not sign any documents without legal representation.",
    "faq.q6.question": "How can I find an immigration attorney?",
    "faq.q6.answer":
      "Contact local legal aid organizations, bar associations, or use online directories. Many organizations offer free or low-cost consultations.",
    "faq.q7.question": "What's the difference between ICE and local police?",
    "faq.q7.answer":
      "ICE is a federal immigration enforcement agency, while local police handle local law enforcement. Some local police departments have policies limiting cooperation with ICE.",
    "faq.q8.question": "Can ICE arrest me at work?",
    "faq.q8.answer":
      "Yes, ICE can conduct workplace raids. If this happens, you have the right to remain silent and ask for an attorney.",
    "faq.q9.question": "What if I'm a victim of a crime?",
    "faq.q9.answer":
      "Victims of certain crimes may be eligible for special visas (U-visa, T-visa) that provide protection from deportation. Contact an immigration attorney immediately.",
    "faq.q10.question": "Are there safe places where ICE cannot arrest me?",
    "faq.q10.answer":
      "ICE has policies limiting enforcement at sensitive locations like schools, hospitals, and churches, but these are policies, not laws, and can change.",

    // Map Page
    "map.title": "ICE Activity Map",
    "map.subtitle": "Track reported ICE enforcement activities in your area",
    "map.backToChat": "Back to Chat",
    "map.loading": "Loading map...",
    "map.error": "Error loading map. Please try again.",
    "map.searchPlaceholder": "Search for a location...",
    "map.activityNearMe": "Activity Near Me",
    "map.addReport": "Add A Report",
    "map.showingReports": "Showing {count} reports",
    "map.loadingReports": "Loading...",
    "map.activityMapTitle": "Activity Map",
    "map.poweredBy": "Powered by data scraped from People over Papers Anonymous",
    "map.reportModal.title": "Report ICE Activity",
    "map.reportModal.cityLabel": "City/Location *",
    "map.reportModal.cityPlaceholder": "Search for a city...",
    "map.reportModal.useCurrentLocation": "Use Current Location",
    "map.reportModal.gettingLocation": "Getting Location...",
    "map.reportModal.descriptionLabel": "Description (Optional)",
    "map.reportModal.descriptionPlaceholder": "Describe what you observed...",
    "map.reportModal.cancel": "Cancel",
    "map.reportModal.submit": "Submit Report",
    "map.reportModal.submitting": "Submitting...",
    "map.reportModal.success": "Report submitted successfully",
    "map.reportModal.error": "Failed to submit report",
    "map.reportModal.fillRequired": "Please select a city",
    "map.reportModal.geolocationNotSupported": "Geolocation not supported",
    "map.reportModal.locationError": "Unable to get location",
    "map.popup.verified": "Verified",
    "map.popup.scraped": "Scraped",
    "map.popup.reported": "Reported",
    "map.search.locationNotFound": "Location not found",
    "map.search.searchFailed": "Search failed",
    "map.geolocation.notSupported": "Geolocation is not supported by your browser",
    "map.geolocation.error": "Unable to retrieve your location",
    "map.checkActivityNearMe": "Check Activity Near Me",
    "map.proximityAlert.title": "⚠️ ICE Activity Detected Nearby",
    "map.proximityAlert.message":
      "Found {count} ICE activity report{plural} within 10 miles of your location. Please stay safe and be aware of your rights.",
    "map.proximityAlert.button": "Get Rights Information",

    // Errors
    "error.fileSize": "File {fileName} is too large ({size}MB). Please use a smaller image.",
    "error.processing": "Error processing your request: {error}",
    "error.camera": "Could not access camera/microphone. Please check permissions.",
    "error.imageOnly": "Only image files are supported at this time.",
    "error.videoSend": "Failed to send emergency video. Please try again or contact your lawyer directly.",
    "success.videoSent": "Emergency video sent successfully to your lawyer!",

    // Image Action Prompts
    "prompts.explainDocument": "Please explain this document and what it means for me.",
    "prompts.translateDocument": "Translate this document to Spanish.",
  },
  es: {
    // Header - SHORTENED
    "header.title": "Asistente Legal",
    "header.title.short": "Asistente",
    "header.faq": "FAQ",
    "header.map": "Mapa",
    "header.ragEnabled": "RAG Activo",
    "header.fallbackMode": "Modo Básico",
    "header.ready": "Listo",
    "header.poweredBy": "Gemini 2.0",

    // Welcome Screen - SHORTENED
    "welcome.title": "Conoce Tus Derechos",
    "welcome.subtitle": "Información confiable sobre tus derechos con autoridades de inmigración.",
    "welcome.multimodal": "Con soporte de imágenes",
    "welcome.knowledgeBase": "Base de conocimientos especializada",
    "welcome.callAssistant": "Llamar al (510) 906-2617",
    "welcome.disclaimer": "Solo información general. Consulta un abogado para asesoramiento legal.",

    // Quick Prompts
    "prompts.iceRights": "¿Cuáles son mis derechos con ICE?",
    "prompts.documents": "¿Debo mostrar mis documentos?",
    "prompts.homeVisit": "¿Qué si ICE viene a mi casa?",
    "prompts.remainSilent": "¿Puedo quedarme callado?",
    "prompts.findLawyer": "¿Cómo encuentro un abogado?",

    // Input Area
    "input.placeholder.mobile": "Pregunta sobre tus derechos...",
    "input.placeholder.desktop": "Pregunta sobre inmigración o sube una imagen...",
    "input.upload": "Subir",
    "input.shareDocuments": "Documentos",
    "input.send": "Enviar",
    "input.photographDocuments": "Fotografiar Documentos",
    "input.explain": "Explicar",
    "input.translate": "Traducir",

    // Chat
    "chat.searching": "Buscando información...",
    "chat.thinking": "Pensando...",
    "chat.contactLawyer": "Info no verificada - Contacta abogado",

    // Image Action Prompts
    "prompts.explainDocument": "Por favor explica este documento y qué significa para mí.",
    "prompts.translateDocument": "Traduce este documento al español.",

    // FAQ Page
    "faq.title": "FAQ Derechos de Inmigración",
    "faq.backToChat": "Volver al Chat",
    "faq.back": "Volver",
    "faq.mainTitle": "Preguntas Frecuentes",
    "faq.subtitle":
      "Preguntas comunes sobre derechos de inmigración y encuentros con ICE. Esta información es solo para fines educativos y no constituye asesoramiento legal.",
    "faq.disclaimer.title": "Descargo de Responsabilidad Importante",
    "faq.disclaimer.content":
      "Esta información se proporciona solo para fines educativos y no constituye asesoramiento legal. La ley de inmigración es compleja y cambia constantemente. Para asesoramiento legal específico sobre su situación, consulte con un abogado de inmigración calificado.",
    "faq.emergency.title": "Recursos de Emergencia",
    "faq.emergency.nilc": "Centro Nacional de Derecho de Inmigración:",
    "faq.emergency.aclu": "Proyecto de Derechos de Inmigrantes ACLU:",
    "faq.emergency.uwd": "Línea Directa United We Dream:",

    // FAQ Questions and Answers
    "faq.q1.question": "¿Cuáles son mis derechos básicos durante un encuentro con ICE?",
    "faq.q1.answer":
      "Tienes derecho a permanecer en silencio, derecho a un abogado y derecho a negarte a firmar cualquier documento. Estos derechos aplican independientemente de tu estatus migratorio.",
    "faq.q2.question": "¿Tengo que abrir la puerta si ICE viene a mi casa?",
    "faq.q2.answer":
      "No, no tienes que abrir la puerta a menos que ICE tenga una orden válida firmada por un juez. Puedes pedir ver la orden a través de la puerta o ventana antes de abrir.",
    "faq.q3.question": "¿Qué documentos necesito mostrar a ICE?",
    "faq.q3.answer":
      "No estás obligado a mostrar documentos a ICE a menos que tengan una orden. Sin embargo, si eliges mostrar documentos, solo muestra documentos de inmigración, no otros documentos personales.",
    "faq.q4.question": "¿Puedo grabar un encuentro con ICE?",
    "faq.q4.answer":
      "Sí, generalmente tienes derecho a grabar encuentros con ICE en espacios públicos. Sin embargo, ten en cuenta que esto puede escalar la situación.",
    "faq.q5.question": "¿Qué debo hacer si ICE me arresta?",
    "faq.q5.answer":
      "Mantén la calma, ejerce tu derecho a permanecer en silencio, pide un abogado inmediatamente y no firmes ningún documento sin representación legal.",
    "faq.q6.question": "¿Cómo puedo encontrar un abogado de inmigración?",
    "faq.q6.answer":
      "Contacta organizaciones locales de asistencia legal, colegios de abogados o usa directorios en línea. Muchas organizaciones ofrecen consultas gratuitas o de bajo costo.",
    "faq.q7.question": "¿Cuál es la diferencia entre ICE y la policía local?",
    "faq.q7.answer":
      "ICE es una agencia federal de aplicación de inmigración, mientras que la policía local maneja la aplicación de la ley local. Algunos departamentos de policía local tienen políticas que limitan la cooperación con ICE.",
    "faq.q8.question": "¿Puede ICE arrestarme en el trabajo?",
    "faq.q8.answer":
      "Sí, ICE puede realizar redadas en lugares de trabajo. Si esto sucede, tienes derecho a permanecer en silencio y pedir un abogado.",
    "faq.q9.question": "¿Qué pasa si soy víctima de un crimen?",
    "faq.q9.answer":
      "Las víctimas de ciertos crímenes pueden ser elegibles para visas especiales (visa U, visa T) que brindan protección contra la deportación. Contacta a un abogado de inmigración inmediatamente.",
    "faq.q10.question": "¿Hay lugares seguros donde ICE no puede arrestarme?",
    "faq.q10.answer":
      "ICE tiene políticas que limitan la aplicación en ubicaciones sensibles como escuelas, hospitales e iglesias, pero estas son políticas, no leyes, y pueden cambiar.",

    // Map Page
    "map.title": "Mapa de Actividad ICE",
    "map.subtitle": "Rastrea actividades de ICE reportadas en tu área",
    "map.backToChat": "Volver al Chat",
    "map.loading": "Cargando mapa...",
    "map.error": "Error cargando mapa. Por favor intenta de nuevo.",
    "map.searchPlaceholder": "Buscar ubicación...",
    "map.activityNearMe": "Actividad Cerca de Mí",
    "map.addReport": "Agregar Reporte",
    "map.showingReports": "Mostrando {count} reportes",
    "map.loadingReports": "Cargando...",
    "map.activityMapTitle": "Mapa de Actividad",
    "map.poweredBy": "Impulsado por datos extraídos de People over Papers Anonymous",
    "map.reportModal.title": "Reportar Actividad ICE",
    "map.reportModal.cityLabel": "Ciudad/Ubicación *",
    "map.reportModal.cityPlaceholder": "Buscar una ciudad...",
    "map.reportModal.useCurrentLocation": "Usar Ubicación Actual",
    "map.reportModal.gettingLocation": "Obteniendo Ubicación...",
    "map.reportModal.descriptionLabel": "Descripción (Opcional)",
    "map.reportModal.descriptionPlaceholder": "Describe lo que observaste...",
    "map.reportModal.cancel": "Cancelar",
    "map.reportModal.submit": "Enviar Reporte",
    "map.reportModal.submitting": "Enviando...",
    "map.reportModal.success": "Reporte enviado exitosamente",
    "map.reportModal.error": "Error al enviar reporte",
    "map.reportModal.fillRequired": "Por favor selecciona una ciudad",
    "map.reportModal.geolocationNotSupported": "Geolocalización no soportada",
    "map.reportModal.locationError": "No se pudo obtener ubicación",
    "map.popup.verified": "Verificado",
    "map.popup.scraped": "Extraído",
    "map.popup.reported": "Reportado",
    "map.search.locationNotFound": "Ubicación no encontrada",
    "map.search.searchFailed": "Búsqueda falló",
    "map.geolocation.notSupported": "Geolocalización no es soportada por tu navegador",
    "map.geolocation.error": "No se pudo obtener tu ubicación",
    "map.checkActivityNearMe": "Verificar Actividad Cerca",
    "map.proximityAlert.title": "⚠️ Actividad ICE Detectada Cerca",
    "map.proximityAlert.message":
      "Se encontraron {count} reporte{plural} de actividad ICE dentro de 10 millas de tu ubicación. Por favor mantente seguro y conoce tus derechos.",
    "map.proximityAlert.button": "Obtener Información de Derechos",

    // Panic Mode
    "panic.setup": "Configurar Modo Pánico",
    "panic.panicMode": "Modo Pánico",
    "panic.sending": "Enviando...",
    "panic.stopRecording": "Detener Grabación",
    "panic.recording": "Grabando",
    "panic.setupTitle": "Configurar Modo Pánico",
    "panic.emailLabel": "Email de Contacto de Emergencia",
    "panic.emailPlaceholder": "abogado@ejemplo.com",
    "panic.emailDescription": "Este email recibirá grabaciones de emergencia cuando se active el modo pánico.",
    "panic.cancel": "Cancelar",
    "panic.save": "Guardar",

    // Errors
    "error.fileSize": "El archivo {fileName} es demasiado grande ({size}MB). Por favor usa una imagen más pequeña.",
    "error.processing": "Error procesando tu solicitud: {error}",
    "error.camera": "No se pudo acceder a la cámara/micrófono. Por favor verifica los permisos.",
    "error.imageOnly": "Solo se admiten archivos de imagen en este momento.",
    "error.videoSend":
      "Error al enviar video de emergencia. Por favor intenta de nuevo o contacta a tu abogado directamente.",
    "success.videoSent": "¡Video de emergencia enviado exitosamente a tu abogado!",
  },
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("immigration-app-language") as Language
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "es")) {
      setLanguage(savedLanguage)
    }
  }, [])

  // Save language to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("immigration-app-language", language)
  }, [language])

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "es" : "en"))
  }

  const t = (key: string, params?: Record<string, string>) => {
    let translation = translations[language][key] || translations["en"][key] || key

    // Replace parameters if provided
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{${param}}`, value)
      })
    }

    return translation
  }

  return <LanguageContext.Provider value={{ language, toggleLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
