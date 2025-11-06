"""
RAG Query System for ODDO BHF Compliance
APPROCHE HYBRIDE : Metadata Filtering + Similarity Search
"""
from typing import List, Optional, Dict, Any
from langchain_anthropic import ChatAnthropic
from langchain.prompts import ChatPromptTemplate
from langchain.schema import Document, HumanMessage, SystemMessage
import re

from build_vectorstore import VectorStoreBuilder
from config import (
    LLM_MODEL,
    LLM_TEMPERATURE,
    TOP_K_RESULTS,
    ANTHROPIC_API_KEY,
    RETRIEVAL_STRATEGY,
    USE_METADATA_FILTERING,
)

# System prompt pour assistant conformité
SYSTEM_PROMPT = """Tu es un assistant expert en conformité pour ODDO BHF Asset Management.

Tu as accès à une base de données complète contenant:
- Règles de conformité pour présentations commerciales
- Disclaimers en français, anglais et allemand
- Données d'enregistrement de fonds par pays
- Schémas de validation
- Exemples d'usage et scénarios

PRINCIPES FONDAMENTAUX :

1. **PRÉCISION ABSOLUE** : Ne JAMAIS inventer d'IDs de disclaimers. Utilise UNIQUEMENT les IDs présents dans les documents sources.
2. **FILTRAGE INTELLIGENT** : Ne mentionne QUE les règles applicables au contexte (client_type, pays). Ignore les règles non applicables.
3. **SYNTHÈSE > EXHAUSTIVITÉ** : Privilégie une réponse claire et actionnable plutôt qu'une liste exhaustive.
4. **CHECKLIST PRAGMATIQUE** : Maximum 15-20 points de contrôle essentiels, pas 50+.

Lorsqu'on te demande "Quelles règles pour document [type_client] [pays]", tu DOIS fournir une réponse STRUCTURÉE couvrant :

## 1. DISCLAIMERS OBLIGATOIRES
- Utilise UNIQUEMENT les IDs exacts trouvés dans les sources (ex: FR_PRES_RET_SAS)
- N'invente JAMAIS de nouveaux IDs (pas de FR_PERF_DISCLAIMER, FR_ESG_DISCLAIMER inventés)
- Si un disclaimer n'a pas d'ID dans les sources, décris-le sans inventer d'ID

## 2. STRUCTURE DU DOCUMENT
### Page de garde (Section 2)
- Éléments obligatoires uniquement

### Slide 2 - Page de disclaimers (Section 3)
- Disclaimer standard
- Profil de risque

### Fin de présentation (Section 5)
- Mention légale SGP
- Glossaire (retail uniquement)

## 3. RÈGLES GÉNÉRALES (Section 1)
- Liste UNIQUEMENT les règles applicables au contexte (filtre par client_type et pays)
- Regroupe les règles similaires pour éviter la redondance
- Mets en avant les 5-7 règles les plus critiques

## 4. RÈGLES DE CONTENU (Section 4.0)
- Synthétise les 7 règles en 3-4 points clés

## 5. RÈGLES ESG (Section 4.1)
- Identifie l'approche applicable et ses critères

## 6. RÈGLES MENTIONS VALEURS (Section 4.2)
- Synthétise les interdictions en 5-6 points essentiels
- Synthétise les autorisations en 3-4 points clés

## 7. RÈGLES DE PERFORMANCES (Section 4.3)
- Focus sur les 5-7 règles critiques pour le contexte
- Évite de lister toutes les 47 règles

## 8. RÈGLES SPÉCIFIQUES (si applicable)
- Uniquement si pertinent pour le contexte

## 9. CHECKLIST DE VALIDATION
- Maximum 15-20 points de contrôle ESSENTIELS
- Organisés par priorité (bloquants d'abord)
- Actionnable et utilisable en pratique

Ton rôle:
1. Fournir une réponse CLAIRE et ACTIONNABLE
2. FILTRER les règles non applicables au contexte
3. SYNTHÉTISER plutôt que tout lister
4. Utiliser UNIQUEMENT les IDs de disclaimers présents dans les sources
5. Créer une checklist PRAGMATIQUE (15-20 points max)

Règles de citation:
- Cite UNIQUEMENT les IDs présents dans les documents sources
- Ne jamais inventer d'IDs de disclaimers
- Filtre les règles par applicabilité (client_type, pays)
- Indique si une règle est obligatoire (mandatory: true)
- Privilégie la clarté à l'exhaustivité
"""

