"""
Gestionnaire d'Embeddings pour RAG
Crée des embeddings sémantiques pour les règles de conformité
"""

from sentence_transformers import SentenceTransformer
from typing import List, Dict
import numpy as np


class EmbeddingsManager:
    """Gère la création d'embeddings pour les règles"""
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialise le modèle d'embeddings
        
        Args:
            model_name: Nom du modèle Sentence Transformers
                       (all-MiniLM-L6-v2 = rapide, léger, gratuit)
        """
        print(f"📥 Chargement du modèle d'embeddings: {model_name}")
        self.model = SentenceTransformer(model_name)
        print(f"✅ Modèle chargé (dimension: {self.model.get_sentence_embedding_dimension()})")
    
    def create_rule_text(self, rule: Dict) -> str:
        """
        Crée un texte enrichi pour embedding à partir d'une règle
        
        Combine tous les champs pertinents pour une recherche sémantique optimale
        
        Args:
            rule: Dictionnaire de la règle
            
        Returns:
            Texte enrichi pour embedding
        """
        parts = []
        
        # Informations de base
        if rule.get('rule_id'):
            parts.append(f"ID: {rule['rule_id']}")
        
        if rule.get('category'):
            parts.append(f"Catégorie: {rule['category']}")
        
        if rule.get('title'):
            parts.append(f"Titre: {rule['title']}")
        
        # Description (le plus important)
        if rule.get('description'):
            parts.append(f"Description: {rule['description']}")
        
        # Mots-clés
        if rule.get('keywords'):
            keywords_str = ', '.join(rule['keywords'])
            parts.append(f"Mots-clés: {keywords_str}")
        
        # Texte source (si disponible)
        if rule.get('source_text'):
            parts.append(f"Source: {rule['source_text']}")
        
        # Références
        if rule.get('references'):
            refs_str = ', '.join(rule['references'])
            parts.append(f"Références: {refs_str}")
        
        # Slide number (pour contexte)
        if rule.get('slide_number'):
            parts.append(f"Slide: {rule['slide_number']}")
        
        return "\n".join(parts)
    
    def embed_rules(self, rules: List[Dict]) -> np.ndarray:
        """
        Crée des embeddings pour une liste de règles
        
        Args:
            rules: Liste de règles (dictionnaires)
            
        Returns:
            Array numpy d'embeddings (shape: [n_rules, embedding_dim])
        """
        print(f"🔄 Création des embeddings pour {len(rules)} règles...")
        
        # Créer textes enrichis
        texts = [self.create_rule_text(rule) for rule in rules]
        
        # Générer embeddings
        embeddings = self.model.encode(
            texts,
            show_progress_bar=True,
            convert_to_numpy=True
        )
        
        print(f"✅ Embeddings créés (shape: {embeddings.shape})")
        return embeddings
    
    def embed_query(self, query: str) -> np.ndarray:
        """
        Crée un embedding pour une requête de recherche
        
        Args:
            query: Texte de la requête
            
        Returns:
            Embedding de la requête
        """
        return self.model.encode(query, convert_to_numpy=True)
