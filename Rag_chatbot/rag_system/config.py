"""
Configuration for ODDO BHF Compliance RAG System
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Base paths
BASE_DIR = Path(__file__).parent.parent
DATABASE_DIR = BASE_DIR / "database"

# JSON Files
JSON_FILES = {
    "rules": DATABASE_DIR / "rules_database.json",
    "disclaimers": DATABASE_DIR / "disclaimers-glossary.json",
    "registration": DATABASE_DIR / "registration-countries.json",
    "mapping": DATABASE_DIR / "compliance-mapping.json",
    "validation": DATABASE_DIR / "validation-schema.json",
    "examples": DATABASE_DIR / "usage-examples.json",
}

# Markdown Documentation Files
MARKDOWN_FILES = {
    "readme": DATABASE_DIR / "README.md",
    "integration": DATABASE_DIR / "INTEGRATION-SUMMARY.md",
    "quickstart": DATABASE_DIR / "QUICK-START.md",
    "index": DATABASE_DIR / "INDEX.md",
    "registration_integration": DATABASE_DIR / "REGISTRATION-INTEGRATION.md",
}

# API Keys
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY") or os.getenv("CLAUDE_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENVIRONMENT = os.getenv("PINECONE_ENVIRONMENT")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "oddo-compliance")

# Vector Store Configuration
VECTOR_STORE = os.getenv("VECTOR_STORE", "chromadb")
CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
USE_LOCAL_EMBEDDINGS = os.getenv("USE_LOCAL_EMBEDDINGS", "false").lower() == "true"

# Embedding Configuration (Claude doesn't provide embeddings, use local)
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
LOCAL_EMBEDDING_MODEL = "all-MiniLM-L6-v2"
USE_LOCAL_EMBEDDINGS = True  # Force local embeddings since Claude doesn't provide them

# LLM Configuration
LLM_MODEL = os.getenv("LLM_MODEL", "claude-sonnet-4-20250514")
LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", "0.1"))

# Chunking Configuration
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "500"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "50"))

# Retrieval Configuration - CORRIGÉ
TOP_K_RESULTS = int(os.getenv("TOP_K_RESULTS", "50"))  # Réduit de 658 à 50 pour performances
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.7"))

# Retrieval Strategy - NOUVEAU
RETRIEVAL_STRATEGY = os.getenv("RETRIEVAL_STRATEGY", "hybrid")  # "similarity", "metadata", "hybrid"
USE_METADATA_FILTERING = os.getenv("USE_METADATA_FILTERING", "true").lower() == "true"

# Neo4j Configuration (optional)
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")

# Metadata fields to index
METADATA_FIELDS = {
    "rules": ["id", "category", "applicability", "mandatory", "country"],
    "disclaimers": ["id", "language", "client_type", "management_company", "document_type"],
    "registration": ["fund_name", "share_class", "isin", "country", "status"],
    "mapping": ["rule_id", "applicability"],
    "validation": ["section_id", "mandatory"],
    "examples": ["scenario_id", "description"],
}

# Supported languages
SUPPORTED_LANGUAGES = ["en", "fr", "de"]

# Client types mapping
CLIENT_TYPES = {
    "retail": "NON_PROFESSIONAL",
    "professional": "PROFESSIONAL",
    "well_informed": "WELL_INFORMED",
}

# Document types
DOCUMENT_TYPES = [
    "OBAM_PRESENTATION",
    "COMMERCIAL_DOC_FUNDS",
    "COMMERCIAL_DOC_STRATEGIES",
    "COMMERCIAL_DOC_RAIF",
    "FUNDS_REPORTING",
    "MMF_WEEKLY_REPORTING",
]

# Countries
COUNTRIES = ["BE", "DE", "FR", "CH", "LU", "AT", "ES", "IT", "NL", "PT", "GB", "SG", "SE", "FI", "DK", "NO", "IE", "AE", "IS", "CL", "PE"]

def validate_config():
    """Validate configuration and check required files exist"""
    errors = []
    
    # Check JSON files exist
    for name, path in JSON_FILES.items():
        if not path.exists():
            errors.append(f"Missing JSON file: {path}")
    
    # Check API keys for Claude
    if not ANTHROPIC_API_KEY:
        errors.append("ANTHROPIC_API_KEY or CLAUDE_API_KEY not set")
    
    # Check vector store specific requirements
    if VECTOR_STORE == "pinecone":
        if not PINECONE_API_KEY:
            errors.append("PINECONE_API_KEY not set for Pinecone vector store")
        if not PINECONE_ENVIRONMENT:
            errors.append("PINECONE_ENVIRONMENT not set for Pinecone vector store")
    
    if errors:
        raise ValueError(f"Configuration errors:\n" + "\n".join(f"- {e}" for e in errors))
    
    return True

if __name__ == "__main__":
    try:
        validate_config()
        print("✅ Configuration validated successfully!")
        print(f"\nUsing:")
        print(f"  - Vector Store: {VECTOR_STORE}")
        print(f"  - Embeddings: Local ({EMBEDDING_MODEL})")
        print(f"  - LLM: Claude ({LLM_MODEL})")
        print(f"  - Database Dir: {DATABASE_DIR}")
        print(f"  - Retrieval Strategy: {RETRIEVAL_STRATEGY}")
        print(f"  - Top K Results: {TOP_K_RESULTS}")
    except ValueError as e:
        print(f"❌ Configuration validation failed:\n{e}")