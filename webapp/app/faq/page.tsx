"use client"

import { Shield, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"

export default function FAQPage() {
  const { t } = useLanguage()

  // FAQ data using translation keys
  const FAQ_DATA = [
    {
      question: t("faq.q1.question"),
      answer: t("faq.q1.answer"),
    },
    {
      question: t("faq.q2.question"),
      answer: t("faq.q2.answer"),
    },
    {
      question: t("faq.q3.question"),
      answer: t("faq.q3.answer"),
    },
    {
      question: t("faq.q4.question"),
      answer: t("faq.q4.answer"),
    },
    {
      question: t("faq.q5.question"),
      answer: t("faq.q5.answer"),
    },
    {
      question: t("faq.q6.question"),
      answer: t("faq.q6.answer"),
    },
    {
      question: t("faq.q7.question"),
      answer: t("faq.q7.answer"),
    },
    {
      question: t("faq.q8.question"),
      answer: t("faq.q8.answer"),
    },
    {
      question: t("faq.q9.question"),
      answer: t("faq.q9.answer"),
    },
    {
      question: t("faq.q10.question"),
      answer: t("faq.q10.answer"),
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-2 md:p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <Shield className="h-5 w-5 md:h-6 md:w-6 text-blue-600 flex-shrink-0" />
            <h1 className="text-base md:text-xl font-semibold text-gray-900 truncate">{t("faq.title")}</h1>
          </div>
          <Link href="/">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3"
            >
              <ArrowLeft className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">{t("faq.backToChat")}</span>
              <span className="sm:hidden">{t("faq.back")}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto p-3 md:p-6">
        <div className="mb-6 md:mb-8">
          <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-4">{t("faq.mainTitle")}</h2>
          <p className="text-gray-600 text-sm md:text-lg leading-relaxed">{t("faq.subtitle")}</p>
        </div>

        <div className="space-y-3 md:space-y-4">
          {FAQ_DATA.map((faq, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 md:pb-3">
                <CardTitle className="text-sm md:text-lg text-gray-900 leading-snug">{faq.question}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-700 leading-relaxed text-xs md:text-base">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-8 md:mt-12 p-4 md:p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-base md:text-lg font-semibold text-blue-900 mb-2">{t("faq.disclaimer.title")}</h3>
          <p className="text-blue-800 text-xs md:text-base leading-relaxed">{t("faq.disclaimer.content")}</p>
        </div>

        {/* Emergency Contacts */}
        <div className="mt-6 md:mt-8 p-4 md:p-6 bg-red-50 rounded-lg border border-red-200">
          <h3 className="text-base md:text-lg font-semibold text-red-900 mb-2">{t("faq.emergency.title")}</h3>
          <div className="space-y-1 md:space-y-2 text-red-800 text-xs md:text-base">
            <p>
              <strong>{t("faq.emergency.nilc")}</strong> (213) 639-3900
            </p>
            <p>
              <strong>{t("faq.emergency.aclu")}</strong> (212) 549-2500
            </p>
            <p>
              <strong>{t("faq.emergency.uwd")}</strong> (844) 363-1423
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
