import { Shield, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

const FAQ_DATA = [
  {
    question: "What are my basic rights during an ICE encounter?",
    answer:
      "You have the right to remain silent, the right to an attorney, and the right to refuse to sign any documents. These rights apply regardless of your immigration status.",
  },
  {
    question: "Do I have to open the door if ICE comes to my home?",
    answer:
      "No, you do not have to open the door unless ICE has a valid warrant signed by a judge. You can ask to see the warrant through the door or window before opening.",
  },
  {
    question: "What documents do I need to show ICE?",
    answer:
      "You are not required to show documents to ICE unless they have a warrant. However, if you choose to show documents, only show immigration documents, not other personal documents.",
  },
  {
    question: "Can I record an ICE encounter?",
    answer:
      "Yes, you generally have the right to record ICE encounters in public spaces. However, be aware that this may escalate the situation.",
  },
  {
    question: "What should I do if ICE arrests me?",
    answer:
      "Remain calm, exercise your right to remain silent, ask for an attorney immediately, and do not sign any documents without legal representation.",
  },
  {
    question: "How can I find an immigration attorney?",
    answer:
      "Contact local legal aid organizations, bar associations, or use online directories. Many organizations offer free or low-cost consultations.",
  },
  {
    question: "What's the difference between ICE and local police?",
    answer:
      "ICE is a federal immigration enforcement agency, while local police handle local law enforcement. Some local police departments have policies limiting cooperation with ICE.",
  },
  {
    question: "Can ICE arrest me at work?",
    answer:
      "Yes, ICE can conduct workplace raids. If this happens, you have the right to remain silent and ask for an attorney.",
  },
  {
    question: "What if I'm a victim of a crime?",
    answer:
      "Victims of certain crimes may be eligible for special visas (U-visa, T-visa) that provide protection from deportation. Contact an immigration attorney immediately.",
  },
  {
    question: "Are there safe places where ICE cannot arrest me?",
    answer:
      "ICE has policies limiting enforcement at sensitive locations like schools, hospitals, and churches, but these are policies, not laws, and can change.",
  },
]

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">Immigration Rights FAQ</h1>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Chat
            </Button>
          </Link>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <p className="text-gray-600 text-lg">
            Common questions about immigration rights and ICE encounters. This information is for educational purposes
            only and does not constitute legal advice.
          </p>
        </div>

        <div className="space-y-4">
          {FAQ_DATA.map((faq, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">{faq.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Important Disclaimer</h3>
          <p className="text-blue-800">
            This information is provided for educational purposes only and does not constitute legal advice. Immigration
            law is complex and constantly changing. For specific legal advice about your situation, please consult with
            a qualified immigration attorney.
          </p>
        </div>

        {/* Emergency Contacts */}
        <div className="mt-8 p-6 bg-red-50 rounded-lg border border-red-200">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Emergency Resources</h3>
          <div className="space-y-2 text-red-800">
            <p>
              <strong>National Immigration Law Center:</strong> (213) 639-3900
            </p>
            <p>
              <strong>ACLU Immigrants' Rights Project:</strong> (212) 549-2500
            </p>
            <p>
              <strong>United We Dream Hotline:</strong> (844) 363-1423
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
