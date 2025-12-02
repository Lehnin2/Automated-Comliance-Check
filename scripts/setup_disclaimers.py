"""
Setup Disclaimers - Phase 0.5A
Extraction intelligente et indexation des disclaimers dans ChromaDB
"""

from pathlib import Path
from typing import Dict

# Imports depuis le même dossier (scripts/)
from config import (
    DISCLAIMERS_EXCEL,
    DISCLAIMERS_JSON,
    VECTOR_DB_DIR,
    ensure_directories,
    validate_api_key
)
from indexing.smart_disclaimers_extractor import SmartDisclaimersExtractor
from indexing.embeddings_manager import EmbeddingsManager
from indexing.vector_store import VectorStore


def setup_disclaimers():
    """Setup complet des disclaimers"""
    
    print("=" * 80)
    print("🚀 PHASE 0.5A : SETUP DISCLAIMERS - Extraction & Indexation")
    print("=" * 80)
    print()
    
    # Vérifier configuration
    try:
        validate_api_key()
        ensure_directories()
    except ValueError as e:
        print(e)
        return
    
    # Utiliser chemin depuis config
    excel_path = DISCLAIMERS_EXCEL
    
    if not excel_path.exists():
        print(f"❌ ERREUR: Fichier Excel introuvable: {excel_path}")
        print(f"   Attendu: {excel_path}")
        print(f"   Veuillez placer le fichier dans data/source/disclaimers/")
        return
    
    # Étape 1 : Extraction intelligente
    print("[Étape 1/4] Extraction intelligente avec LLM")
    print("-" * 80)
    
    try:
        extractor = SmartDisclaimersExtractor(str(excel_path))
        result = extractor.extract()
        disclaimers = result['disclaimers']
        
        # Sauvegarder JSON (utiliser chemin depuis config)
        output_json = DISCLAIMERS_JSON
        extractor.save_to_json(str(output_json))
        
    except Exception as e:
        print(f"❌ ERREUR lors de l'extraction: {e}")
        return
    
    print()
    
    # Étape 2 : Créer embeddings
    print("[Étape 2/4] Création des embeddings")
    print("-" * 80)
    
    try:
        embeddings_mgr = EmbeddingsManager()
        
        # Créer texte enrichi pour embedding
        enriched_texts = []
        for d in disclaimers:
            text_parts = []
            
            # ID et type
            text_parts.append(f"ID: {d['id']}")
            text_parts.append(f"Type: {d.get('document_type_raw', '')}")
            text_parts.append(f"Client: {d.get('client_type', '')}")
            
            # Contextes
            if d.get('contexts'):
                text_parts.append(f"Contextes: {', '.join(d['contexts'])}")
            
            # Mots-clés
            if d.get('keywords'):
                text_parts.append(f"Mots-clés: {', '.join(d['keywords'])}")
            
            # Textes (priorité français)
            if d.get('texts', {}).get('french'):
                text_parts.append(f"Texte FR: {d['texts']['french'][:500]}")
            
            enriched_texts.append("\n".join(text_parts))
        
        # Générer embeddings
        embeddings = embeddings_mgr.model.encode(
            enriched_texts,
            show_progress_bar=True,
            convert_to_numpy=True
        )
        
        print(f"✅ Embeddings créés (shape: {embeddings.shape})")
        
    except Exception as e:
        print(f"❌ ERREUR lors de la création des embeddings: {e}")
        return
    
    print()
    
    # Étape 3 : Indexer dans ChromaDB
    print("[Étape 3/4] Indexation dans ChromaDB")
    print("-" * 80)
    
    try:
        # Créer collection séparée pour disclaimers (utiliser chemin depuis config)
        vector_store = VectorStore(persist_directory=str(VECTOR_DB_DIR))
        
        # Supprimer ancienne collection si existe
        try:
            vector_store.client.delete_collection("disclaimers")
            print("   ⚠️  Ancienne collection supprimée")
        except:
            pass
        
        # Créer nouvelle collection
        vector_store.collection = vector_store.client.create_collection(
            name="disclaimers",
            metadata={"description": "Disclaimers ODDO BHF (FR/EN/DE)"}
        )
        
        # Préparer données pour indexation
        ids = [d['id'] for d in disclaimers]
        documents = [create_document(d) for d in disclaimers]
        metadatas = [create_metadata(d) for d in disclaimers]
        
        # Indexer
        vector_store.collection.add(
            ids=ids,
            embeddings=embeddings.tolist(),
            documents=documents,
            metadatas=metadatas
        )
        
        print(f"✅ {len(disclaimers)} disclaimers indexés")
        
    except Exception as e:
        print(f"❌ ERREUR lors de l'indexation: {e}")
        return
    
    print()
    
    # Étape 4 : Tests de recherche
    print("[Étape 4/4] Tests de recherche sémantique")
    print("-" * 80)
    
    test_queries = [
        "disclaimer performances passées retail",
        "avertissement risques clients professionnels",
        "mentions légales OBAM SAS"
    ]
    
    for query in test_queries:
        print(f"\n🔍 Query: '{query}'")
        
        results = vector_store.collection.query(
            query_texts=[query],
            n_results=3
        )
        
        if results['ids'][0]:
            print(f"   ✅ {len(results['ids'][0])} disclaimers trouvés:")
            for i, (disc_id, metadata) in enumerate(zip(
                results['ids'][0],
                results['metadatas'][0]
            ), 1):
                client_type = metadata.get('client_type', 'unknown')
                contexts = metadata.get('contexts', 'N/A')
                print(f"      {i}. {disc_id} - {client_type} - {contexts}")
        else:
            print("   ⚠️  Aucun disclaimer trouvé")
    
    print()
    print("=" * 80)
    print("✅ PHASE 0.5A TERMINÉE AVEC SUCCÈS")
    print("=" * 80)
    print()
    print(f"📊 Statistiques:")
    print(f"   - Disclaimers indexés: {len(disclaimers)}")
    print(f"   - Dimension embeddings: {embeddings.shape[1]}")
    print(f"   - Collection ChromaDB: disclaimers")
    print(f"   - Fichier JSON: {output_json}")
    print()
    print("🎯 Prochaine étape: Phase 0.5B - Indexation Registration Abroad")


