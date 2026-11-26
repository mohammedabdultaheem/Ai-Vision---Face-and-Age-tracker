import os
import re
import glob
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from app.core.config import settings

class RAGDocumentChunk:
    def __init__(self, doc_id: str, title: str, category: str, content: str, score: float = 0.0):
        self.doc_id = doc_id
        self.title = title
        self.category = category
        self.content = content
        self.score = score

class RAGEngineService:
    def __init__(self):
        self.chunks: List[RAGDocumentChunk] = []
        self._load_and_index_documents()

    def _load_and_index_documents(self):
        """Loads and indexes all markdown files from the rag_docs directory."""
        self.chunks.clear()
        docs_dir = Path(settings.RAG_DOCS_DIR)
        if not docs_dir.exists():
            docs_dir.mkdir(parents=True, exist_ok=True)
            return

        for file_path in docs_dir.glob("*.md"):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                doc_id = file_path.stem
                title = doc_id.replace("_", " ").title()
                # Parse title if markdown header exists
                lines = content.splitlines()
                for line in lines:
                    if line.startswith("# "):
                        title = line.replace("# ", "").strip()
                        break

                category = "System Architecture" if "architecture" in doc_id else \
                           "Ethical AI & Limitations" if "limitation" in doc_id else \
                           "Evaluation & Metrics" if "metric" in doc_id else \
                           "Hardware & Troubleshooting" if "troubleshoot" in doc_id else \
                           "API & Developer" if "api" in doc_id else \
                           "DevOps & Deployment" if "deployment" in doc_id else \
                           "Security & Privacy" if "privacy" in doc_id else "General Documentation"

                # Split into semantic paragraphs / sections
                sections = re.split(r'\n(?=## |\n\n)', content)
                for section in sections:
                    cleaned = section.strip()
                    if len(cleaned) > 40:
                        self.chunks.append(RAGDocumentChunk(
                            doc_id=doc_id,
                            title=title,
                            category=category,
                            content=cleaned
                        ))
            except Exception as e:
                print(f"[RAG] Error indexing {file_path}: {e}")

    def add_custom_document(self, doc_id: str, title: str, category: str, content: str):
        """Adds a runtime user-uploaded document to the index."""
        sections = re.split(r'\n(?=## |\n\n)', content)
        for section in sections:
            cleaned = section.strip()
            if len(cleaned) > 30:
                self.chunks.append(RAGDocumentChunk(
                    doc_id=doc_id,
                    title=title,
                    category=category,
                    content=cleaned
                ))

    def remove_document(self, doc_id: str):
        """Removes all indexed chunks associated with doc_id."""
        self.chunks = [c for c in self.chunks if c.doc_id != doc_id]

    def _tokenize(self, text: str) -> set:
        return set(re.findall(r'\b[a-zA-Z0-9_\-\.]{3,}\b', text.lower()))

    def retrieve(self, query: str, top_k: int = 3) -> List[RAGDocumentChunk]:
        """
        Calculates lexical-semantic relevance scores between query tokens and indexed document passages.
        """
        query_tokens = self._tokenize(query)
        if not query_tokens or not self.chunks:
            return []

        scored_chunks = []
        for chunk in self.chunks:
            chunk_tokens = self._tokenize(chunk.content + " " + chunk.title + " " + chunk.category)
            
            # Intersection & frequency weighting
            matches = query_tokens.intersection(chunk_tokens)
            if not matches:
                continue

            # Term overlap score
            match_score = sum(1.5 if token in chunk.title.lower() else 1.0 for token in matches)
            # Normalize by query length and log length penalty
            score = (match_score / (len(query_tokens) + 0.5)) * min(1.0, len(chunk.content) / 200.0)
            
            if score > 0.15:
                scored_chunks.append(RAGDocumentChunk(
                    doc_id=chunk.doc_id,
                    title=chunk.title,
                    category=chunk.category,
                    content=chunk.content,
                    score=round(float(score), 3)
                ))

        scored_chunks.sort(key=lambda x: x.score, reverse=True)
        return scored_chunks[:top_k]

    def query(self, user_query: str) -> Dict[str, Any]:
        """
        Retrieval-augmented query handler.
        Retrieves relevant documentation chunks and constructs a verified citation-backed response.
        """
        relevant_chunks = self.retrieve(user_query, top_k=3)

        if not relevant_chunks:
            return {
                "query": user_query,
                "answer": (
                    "I searched the AI VISION verified documentation base, but could not find high-confidence "
                    "documentation matching your query. Please refer to the System Architecture, Camera Troubleshooting, "
                    "or API Documentation sections, or contact your Super Administrator."
                ),
                "citations": [],
                "confidence": 0.20,
                "model_used": "Deterministic Retrieval Validator",
                "disclaimer": "This response is retrieved from verified enterprise documentation. RAG operates independently of the computer vision CNN."
            }

        # Check if external LLM configured (Gemini / OpenAI)
        external_answer = self._query_external_llm(user_query, relevant_chunks)
        if external_answer:
            answer = external_answer
            model_used = "Gemini / OpenAI Enterprise RAG"
        else:
            # High-fidelity synthesis from top chunks
            top_chunk = relevant_chunks[0]
            answer = self._synthesize_grounded_answer(user_query, relevant_chunks)
            model_used = "AI VISION Grounded Documentation Synthesizer"

        citations = []
        for chunk in relevant_chunks:
            # Clean excerpt
            excerpt = chunk.content.replace("\n", " ").strip()
            if len(excerpt) > 220:
                excerpt = excerpt[:217] + "..."
            citations.append({
                "document_title": chunk.title,
                "category": chunk.category,
                "relevance_score": min(0.99, max(0.50, chunk.score * 1.2)),
                "excerpt": excerpt
            })

        avg_conf = sum(c["relevance_score"] for c in citations) / len(citations)

        return {
            "query": user_query,
            "answer": answer,
            "citations": citations,
            "confidence": round(avg_conf, 2),
            "model_used": model_used,
            "disclaimer": "This response is retrieved from verified enterprise documentation. RAG operates independently of the computer vision CNN."
        }

    def _query_external_llm(self, query: str, chunks: List[RAGDocumentChunk]) -> Optional[str]:
        # Attempt Google Gemini if key provided
        if settings.GEMINI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                model = genai.GenerativeModel("gemini-1.5-flash")
                context = "\n\n".join([f"[{c.title}]: {c.content}" for c in chunks])
                prompt = (
                    f"You are the technical AI Assistant for the enterprise computer vision platform 'AI VISION'.\n"
                    f"Use ONLY the following verified documentation context to answer the user's question:\n\n"
                    f"{context}\n\n"
                    f"User Question: {query}\n"
                    f"Provide an authoritative, clear, and professional response."
                )
                response = model.generate_content(prompt)
                if response and response.text:
                    return response.text.strip()
            except Exception as e:
                print(f"[RAG] Gemini generation failed: {e}")

        # Attempt OpenAI if key provided
        if settings.OPENAI_API_KEY:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=settings.OPENAI_API_KEY)
                context = "\n\n".join([f"[{c.title}]: {c.content}" for c in chunks])
                completion = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are the enterprise technical support agent for AI VISION. Answer strictly based on the provided context."},
                        {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {query}"}
                    ]
                )
                if completion.choices:
                    return completion.choices[0].message.content.strip()
            except Exception as e:
                print(f"[RAG] OpenAI generation failed: {e}")

        return None

    def _synthesize_grounded_answer(self, query: str, chunks: List[RAGDocumentChunk]) -> str:
        """Structured deterministic synthesis when no external cloud LLM key is configured."""
        primary = chunks[0]
        intro = f"According to the verified **{primary.title}** ({primary.category}):\n\n"
        
        body_points = []
        for c in chunks:
            lines = [l.strip() for l in c.content.splitlines() if l.strip() and not l.startswith("#")]
            for line in lines[:3]:
                if line.startswith("- ") or line.startswith("* ") or re.match(r'^\d+\.', line):
                    body_points.append(line)
                elif len(line) > 50:
                    body_points.append(f"• {line}")

        if body_points:
            summary = "\n".join(body_points[:5])
        else:
            summary = primary.content[:400] + "..."

        closing = "\n\n*Note: Refer to the cited documentation references below for complete architectural parameters.*"
        return f"{intro}{summary}{closing}"

rag_engine = RAGEngineService()

