from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.sql_models import RAGDocument, AuditLog
from app.models.schemas import RAGQueryRequest, RAGQueryResponse, DocumentCreate, DocumentResponse
from app.api.v1.endpoints.auth import get_current_user
from app.models.sql_models import User
from app.services.rag_engine import rag_engine

router = APIRouter()

@router.post("/query", response_model=RAGQueryResponse)
def query_rag_assistant(req: RAGQueryRequest):
    """
    Retrieves grounded documentation snippets and returns an authoritative AI answer with source citations.
    """
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query string cannot be empty.")
    
    result = rag_engine.query(req.query)
    return result

@router.get("/documents", response_model=List[DocumentResponse])
def list_documents(db: Session = Depends(get_db)):
    return db.query(RAGDocument).order_by(RAGDocument.created_at.desc()).all()

@router.post("/documents", response_model=DocumentResponse)
def add_document(
    doc_in: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["Super Administrator", "Administrator"]:
        raise HTTPException(status_code=403, detail="Document ingestion requires Administrator privileges.")

    new_doc = RAGDocument(
        title=doc_in.title,
        category=doc_in.category,
        content=doc_in.content,
        chunk_count=max(1, len(doc_in.content) // 400),
        file_size_kb=round(len(doc_in.content.encode('utf-8')) / 1024.0, 2),
        author=current_user.full_name,
        is_active=True
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    # Ingest into runtime vector index
    rag_engine.add_custom_document(
        doc_id=new_doc.doc_id,
        title=new_doc.title,
        category=new_doc.category,
        content=new_doc.content
    )

    audit = AuditLog(
        user_email=current_user.email,
        action="RAG_DOCUMENT_INGESTED",
        resource="RAG_KB",
        status="SUCCESS",
        details=f"Ingested document '{new_doc.title}' ({new_doc.category})"
    )
    db.add(audit)
    db.commit()

    return new_doc

@router.delete("/documents/{doc_id}")
def delete_document(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["Super Administrator", "Administrator"]:
        raise HTTPException(status_code=403, detail="Deleting knowledge documents requires Administrator privileges.")

    doc = db.query(RAGDocument).filter(RAGDocument.doc_id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    rag_engine.remove_document(doc_id)
    db.delete(doc)

    audit = AuditLog(
        user_email=current_user.email,
        action="RAG_DOCUMENT_DELETED",
        resource="RAG_KB",
        status="SUCCESS",
        details=f"Purged document '{doc.title}' from knowledge base"
    )
    db.add(audit)
    db.commit()

    return {"message": f"Document '{doc.title}' successfully removed and vector index updated."}

