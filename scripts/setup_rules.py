"""
Setup RAG - Phase 0
Indexation des règles de conformité dans ChromaDB
"""

from pathlib import Path

# Imports depuis le même dossier (scripts/)
from config import (
    RULES_JSON,
    VECTOR_DB_DIR,
    ensure_directories,
    validate_api_key
)
from indexing.rules_indexer import RulesIndexer
from indexing.embeddings_manager import EmbeddingsManager
from indexing.vector_store import VectorStore


def setup_rag():
    """Setup complet du système RAG"""
    
    print("=" * 70)
    print("🚀 PHASE 0 : SETUP RAG - INDEXATION DES RÈGLES")
    print("=" * 70)
    print()
    
    # Vérifier configuration
    try:
        validate_api_key()
        ensure_directories()
    except ValueError as e:
        print(e)
        return
    
    # Utiliser chemin depuis config
    rules_path = RULES_JSON
    
    # Étape 1 : Charger les règles
    print("[Étape 1/5] Chargement et validation des règles")
    print("-" * 70)
    
    try:
        indexer = RulesIndexer(str(rules_path))
        rules = indexer.load_rules()
        
        # Validation
        errors = indexer.validate_rules()
        if errors:
            print("⚠️  Avertissements de validation:")
            for error in errors[:5]:  # Afficher max 5 erreurs
                print(f"   - {error}")
        
        # Statistiques
        stats = indexer.get_statistics()
        print(f"\n📊 Statistiques:")
        print(f"   - Total: {stats['total_rules']} règles")
        print(f"   - Catégories: {len(stats['by_category'])}")
        print(f"   - Sévérités: {len(stats['by_severity'])}")
        
    except (FileNotFoundError, ValueError) as e:
        print(f"❌ ERREUR: {e}")
        return
    
    print()
    
    # Étape 2 : Créer les embeddings
    print("[Étape 2/5] Création des embeddings")
    print("-" * 70)
    embeddings_mgr = EmbeddingsManager()
    embeddings = embeddings_mgr.embed_rules(rules)
    print()
    
    # Étape 3 : Indexer dans ChromaDB
    print("[Étape 3/5] Indexation dans ChromaDB")
    print("-" * 70)
    vector_store = VectorStore(persist_directory=str(VECTOR_DB_DIR))
    vector_store.index_rules(rules, embeddings)
    print()
    
    # Étape 4 : Test de recherche
    print("[Étape 4/5] Test de recherche sémantique")
    print("-" * 70)
    
    test_queries = [
        "règles pour la page de garde",
        "disclaimer performances passées",
        "mentions de valeurs interdites"
    ]
    
    for query in test_queries:
        print(f"\n🔍 Query: '{query}'")
        results = vector_store.search(query, n_results=3)
        
        if results['ids'][0]:
            print(f"   ✅ {len(results['ids'][0])} règles trouvées:")
            for i, (rule_id, metadata) in enumerate(zip(
                results['ids'][0],
                results['metadatas'][0]
            ), 1):
                print(f"      {i}. {rule_id} - {metadata['category']}")
        else:
            print("   ⚠️  Aucune règle trouvée")
    
    print()
    
    # Étape 5 : Résumé final
    print("[Étape 5/5] Résumé et vérification")
    print("-" * 70)
    print(f"✅ Règles indexées: {vector_store.count()}")
    print(f"✅ Dimension embeddings: {embeddings.shape[1]}")
    print(f"✅ Base de données: {vector_store.persist_directory}")
    
    print()
    print("=" * 70)
    print("✅ PHASE 0 TERMINÉE AVEC SUCCÈS")
    print("=" * 70)
    print()
    print("🎯 Prochaine étape: Phase 1 - Création de l'Agent Autonome")
    print("💡 Le système RAG est prêt pour la recherche sémantique des règles")


if __name__ == "__main__":
    setup_rag()
