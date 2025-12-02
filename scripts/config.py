"""
Configuration Centralisée - Chemins et Paramètres
Tous les chemins du projet sont définis ici pour faciliter la maintenance
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# ============================================================================
# CHEMINS DE BASE
# ============================================================================

# Racine du projet (dossier parent de scripts/)
PROJECT_ROOT = Path(__file__).parent.parent.absolute()

# Charger variables d'environnement depuis la racine
load_dotenv(PROJECT_ROOT / ".env")

# ============================================================================
# DONNÉES SOURCES (Fichiers originaux - lecture seule)
# ============================================================================

SOURCE_DIR = PROJECT_ROOT / "DATA" / "source"

# Tous les fichiers sources directement dans DATA/source/ (pas de sous-dossiers)
RULES_PDF = SOURCE_DIR / "Synthèse règles présentations commerciales.pdf"
DISCLAIMERS_EXCEL = SOURCE_DIR / "GLOSSAIRE DISCLAIMERS 20231122.xlsx"
REGISTRATION_EXCEL = SOURCE_DIR / "Registration abroad of Funds_20251008.xlsx"
CONSIGNES_PDF = SOURCE_DIR / "Consignes.pdf"

# ============================================================================
# DONNÉES EXTRAITES (JSON structurés générés)
# ============================================================================

EXTRACTED_DIR = PROJECT_ROOT / "DATA" / "extracted"

# Règles extraites
RULES_EXTRACTED_DIR = EXTRACTED_DIR / "rules"
RULES_JSON = EXTRACTED_DIR / "smart_extracted_rules.json"  # Fichier directement dans extracted/
RULES_VALIDATION_HTML = RULES_EXTRACTED_DIR / "validation_report.html"

# Disclaimers extraits
DISCLAIMERS_EXTRACTED_DIR = EXTRACTED_DIR / "disclaimers"
DISCLAIMERS_JSON = DISCLAIMERS_EXTRACTED_DIR / "smart_extracted_disclaimers.json"
DISCLAIMERS_VALIDATION_HTML = DISCLAIMERS_EXTRACTED_DIR / "validation_report.html"

# Registration extraite
REGISTRATION_EXTRACTED_DIR = EXTRACTED_DIR / "registration"
REGISTRATION_JSON = REGISTRATION_EXTRACTED_DIR / "smart_extracted_registration.json"
REGISTRATION_VALIDATION_HTML = REGISTRATION_EXTRACTED_DIR / "validation_report.html"

# ============================================================================
# BASE DE DONNÉES VECTORIELLE (ChromaDB)
# ============================================================================

VECTOR_DB_DIR = PROJECT_ROOT / "DATA" / "chroma_db"

# Collections ChromaDB
CHROMA_COLLECTION_RULES = "rules"
CHROMA_COLLECTION_DISCLAIMERS = "disclaimers"
CHROMA_COLLECTION_REGISTRATION = "registration"

# ============================================================================
# EXEMPLES DE TEST
# ============================================================================

EXAMPLES_DIR = PROJECT_ROOT / "DATA" / "examples"

EXAMPLE_1_DIR = EXAMPLES_DIR / "example_1"
EXAMPLE_2_DIR = EXAMPLES_DIR / "example_2"
EXAMPLE_3_DIR = EXAMPLES_DIR / "example_3"

# ============================================================================
# RAPPORTS GÉNÉRÉS
# ============================================================================

REPORTS_DIR = PROJECT_ROOT / "DATA" / "reports"

# ============================================================================
# DOCUMENTATION
# ============================================================================

DOCS_DIR = PROJECT_ROOT / "docs"

# ============================================================================
# SCRIPTS
# ============================================================================

SCRIPTS_DIR = PROJECT_ROOT / "scripts"

# ============================================================================
# CONFIGURATION LLM
# ============================================================================

# Groq API
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = "llama-3.3-70b-versatile"

# Embeddings
EMBEDDINGS_MODEL = "all-MiniLM-L6-v2"
EMBEDDINGS_DIMENSION = 384

# ============================================================================
# FONCTIONS UTILITAIRES
# ============================================================================

def ensure_directories():
    """
    Crée tous les dossiers nécessaires s'ils n'existent pas
    À appeler au démarrage de chaque script
    """
    directories = [
        # Sources (un seul dossier, pas de sous-dossiers)
        SOURCE_DIR,
        
        # Extractions
        RULES_EXTRACTED_DIR,
        DISCLAIMERS_EXTRACTED_DIR,
        REGISTRATION_EXTRACTED_DIR,
        
        # Vector DB
        VECTOR_DB_DIR,
        
        # Examples
        EXAMPLES_DIR,
        
        # Reports
        REPORTS_DIR,
        
        # Docs
        DOCS_DIR,
        
        # Scripts
        SCRIPTS_DIR
    ]
    
    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)
    
    return True


def get_example_files(example_number: int):
    """
    Retourne les chemins des fichiers d'un exemple
    
    Args:
        example_number: Numéro de l'exemple (1, 2, 3)
    
    Returns:
        Dict avec les chemins des fichiers
    """
    example_dir = EXAMPLES_DIR / f"example_{example_number}"
    
    return {
        "dir": example_dir,
        "presentation": example_dir / "presentation.pptx",
        "metadata": example_dir / "metadata.json",
        "prospectus": example_dir / "prospectus.pdf" if example_number == 2 else None
    }


def validate_api_key():
    """
    Vérifie que la clé API Groq est configurée
    
    Raises:
        ValueError: Si la clé n'est pas trouvée
    """
    if not GROQ_API_KEY:
        raise ValueError(
            "❌ GROQ_API_KEY non trouvée!\n"
            "   Veuillez configurer votre clé API dans le fichier .env\n"
            "   Exemple: GROQ_API_KEY=gsk_votre_cle_ici"
        )
    return True


def print_config_summary():
    """Affiche un résumé de la configuration"""
    print("=" * 80)
    print("CONFIGURATION DU PROJET")
    print("=" * 80)
    print(f"Racine projet: {PROJECT_ROOT}")
    print(f"Sources: {SOURCE_DIR}")
    print(f"Extractions: {EXTRACTED_DIR}")
    print(f"Vector DB: {VECTOR_DB_DIR}")
    print(f"Exemples: {EXAMPLES_DIR}")
    print(f"Rapports: {REPORTS_DIR}")
    print(f"Modele LLM: {GROQ_MODEL}")
    print(f"Embeddings: {EMBEDDINGS_MODEL} (dim={EMBEDDINGS_DIMENSION})")
    print("=" * 80)
    print()


# ============================================================================
# VALIDATION AU CHARGEMENT
# ============================================================================

if __name__ == "__main__":
    # Test de la configuration
    print_config_summary()
    
    print("Verification des dossiers...")
    ensure_directories()
    print("OK - Tous les dossiers sont crees")
    print()
    
    print("Verification de la cle API...")
    try:
        validate_api_key()
        print("OK - Cle API Groq configuree")
    except ValueError as e:
        print(e)
    print()
    
    print("Verification des fichiers sources...")
    sources = [
        ("Regles PDF", RULES_PDF),
        ("Disclaimers Excel", DISCLAIMERS_EXCEL),
        ("Registration Excel", REGISTRATION_EXCEL)
    ]
    
    for name, path in sources:
        if path.exists():
            print(f"   OK - {name}: {path.name}")
        else:
            print(f"   MANQUANT - {name}: {path}")
    print()
    
    print("Configuration validee!")
