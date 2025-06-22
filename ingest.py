import os

import pinecone
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain.embeddings.openai import OpenAIEmbeddings
from pinecone import Pinecone
from dotenv import load_dotenv
from langchain.document_loaders import UnstructuredPDFLoader

load_dotenv()

import re

def clean_text(text: str) -> str:
    # 1) Collapse any run of whitespace (including \n, \t, multiple spaces) into one space
    cleaned = re.sub(r'\s+', ' ', text)
    # 2) Trim leading/trailing
    return cleaned.strip()

def main(
    pdf_path: str,
    pinecone_index: str,
    source_name: str,
    source_link: str,
    pinecone_namespace: str = None,
    chunk_size: int = 1000,
    chunk_overlap: int = 10,
):
    openai_api_key = os.getenv("OPENAI_API_KEY")
    pinecone_api_key = os.getenv("PINECONE_API_KEY")
    pinecone_index = os.getenv("PINECONE_INDEX")

    pinecone = Pinecone(api_key=pinecone_api_key)
    index = pinecone.Index(pinecone_index)

    loader = PyPDFLoader(pdf_path)
    #loader = UnstructuredPDFLoader(pdf_path)

    pages = loader.load()

    splitter = CharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )
    docs = splitter.split_documents(pages)

    embedder = OpenAIEmbeddings(
        model="text-embedding-ada-002",
        openai_api_key=openai_api_key,
    )

    texts = [clean_text(doc.page_content) for doc in docs]
    embeddings = embedder.embed_documents(texts)

    vectors = []
    for i, (emb, doc) in enumerate(zip(embeddings, docs)):
        # merge existing metadata with text and source_name
        md = doc.metadata.copy()
        md.update({
            "text": clean_text(doc.page_content),
            "source_name": source_name,
            "source_link": source_link
        })
        vectors.append((
            f"{os.path.basename(pdf_path)}-{i}",  # unique ID per chunk
            emb,
            md
        ))
    
    index.upsert(vectors=vectors)

    print(f"✅ Uploaded {len(docs)} chunks to Pinecone index `{pinecone_index}`")

if __name__ == "__main__":
    # tweak these before running
    PDF_PATH = "act.pdf"
    PINECONE_INDEX = "cfr-title8"
    #PINECONE_NAMESPACE = None  # or e.g. "immigration-rights"

    main(PDF_PATH, PINECONE_INDEX, "Immigration and Nationality Act", "https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title8-section1101&num=0&edition=prelim")
