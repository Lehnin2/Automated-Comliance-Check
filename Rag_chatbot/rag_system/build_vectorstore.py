"""
Build Vector Store for ODDO BHF Compliance RAG System
Creates embeddings and stores in vector database
"""
from typing import List, Optional
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import Chroma, FAISS
from langchain.docstore.document import Document as LangChainDocument
from tqdm import tqdm

from data_loader import ComplianceDataLoader, Document
from config import (
    VECTOR_STORE,
    CHROMA_PERSIST_DIR,
    USE_LOCAL_EMBEDDINGS,
    LOCAL_EMBEDDING_MODEL,
)

class VectorStoreBuilder:
    """Build and manage vector store for compliance documents"""
    
    def __init__(self):
        self.embeddings = self._initialize_embeddings()
        self.vectorstore = None
    
    def _initialize_embeddings(self):
        """Initialize embedding model"""
        print(f"🔧 Using local embeddings: {LOCAL_EMBEDDING_MODEL}")
        return HuggingFaceEmbeddings(
            model_name=LOCAL_EMBEDDING_MODEL,
            model_kwargs={
                'device': 'cpu',
                'trust_remote_code': True
            },
            encode_kwargs={
                'normalize_embeddings': True,
                'batch_size': 32
            }
        )
    
    def build(self, documents: List[Document], force_rebuild: bool = False):
        """Build vector store from documents"""
        print(f"\n🏗️  Building vector store ({VECTOR_STORE})...")
        
        # Convert to LangChain documents
        langchain_docs = self._convert_to_langchain_docs(documents)
        
        # Build vector store
        if VECTOR_STORE == "chromadb":
            self.vectorstore = self._build_chroma(langchain_docs, force_rebuild)
        elif VECTOR_STORE == "faiss":
            self.vectorstore = self._build_faiss(langchain_docs)
        else:
            raise ValueError(f"Unsupported vector store: {VECTOR_STORE}")
        
        print(f"✅ Vector store built with {len(documents)} documents")
        return self.vectorstore
    
    def _convert_to_langchain_docs(self, documents: List[Document]) -> List[LangChainDocument]:
        """Convert custom Document to LangChain Document"""
        langchain_docs = []
        
        print("📝 Converting documents...")
        for doc in tqdm(documents):
            # Add source info to metadata
            metadata = doc.metadata.copy()
            metadata['doc_id'] = doc.id
            metadata['source_file'] = doc.source_file
            metadata['source_path'] = doc.source_path
            
            # Clean metadata for ChromaDB compatibility
            # ChromaDB only accepts: str, int, float, bool (no None, no lists, no dicts)
            cleaned_metadata = {}
            for key, value in metadata.items():
                if value is None:
                    # Skip None values entirely
                    continue
                elif isinstance(value, list):
                    # Convert lists to comma-separated strings
                    cleaned_metadata[key] = ', '.join(str(v) for v in value)
                elif isinstance(value, dict):
                    # Convert dicts to JSON strings
                    import json
                    cleaned_metadata[key] = json.dumps(value)
                elif isinstance(value, (str, int, float, bool)):
                    # Keep valid types as-is
                    cleaned_metadata[key] = value
                else:
                    # Convert any other type to string
                    cleaned_metadata[key] = str(value)
            
            metadata = cleaned_metadata
            
            langchain_doc = LangChainDocument(
                page_content=doc.text,
                metadata=metadata
            )
            langchain_docs.append(langchain_doc)
        
        return langchain_docs
    
    def _build_chroma(self, documents: List[LangChainDocument], force_rebuild: bool) -> Chroma:
        """Build ChromaDB vector store"""
        import shutil
        from pathlib import Path
        
        persist_dir = Path(CHROMA_PERSIST_DIR)
        
        # Check if exists and handle rebuild
        if persist_dir.exists():
            if force_rebuild:
                print(f"🗑️  Removing existing ChromaDB at {persist_dir}")
                shutil.rmtree(persist_dir)
            else:
                print(f"📂 Loading existing ChromaDB from {persist_dir}")
                return Chroma(
                    persist_directory=str(persist_dir),
                    embedding_function=self.embeddings
                )
        
        # Create new vector store
        print(f"📦 Creating ChromaDB at {persist_dir}")
        vectorstore = Chroma.from_documents(
            documents=documents,
            embedding=self.embeddings,
            persist_directory=str(persist_dir)
        )
        
        # Persist
        vectorstore.persist()
        print(f"💾 Persisted to {persist_dir}")
        
        return vectorstore
    
    def _build_faiss(self, documents: List[LangChainDocument]) -> FAISS:
        """Build FAISS vector store"""
        print("📦 Creating FAISS index")
        vectorstore = FAISS.from_documents(
            documents=documents,
            embedding=self.embeddings
        )
        
        # Save index
        vectorstore.save_local("faiss_index")
        print("💾 Saved FAISS index to faiss_index/")
        
        return vectorstore
    
    def load_existing(self):
        """Load existing vector store"""
        if VECTOR_STORE == "chromadb":
            print(f"📂 Loading ChromaDB from {CHROMA_PERSIST_DIR}")
            self.vectorstore = Chroma(
                persist_directory=CHROMA_PERSIST_DIR,
                embedding_function=self.embeddings
            )
        elif VECTOR_STORE == "faiss":
            print("📂 Loading FAISS index")
            self.vectorstore = FAISS.load_local(
                "faiss_index",
                self.embeddings
            )
        
        return self.vectorstore
    
    def search(self, query: str, k: int = 5, filter_dict: Optional[dict] = None):
        """Search vector store"""
        if not self.vectorstore:
            raise ValueError("Vector store not built or loaded")
        
        if filter_dict:
            results = self.vectorstore.similarity_search(
                query,
                k=k,
                filter=filter_dict
            )
        else:
            results = self.vectorstore.similarity_search(query, k=k)
        
        return results
    
    def search_with_score(self, query: str, k: int = 5):
        """Search with similarity scores"""
        if not self.vectorstore:
            raise ValueError("Vector store not built or loaded")
        
        results = self.vectorstore.similarity_search_with_score(query, k=k)
        return results