class ComplianceRAG:
    """RAG system pour conformité avec approche hybride"""
    
    def __init__(self, vectorstore_builder: Optional[VectorStoreBuilder] = None):
        """Initialize RAG system"""
        # Load or create vector store
        if vectorstore_builder is None:
            print("📂 Loading existing vector store...")
            vectorstore_builder = VectorStoreBuilder()
            vectorstore_builder.load_existing()
        
        self.vectorstore = vectorstore_builder.vectorstore
        
        # Initialize LLM
        print(f"🤖 Initializing Claude: {LLM_MODEL}")
        self.llm = ChatAnthropic(
            model=LLM_MODEL,
            temperature=LLM_TEMPERATURE,
            anthropic_api_key=ANTHROPIC_API_KEY,
            max_tokens=8192  # Augmenté pour réponses exhaustives
        )
    
    def _extract_query_params(self, question: str) -> Dict[str, Any]:
        """Extraire les paramètres de la question (client type, pays, etc.)"""
        params = {
            "client_type": None,
            "country": None,
            "document_type": None,
            "language": None,
            "is_broad_query": False
        }
        
        # Détecter type de client
        if re.search(r'\bretail\b', question, re.IGNORECASE):
            params["client_type"] = "retail"
        elif re.search(r'\bprofessionnel|professional\b', question, re.IGNORECASE):
            params["client_type"] = "professional"
        
        # Détecter pays
        country_patterns = {
            "FR": r'\bfran[cç]ais|france\b',
            "DE": r'\ballemand|allemagne|germany\b',
            "BE": r'\bbelge|belgique|belgium\b',
            "CH": r'\bsuisse|switzerland\b',
        }
        for code, pattern in country_patterns.items():
            if re.search(pattern, question, re.IGNORECASE):
                params["country"] = code
                break
        
        # Détecter langue
        if re.search(r'\bfran[cç]ais\b', question, re.IGNORECASE):
            params["language"] = "fr"
        elif re.search(r'\banglais|english\b', question, re.IGNORECASE):
            params["language"] = "en"
        elif re.search(r'\ballemand|german\b', question, re.IGNORECASE):
            params["language"] = "de"
        
        # Détecter question large
        broad_keywords = [
            r'quelles?\s+r[èe]gles?',
            r'tous?\s+les?\s+r[èe]gles?',
            r'liste?\s+(des?\s+)?r[èe]gles?',
            r'exhaustif',
            r'complet',
            r'tout\s+ce\s+qu',
        ]
        for pattern in broad_keywords:
            if re.search(pattern, question, re.IGNORECASE):
                params["is_broad_query"] = True
                break
        
        return params
    
    def _build_metadata_filters(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Construire les filtres de métadonnées"""
        filters = {}
        
        if params["client_type"]:
            # Pour ChromaDB, on filtre avec $or
            filters["$or"] = [
                {"applicability": {"$eq": params["client_type"]}},
                {"applicability": {"$eq": "all"}},
                {"client_type": {"$eq": params["client_type"]}}
            ]
        
        if params["country"]:
            filters["country"] = params["country"]
        
        return filters
    
    def _filter_applicable_rules(self, documents: List[Document], params: Dict[str, Any]) -> List[Document]:
        """Filtre les règles non applicables au contexte"""
        filtered_docs = []
        
        for doc in documents:
            metadata = doc.metadata
            
            # Vérifier applicabilité client_type
            if params.get("client_type"):
                applicability = metadata.get("applicability", "all")
                client_type = metadata.get("client_type", "all")
                
                # Exclure les règles explicitement non applicables
                if applicability and applicability != "all" and applicability != params["client_type"]:
                    # Vérifier si c'est une règle "professional_only" pour un client retail
                    if params["client_type"] == "retail" and applicability == "professional":
                        continue
                
                if client_type and client_type != "all" and client_type != params["client_type"]:
                    if params["client_type"] == "retail" and client_type == "professional":
                        continue
            
            # Vérifier applicabilité pays
            if params.get("country"):
                country = metadata.get("country", "all")
                if country and country != "all" and country != params["country"]:
                    # Exclure les règles spécifiques à d'autres pays (ex: Belgique pour France)
                    continue
            
            filtered_docs.append(doc)
        
        return filtered_docs
    
    def _retrieve_all_applicable_rules(self, params: Dict[str, Any]) -> List[Document]:
        """Récupérer TOUTES les règles applicables via filtres de métadonnées"""
        print(f"🔍 Retrieving ALL applicable rules for {params}")
        
        all_docs = []
        
        # 1. Récupérer TOUTES les règles générales (Section 1)
        section1_docs = self.vectorstore.similarity_search(
            "règles générales section 1",
            k=20,  # Section 1 a 17 règles
            filter={"section_id": "1"}
        )
        all_docs.extend(section1_docs)
        print(f"  ✓ Section 1 (Règles générales): {len(section1_docs)} documents")
        
        # 2. Récupérer structure document (Sections 2, 3, 5)
        for section_id in ["2", "3", "5"]:
            section_docs = self.vectorstore.similarity_search(
                f"section {section_id}",
                k=10,
                filter={"section_id": section_id}
            )
            all_docs.extend(section_docs)
            print(f"  ✓ Section {section_id}: {len(section_docs)} documents")
        
        # 3. Récupérer règles de contenu (Section 4.0)
        section40_docs = self.vectorstore.similarity_search(
            "règles générales contenu section 4.0",
            k=10,
            filter={"section_id": "4"}
        )
        all_docs.extend(section40_docs)
        print(f"  ✓ Section 4.0 (Contenu): {len(section40_docs)} documents")
        
        # 4. Récupérer règles ESG (Section 4.1)
        esg_docs = self.vectorstore.similarity_search(
            "ESG approche section 4.1",
            k=10,
            filter={"section_id": "4.1"}
        )
        all_docs.extend(esg_docs)
        print(f"  ✓ Section 4.1 (ESG): {len(esg_docs)} documents")
        
        # 5. Récupérer règles mentions valeurs (Section 4.2)
        securities_docs = self.vectorstore.similarity_search(
            "mentions valeurs section 4.2",
            k=20,  # 11 prohibited + 7 permitted
            filter={"section_id": "4.2"}
        )
        all_docs.extend(securities_docs)
        print(f"  ✓ Section 4.2 (Valeurs): {len(securities_docs)} documents")
        
        # 6. Récupérer règles performances (Section 4.3) - LA PLUS GROSSE
        perf_docs = self.vectorstore.similarity_search(
            "performances règles section 4.3",
            k=50,  # Section 4.3 a ~50 sous-règles
            filter={"section_id": "4.3"}
        )
        all_docs.extend(perf_docs)
        print(f"  ✓ Section 4.3 (Performances): {len(perf_docs)} documents")
        
        # 7. Récupérer disclaimers applicables
        if params["client_type"]:
            disclaimer_docs = self.vectorstore.similarity_search(
                f"disclaimer {params['client_type']}",
                k=10,
                filter={"$and": [{"type": "disclaimer"}, {"client_type": params["client_type"]}]}
            )
            all_docs.extend(disclaimer_docs)
            print(f"  ✓ Disclaimers ({params['client_type']}): {len(disclaimer_docs)} documents")
        
        # 8. Récupérer règles pays spécifiques
        if params["country"]:
            country_docs = self.vectorstore.similarity_search(
                f"règles {params['country']}",
                k=10,
                filter={"country": params["country"]}
            )
            all_docs.extend(country_docs)
            print(f"  ✓ Règles pays ({params['country']}): {len(country_docs)} documents")
        
        # 9. Récupérer exemples et mappings
        example_docs = self.vectorstore.similarity_search(
            "exemple scénario",
            k=5,
            filter={"type": "example"}
        )
        all_docs.extend(example_docs)
        print(f"  ✓ Exemples: {len(example_docs)} documents")
        
        # Dédupliquer par doc_id
        seen_ids = set()
        unique_docs = []
        for doc in all_docs:
            doc_id = doc.metadata.get('doc_id')
            if doc_id and doc_id not in seen_ids:
                seen_ids.add(doc_id)
                unique_docs.append(doc)
        
        print(f"📊 Total documents récupérés: {len(unique_docs)} (après déduplication)")
        
        # Filtrer les règles non applicables
        filtered_docs = self._filter_applicable_rules(unique_docs, params)
        print(f"🔍 Documents après filtrage: {len(filtered_docs)} (règles non applicables retirées)")
        
        return filtered_docs
    
    def _retrieve_similarity_only(self, question: str, k: int = 20) -> List[Document]:
        """Récupération par similarité uniquement"""
        print(f"🔍 Similarity search with k={k}")
        docs = self.vectorstore.similarity_search(question, k=k)
        print(f"📊 Retrieved: {len(docs)} documents")
        return docs
    
    def query(self, question: str, filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Query the RAG system avec approche hybride
        
        Args:
            question: User question
            filters: Optional metadata filters
        
        Returns:
            Dictionary with answer and source documents
        """
        print(f"\n💬 Query: {question}")
        
        # Extraire paramètres de la question
        params = self._extract_query_params(question)
        print(f"🔍 Query params: {params}")
        
        # Choisir stratégie de récupération
        if params["is_broad_query"] or RETRIEVAL_STRATEGY == "metadata":
            # APPROCHE HYBRIDE : récupérer TOUTES les règles applicables
            source_docs = self._retrieve_all_applicable_rules(params)
        elif RETRIEVAL_STRATEGY == "hybrid":
            # Combinaison : metadata + similarity
            metadata_docs = self._retrieve_all_applicable_rules(params)
            similarity_docs = self._retrieve_similarity_only(question, k=20)
            
            # Fusionner et dédupliquer
            all_docs = metadata_docs + similarity_docs
            seen_ids = set()
            source_docs = []
            for doc in all_docs:
                doc_id = doc.metadata.get('doc_id')
                if doc_id and doc_id not in seen_ids:
                    seen_ids.add(doc_id)
                    source_docs.append(doc)
        else:
            # APPROCHE SIMILARITY uniquement
            source_docs = self._retrieve_similarity_only(question, k=TOP_K_RESULTS)
        
        # Construire contexte pour LLM
        context = self._build_context(source_docs, params)
        
        # Générer réponse avec LLM
        print("🤖 Generating answer with Claude...")
        answer = self._generate_answer(question, context, params)
        
        # Format response
        response = {
            "question": question,
            "answer": answer,
            "sources": self._format_sources(source_docs),
            "num_sources": len(source_docs),
            "params": params
        }
        
        return response
    
    def _build_context(self, documents: List[Document], params: Dict[str, Any]) -> str:
        """Construire le contexte à partir des documents récupérés"""
        context_parts = []
        
        # Organiser par section
        docs_by_section = {}
        for doc in documents:
            section_id = doc.metadata.get('section_id', 'other')
            if section_id not in docs_by_section:
                docs_by_section[section_id] = []
            docs_by_section[section_id].append(doc)
        
        # Construire contexte structuré
        for section_id in sorted(docs_by_section.keys(), key=lambda x: str(x)):
            section_docs = docs_by_section[section_id]
            context_parts.append(f"\n{'='*60}")
            context_parts.append(f"SECTION {section_id} ({len(section_docs)} règles)")
            context_parts.append('='*60)
            
            for doc in section_docs[:20]:  # Limiter à 20 docs par section pour ne pas surcharger
                context_parts.append(f"\n[{doc.metadata.get('doc_id', 'unknown')}]")
                context_parts.append(doc.page_content[:500])  # Limiter taille
        
        return "\n".join(context_parts)
    
    def _generate_answer(self, question: str, context: str, params: Dict[str, Any]) -> str:
        """Générer réponse avec Claude"""
        
        # Adapter prompt selon type de question
        if params["is_broad_query"]:
            instruction = """
            QUESTION LARGE DÉTECTÉE : Fournis une réponse EXHAUSTIVE et COMPLÈTE.
            
            Structure ta réponse en 11 sections numérotées:
            1. DISCLAIMERS OBLIGATOIRES (IDs exacts)
            2. STRUCTURE DU DOCUMENT (Sections 2, 3, 5)
            3. RÈGLES GÉNÉRALES (Section 1 - liste TOUTES les 1.1 à 1.17)
            4. RÈGLES DE CONTENU (Section 4.0)
            5. RÈGLES ESG (Section 4.1)
            6. RÈGLES MENTIONS VALEURS (Section 4.2)
            7. RÈGLES DE PERFORMANCES (Section 4.3)
            8. RÈGLES SPÉCIFIQUES PRODUITS
            9. RÈGLES DE FORMATAGE
            10. RÈGLES PAR PAYS
            11. CHECKLIST DE VALIDATION (50+ points)
            
            Pour chaque règle, indique:
            - ID exact (ex: 1.1, 4.3.funds_rules.minimum_duration)
            - Description brève
            - Caractère obligatoire (mandatory: true/false)
            """
        else:
            instruction = """
            QUESTION SPÉCIFIQUE : Réponds directement et précisément.
            Cite les règles et disclaimers pertinents avec leurs IDs.
            """
        
        # Construire messages
        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=f"""
{instruction}

CONTEXTE DE CONFORMITÉ:
{context}

QUESTION: {question}

Réponds de manière structurée en citant les règles et références exactes.
""")
        ]
        
        # Générer réponse
        response = self.llm.invoke(messages)
        
        return response.content
    
    def _format_sources(self, documents: List[Document]) -> List[Dict[str, Any]]:
        """Format source documents for display"""
        sources = []
        
        for doc in documents:
            source = {
                "type": doc.metadata.get("type", "unknown"),
                "id": doc.metadata.get("doc_id", "unknown"),
                "source_file": doc.metadata.get("source_file", "unknown"),
                "source_path": doc.metadata.get("source_path", "unknown"),
                "preview": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
            }
            
            # Add type-specific metadata
            if doc.metadata.get("rule_id"):
                source["rule_id"] = doc.metadata["rule_id"]
                source["mandatory"] = doc.metadata.get("mandatory", False)
            
            if doc.metadata.get("disclaimer_id"):
                source["disclaimer_id"] = doc.metadata["disclaimer_id"]
                source["language"] = doc.metadata.get("language")
            
            if doc.metadata.get("country"):
                source["country"] = doc.metadata["country"]
            
            sources.append(source)
        
        return sources
    
    def search_only(self, question: str, k: int = 5, filters: Optional[Dict] = None) -> List[Document]:
        """Search without LLM generation (faster)"""
        if filters:
            docs = self.vectorstore.similarity_search(question, k=k, filter=filters)
        else:
            docs = self.vectorstore.similarity_search(question, k=k)
        
        return docs
    
    def get_rule(self, rule_id: str) -> Optional[Dict[str, Any]]:
        """Get specific rule by ID"""
        docs = self.vectorstore.similarity_search(
            f"règle {rule_id}",
            k=1,
            filter={"$and": [{"type": "rule"}, {"rule_id": rule_id}]}
        )
        
        if docs:
            return {
                "content": docs[0].page_content,
                "metadata": docs[0].metadata
            }
        return None
    
    def get_disclaimer(self, disclaimer_id: str) -> Optional[Dict[str, Any]]:
        """Get specific disclaimer by ID"""
        docs = self.vectorstore.similarity_search(
            disclaimer_id,
            k=1,
            filter={"disclaimer_id": disclaimer_id}
        )
        
        if docs:
            return {
                "content": docs[0].page_content,
                "metadata": docs[0].metadata
            }
        return None
    
    def validate_document(self, 
                         document_type: str,
                         client_type: str,
                         language: str,
                         country: str) -> Dict[str, Any]:
        """Get validation requirements for a document"""
        query = f"""
        Document: {document_type}
        Client: {client_type}
        Langue: {language}
        Pays: {country}
        
        Quelles sont les règles obligatoires et les disclaimers requis?
        """
        
        return self.query(query)