def create_document(disclaimer: Dict) -> str:
    """Crée le document texte pour ChromaDB"""
    parts = []
    
    # Type de document
    if disclaimer.get('document_type_raw'):
        parts.append(f"Type: {disclaimer['document_type_raw']}")
    
    # Texte français (principal)
    if disclaimer.get('texts', {}).get('french'):
        parts.append(disclaimer['texts']['french'][:1000])
    
    return "\n\n".join(parts)


def create_metadata(disclaimer: Dict) -> Dict:
    """Crée les métadonnées pour ChromaDB (uniquement types simples)"""
    
    # Fonction helper pour convertir en string
    def to_string(value):
        if isinstance(value, list):
            return ', '.join(str(v) for v in value)
        elif value is None:
            return 'unknown'
        else:
            return str(value)
    
    metadata = {
        "disclaimer_id": disclaimer['id'],
        "client_type": to_string(disclaimer.get('client_type', 'unknown')),
        "management_company": to_string(disclaimer.get('management_company', 'unknown')),
        "confidence_score": float(disclaimer.get('confidence_score', 0.0)),
        "status": to_string(disclaimer.get('status', 'unknown'))
    }
    
    # Ajouter contextes (convertir liste en string)
    if disclaimer.get('contexts'):
        contexts = disclaimer['contexts']
        if isinstance(contexts, list):
            metadata['contexts'] = ', '.join(contexts[:5])
        else:
            metadata['contexts'] = str(contexts)
    
    # Ajouter keywords (convertir liste en string)
    if disclaimer.get('keywords'):
        keywords = disclaimer['keywords']
        if isinstance(keywords, list):
            metadata['keywords'] = ', '.join(keywords[:10])
        else:
            metadata['keywords'] = str(keywords)
    
    return metadata


if __name__ == "__main__":
    setup_disclaimers()
