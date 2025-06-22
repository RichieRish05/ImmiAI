"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { Globe } from "lucide-react"

interface LanguageToggleProps {
  className?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
}

export default function LanguageToggle({ className = "", variant = "outline", size = "sm" }: LanguageToggleProps) {
  const { language, toggleLanguage } = useLanguage()

  return (
    <Button onClick={toggleLanguage} variant={variant} size={size} className={`flex items-center gap-1 ${className}`}>
      <Globe className="h-3 w-3" />
      <span className="text-xs font-medium">{language === "en" ? "ES" : "EN"}</span>
    </Button>
  )
}