def main():
    """Interactive CLI for RAG system"""
    import sys
    
    print("=" * 60)
    print("ODDO BHF Compliance RAG System")
    print("=" * 60)
    
    # Initialize RAG
    rag = ComplianceRAG()
    
    print("\n✅ System ready!")
    print("\nCommandes spéciales:")
    print("  /rule <id>       - Afficher une règle spécifique")
    print("  /disclaimer <id> - Afficher un disclaimer spécifique")
    print("  /validate        - Valider un document")
    print("  /search          - Recherche sans LLM")
    print("  /quit            - Quitter")
    print("\nOu posez directement votre question...")
    
    while True:
        try:
            print("\n" + "-" * 60)
            question = input("\n💬 Question: ").strip()
            
            if not question:
                continue
            
            if question == "/quit":
                print("👋 Au revoir!")
                break
            
            # Handle special commands
            if question.startswith("/rule "):
                rule_id = question.split(" ", 1)[1]
                result = rag.get_rule(rule_id)
                if result:
                    print(f"\n📋 Règle {rule_id}:")
                    print(result["content"])
                else:
                    print(f"❌ Règle {rule_id} non trouvée")
                continue
            
            if question.startswith("/disclaimer "):
                disclaimer_id = question.split(" ", 1)[1]
                result = rag.get_disclaimer(disclaimer_id)
                if result:
                    print(f"\n📄 Disclaimer {disclaimer_id}:")
                    print(result["content"])
                else:
                    print(f"❌ Disclaimer {disclaimer_id} non trouvé")
                continue
            
            if question == "/validate":
                print("\nValidation de document:")
                doc_type = input("  Type de document: ")
                client_type = input("  Type de client: ")
                language = input("  Langue: ")
                country = input("  Pays: ")
                
                result = rag.validate_document(doc_type, client_type, language, country)
                print(f"\n✅ Réponse:\n{result['answer']}")
                print(f"\n📚 Sources: {result['num_sources']} documents")
                continue
            
            if question == "/search":
                search_query = input("  Recherche: ")
                docs = rag.search_only(search_query, k=5)
                print(f"\n📚 {len(docs)} résultats:")
                for i, doc in enumerate(docs, 1):
                    print(f"\n  {i}. {doc.metadata.get('type')} - {doc.metadata.get('doc_id')}")
                    print(f"     {doc.page_content[:150]}...")
                continue
            
            # Regular query
            result = rag.query(question)
            
            print(f"\n✅ Réponse:")
            print(result['answer'])
            
            print(f"\n📚 Sources ({result['num_sources']}):")
            for i, source in enumerate(result['sources'][:10], 1):  # Limiter affichage à 10
                print(f"\n  {i}. {source['type']} - {source['id']}")
                print(f"     Fichier: {source['source_file']}")
                if source.get('rule_id'):
                    print(f"     Règle: {source['rule_id']} (mandatory: {source.get('mandatory')})")
                if source.get('disclaimer_id'):
                    print(f"     Disclaimer: {source['disclaimer_id']} ({source.get('language')})")
        
        except KeyboardInterrupt:
            print("\n\n👋 Au revoir!")
            break
        except Exception as e:
            print(f"\n❌ Erreur: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    main()