"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Upload, FileText, Languages } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface TranslationState {
  originalText: string
  translatedText: string
  sourceLanguage: string
  targetLanguage: string
}

export default function PDFTranslator() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [translation, setTranslation] = useState<TranslationState | null>(null)
  const [targetLanguage, setTargetLanguage] = useState("es")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const languages = [
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "pt", name: "Portuguese" },
    { code: "ru", name: "Russian" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "zh", name: "Chinese" },
    { code: "ar", name: "Arabic" },
  ]

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile)
      setTranslation(null)
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF file.",
        variant: "destructive",
      })
    }
  }

  const translatePDF = async (
    file: File,
    targetLang: string,
  ): Promise<{ originalText: string; translatedText: string }> => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("target_language", targetLang)

    const response = await fetch("http://localhost:8000/api/translate-pdf", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Translation failed: ${response.statusText}`)
    }

    const data = await response.json()
    console.log(data)
    return {
      originalText: data.text,
      translatedText: data.translated_text,
    }
  }

  const handleTranslate = async () => {
    if (!file) return

    setIsProcessing(true)
    setProgress(0)

    try {
      setProgress(25)

      // Call the real API
      setProgress(50)
      const result = await translatePDF(file, targetLanguage)

      console.log(result)

      setProgress(100)
      setTranslation({
        originalText: result.originalText,
        translatedText: result.translatedText,
        sourceLanguage: "en",
        targetLanguage,
      })

      toast({
        title: "Translation completed",
        description: "Your PDF has been successfully translated.",
      })
    } catch (error) {
      console.error("Translation error:", error)
      toast({
        title: "Translation failed",
        description: error instanceof Error ? error.message : "An error occurred during translation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setProgress(0)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Chat
            </Button>
          </Link>
        </div>
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">PDF Translator</h1>
          <p className="text-gray-600">Upload a PDF, translate it, and listen to the translation</p>
        </div>

        {/* File Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload PDF
            </CardTitle>
            <CardDescription>Select a PDF file to extract text and translate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-700">{file ? file.name : "Click to select a PDF file"}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "PDF files only"}
                </p>
              </div>
              <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" />

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Language</label>
                  <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleTranslate} disabled={!file || isProcessing} className="mt-6">
                  <Languages className="h-4 w-4 mr-2" />
                  {isProcessing ? "Translating..." : "Translate"}
                </Button>
              </div>

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Processing...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Translation Results */}
        {translation && (
          <div className="space-y-6">
            {/* Translated Text - More Prominent */}
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Languages className="h-6 w-6" />
                  Translated Text
                </CardTitle>
                <CardDescription className="text-blue-100 text-base">
                  {languages.find((lang) => lang.code === targetLanguage)?.name} Translation
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <Textarea
                  value={translation.translatedText}
                  readOnly
                  className="min-h-[400px] resize-none text-lg leading-relaxed border-2 border-blue-200 focus:border-blue-400 bg-white shadow-inner"
                />
              </CardContent>
            </Card>

            {/* Original Text - Smaller */}
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg text-gray-700">Original Text</CardTitle>
                <CardDescription>Extracted from PDF</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={translation.originalText}
                  readOnly
                  className="min-h-[250px] resize-none text-sm bg-gray-50 border-gray-200"
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
