"""
Vector Store avec ChromaDB
Stocke et recherche les règles via embeddings sémantiques
"""

import chromadb
from chromadb.config import Settings
from typing import List, Dict, Optional
import numpy as np


class VectorStore:
    """Interface ChromaDB pour stockage et recherche vectorielle"""
    
    def __init__(self, persist_directory: str = "./data/chroma_db"):
        """
        Initialise ChromaDB
        
        Args:
            persist_directory: Dossier de persistance de la base
        """
        print(f"🗄️  Initialisation ChromaDB: {persist_directory}")
        
        self.persist_directory = persist_directory
        self.client = chromadb.PersistentClient(path=persist_directory)
        
        # Créer ou récupérer la collection
        self.collection = self.client.get_or_create_collection(
            name="compliance_rules",
            metadata={"description": "Règles de conformité ODDO BHF"}
        )
        
        print(f"✅ ChromaDB initialisé ({self.collection.count()} règles indexées)")
    
    def index_rules(self, rules: List[Dict], embeddings: np.ndarray):
        """
        Indexe les règles avec leurs embeddings
        
        Args:
            rules: Liste des règles
            embeddings: Embeddings correspondants
        """
        print(f"📥 Indexation de {len(rules)} règles...")
        
        # Préparer les données
        ids = [rule['rule_id'] for rule in rules]
        documents = [self._create_document(rule) for rule in rules]
        metadatas = [self._create_metadata(rule) for rule in rules]
        
        # Vider la collection existante
        if self.collection.count() > 0:
            print("⚠️  Collection existante détectée, suppression...")
            self.client.delete_collection("compliance_rules")
            self.collection = self.client.create_collection(
                name="compliance_rules",
                metadata={"description": "Règles de conformité ODDO BHF"}
            )
        
        # Ajouter les règles
        self.collection.add(
            ids=ids,
            embeddings=embeddings.tolist(),
            documents=documents,
            metadatas=metadatas
        )
        
        print(f"✅ {len(rules)} règles indexées avec succès")
    
    def _create_document(self, rule: Dict) -> str:
        """Crée le texte du document pour ChromaDB"""
        parts = [rule.get('title', '')]
        
        if rule.get('description'):
            parts.append(rule['description'])
        
        return "\n\n".join(filter(None, parts))
    
    def _create_metadata(self, rule: Dict) -> Dict:
        """Crée les métadonnées pour filtrage"""
        metadata = {
            "rule_id": rule['rule_id'],
            "category": rule.get('category', 'unknown'),
            "slide_number": str(rule.get('slide_number', 'any')),
            "severity": rule.get('severity', 'medium'),
            "required": str(rule.get('required', True))
        }
        
        # Ajouter keywords comme string
        if rule.get('keywords'):
            metadata['keywords'] = ', '.join(rule['keywords'])
        
        return metadata
    
    def search(
        self,
        query: str,
        n_results: int = 10,
        filters: Optional[Dict] = None
    ) -> Dict:
        """
        Recherche sémantique dans les règles
        
        Args:
            query: Requête de recherche
            n_results: Nombre de résultats à retourner
            filters: Filtres sur les métadonnées (ex: {"slide_number": "1"})
            
        Returns:
            Résultats de recherche avec ids, documents, metadatas, distances
        """
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results,
            where=filters
        )
        
        return results
    
    def get_rule_by_id(self, rule_id: str) -> Optional[Dict]:
        """
        Récupère une règle par son ID
        
        Args:
            rule_id: ID de la règle
            
        Returns:
            Règle complète ou None
        """
        results = self.collection.get(
            ids=[rule_id],
            include=["documents", "metadatas"]
        )
        
        if results['ids']:
            return {
                'id': results['ids'][0],
                'document': results['documents'][0],
                'metadata': results['metadatas'][0]
            }
        
        return None
    
    def get_all_rules(self) -> List[Dict]:
        """Récupère toutes les règles indexées"""
        results = self.collection.get(
            include=["documents", "metadatas"]
        )
        
        rules = []
        for i in range(len(results['ids'])):
            rules.append({
                'id': results['ids'][i],
                'document': results['documents'][i],
                'metadata': results['metadatas'][i]
            })
        
        return rules
    
    def count(self) -> int:
        """Retourne le nombre de règles indexées"""
        return self.collection.count()
