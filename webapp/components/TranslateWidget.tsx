"use client"

import { useEffect } from "react"

declare global {
  interface Window {
    google: {
      translate: {
        TranslateElement: new (
          options: Record<string, unknown>,
          elementId: string
        ) => void
      }
    }
    googleTranslateElementInit: () => void
  }
}

export default function TranslateWidget() {
  useEffect(() => {
    const addTranslateScript = () => {
      if (document.getElementById("google-translate-script")) return

      const script = document.createElement("script")
      script.id = "google-translate-script"
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
      script.async = true
      document.body.appendChild(script)

      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement(
          { pageLanguage: "en" },
          "google_translate_element"
        )
      }
    }

    addTranslateScript()
  }, [])

  return (
    <div className="fixed top-4 right-4 z-50 bg-white border border-gray-300 rounded shadow px-2 py-1 text-sm">
      <div id="google_translate_element" />
    </div>
  )
}
