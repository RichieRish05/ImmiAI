import os
import uuid
import pdfplumber
import shutil
import google.generativeai as genai
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import uvicorn
load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-pro")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/translate-pdf")
async def translate_pdf(
    file: UploadFile = File(...),
    target_language: str = Form(...)
):
    try:
        # Validate file type
        if file.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Only PDF files are supported.")

        # Save uploaded PDF temporarily
        filename = f"uploads/{uuid.uuid4()}.pdf"
        os.makedirs("uploads", exist_ok=True)
        with open(filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Extract text
        with pdfplumber.open(filename) as pdf:
            text = "\n".join(
                page.extract_text() or "" for page in pdf.pages
            ).strip()
 

        if not text:
            raise HTTPException(status_code=400, detail="No readable text found in the PDF.")

        # Translate using Gemini
        prompt = f"""Please translate the following legal text into {target_language}. 

IMPORTANT INSTRUCTIONS:
- Preserve all legal terminology and technical terms accurately
- Maintain the original formatting, structure, and document layout
- Keep all numbers, dates, names, and addresses exactly as they appear
- Preserve any legal citations, case numbers, or reference codes
- Maintain the formal tone appropriate for legal documents
- If any text appears to be in a different language, translate it to {target_language} as well
- If you encounter unclear or illegible text, indicate it with [UNREADABLE] and continue with the rest
- Preserve any headers, footers, or document metadata
- Keep all punctuation and capitalization consistent with legal document standards

FORMATTING REQUIREMENTS:
- Use clear paragraph breaks with double line spacing
- Preserve any section headers or titles
- Format lists with proper bullet points or numbering
- Maintain any table structures or tabular data
- Use proper indentation for subsections
- Add clear section separators where appropriate
- Format any legal citations or references consistently

TEXT TO TRANSLATE:
{text}

Please provide the complete translation in {target_language} with proper formatting and structure."""
        response = model.generate_content(prompt)
        translated_text = response.text.strip()

        # Cleanup
        os.remove(filename)

        return {
            "success": True,
            "translated_text": translated_text,
            "text": text
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
    finally:
        if os.path.exists(filename):
            os.remove(filename)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)