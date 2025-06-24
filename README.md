# ImmiAI

# BerkHaxAI - Immigration Rights Assistant

A comprehensive web application that helps immigrants understand their legal rights when encountering immigration authorities. The platform combines AI-powered chat assistance, document translation, interactive maps showcasing ICE activity, and educational resources.

## 🌟 Features

### 🤖 AI-Powered Chat Assistant
- **RAG-Enhanced Responses**: Uses Pinecone vector database for accurate immigration law information
- **Fallback Knowledge Base**: Continues working even when external databases are unavailable
- **Source Attribution**: Shows which knowledge sources were used for each response
- **Voice Integration**: Optional Vapi voice widget for hands-free interaction

### 📄 Legal Document Translation
- **PDF Processing**: Upload and extract text from legal documents
- **AI Translation**: Powered by Google Gemini for accurate legal terminology translation
- **Multi-language Support**: Translate to Spanish, French, German, Italian, Portuguese, Russian, Japanese, Korean, Chinese, and Arabic
- **Format Preservation**: Maintains document structure and legal formatting

### 🗺️ Interactive ICE Raids Map
- **Real-time Data**: Track reported ICE enforcement activities
- **Location-based Information**: See raids by city and region
- **Detailed Reports**: View dates, types, and descriptions of enforcement actions
- **Interactive Interface**: Built with React Leaflet for smooth navigation

### 📚 Educational Resources
- **Comprehensive FAQ**: Common questions about immigration rights
- **Emergency Contacts**: Direct links to legal aid organizations
- **Quick Prompts**: Pre-written questions for common scenarios
- **Legal Disclaimers**: Clear guidance on when to seek professional legal help

## ��️ Architecture

### Frontend (Next.js)
- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context for global chat state
- **Maps**: React Leaflet for interactive mapping
- **Voice**: Vapi AI integration for voice interactions

### Backend Services

#### Chat API (Next.js API Routes)
- **AI Provider**: OpenAI GPT-4o
- **Vector Database**: Pinecone for RAG (Retrieval-Augmented Generation)
- **Streaming**: Real-time response streaming
- **Fallback System**: Static knowledge base when Pinecone is unavailable

#### Translation API (Next.js API Routes)
- **Platform**: Modal serverless deployment
- **AI Provider**: Google Gemini 1.5 Pro
- **PDF Processing**: pdfplumber for text extraction
- **CORS Support**: Cross-origin requests enabled

## �� Security & Privacy

- **No Data Storage**: Chat messages are not permanently stored
- **Secure API Keys**: Environment variables for sensitive data
- **CORS Protection**: Configured for cross-origin requests
- **Legal Disclaimers**: Clear guidance on information limitations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## ⚠️ Legal Disclaimer

This application provides general information about immigration rights for educational purposes only. The information provided does not constitute legal advice. Users should consult with qualified immigration attorneys for specific legal guidance about their individual situations.

## 🆘 Support

- **Emergency Legal Help**: Contact local immigration attorneys
- **Technical Issues**: Open an issue on GitHub
- **Feature Requests**: Submit via GitHub issues

## 🔗 Resources

- [National Immigration Law Center](https://www.nilc.org/)
- [ACLU Immigrants' Rights Project](https://www.aclu.org/issues/immigrants-rights)
- [United We Dream](https://unitedwedream.org/)
- [Immigration Advocates Network](https://www.immigrationadvocates.org/)

---

**Built with ❤️ for immigrant communities**