def main():
    """Main function to build vector store"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Build ODDO BHF Compliance Vector Store")
    parser.add_argument("--rebuild", action="store_true", help="Force rebuild of vector store")
    parser.add_argument("--test", action="store_true", help="Run test queries after building")
    args = parser.parse_args()
    
    # Load data
    print("=" * 60)
    print("ODDO BHF Compliance RAG System - Vector Store Builder")
    print("=" * 60)
    
    loader = ComplianceDataLoader()
    documents = loader.load_all()
    
    # Build vector store
    builder = VectorStoreBuilder()
    vectorstore = builder.build(documents, force_rebuild=args.rebuild)
    
    # Test queries
    if args.test:
        print("\n" + "=" * 60)
        print("Running Test Queries")
        print("=" * 60)
        
        test_queries = [
            "Quelles sont les règles pour un document retail français?",
            "Comment valider les pays de commercialisation?",
            "Disclaimer pour client professionnel allemand",
            "Règles pour performances backtestées",
            "Validation FSMA Belgique",
        ]
        
        for query in test_queries:
            print(f"\n🔍 Query: {query}")
            results = builder.search(query, k=3)
            
            for i, doc in enumerate(results, 1):
                print(f"\n  Result {i}:")
                print(f"    Type: {doc.metadata.get('type', 'unknown')}")
                print(f"    ID: {doc.metadata.get('doc_id', 'unknown')}")
                print(f"    Source: {doc.metadata.get('source_file', 'unknown')}")
                print(f"    Preview: {doc.page_content[:150]}...")
    
    print("\n✅ Vector store ready!")
    print(f"📍 Location: {CHROMA_PERSIST_DIR if VECTOR_STORE == 'chromadb' else 'faiss_index/'}")

if __name__ == "__main__":
    main()