# 🤖 ODDO BHF Compliance RAG System

Système de Retrieval-Augmented Generation (RAG) pour la validation de conformité des documents commerciaux ODDO BHF Asset Management.

## 🎯 Fonctionnalités

- ✅ **Recherche sémantique** dans 350+ documents de conformité
- ✅ **Réponses contextuelles** avec citations de règles et disclaimers
- ✅ **Support multilingue** (EN, FR, DE)
- ✅ **Validation automatique** de documents
- ✅ **Vérification pays** d'enregistrement (67 fonds, 21 pays)
- ✅ **Interface CLI** interactive
- ✅ **API Python** pour intégration

## 📦 Installation

### 1. Prérequis

```bash
Python 3.9+
pip
```

### 2. Installation des dépendances

```bash
cd rag_system
pip install -r requirements.txt
```

### 3. Configuration

Copier le fichier d'exemple et configurer:

```bash
cp .env.example .env
```

Éditer `.env` et ajouter votre clé API OpenAI:

```bash
OPENAI_API_KEY=sk-your-key-here
```

**Ou utiliser des embeddings locaux (gratuit, pas de clé API):**

```bash
USE_LOCAL_EMBEDDINGS=true
```

## 🚀 Démarrage Rapide

### Étape 1: Construire la base de données vectorielle

```bash
python build_vectorstore.py --rebuild --test
```

Cela va:
- Charger les 6 fichiers JSON
- Créer ~350 documents
- Générer les embeddings
- Construire l'index vectoriel (ChromaDB par défaut)
- Exécuter des requêtes de test

**Temps estimé**: 2-5 minutes (selon embeddings local/OpenAI)

### Étape 2: Lancer le système RAG

```bash
python rag_query.py
```

Interface interactive CLI:

```
💬 Question: Quelles règles pour un document retail français?

✅ Réponse:
Pour un document retail français, voici les règles obligatoires:

1. Règle 1.1 - Inclure les disclaimers retail
   - Disclaimer requis: FR_PRES_RET_SAS
   - Source: rules_database.json

2. Règle 1.5 - Glossaire des termes techniques
   - Obligatoire en fin de présentation
   
3. Règle 1.11 - Éviter les anglicismes
   - Ou les définir dans le glossaire

📚 Sources (5):
  1. rule - rule_1.1 (mandatory: True)
  2. disclaimer - FR_PRES_RET_SAS (fr)
  3. mapping - mapping_1.1
  ...
```

## 💻 Utilisation

### Mode Interactif (CLI)

```bash
python rag_query.py
```

**Commandes disponibles:**

```bash
# Poser une question
💬 Question: Comment valider un document pour la Belgique?

# Afficher une règle spécifique
💬 Question: /rule 1.9

# Afficher un disclaimer
💬 Question: /disclaimer FR_PRES_RET_SAS

# Valider un document
💬 Question: /validate
  Type de document: OBAM_PRESENTATION
  Type de client: retail
  Langue: fr
  Pays: FR

# Recherche simple (sans LLM)
💬 Question: /search
  Recherche: performances backtestées

# Quitter
💬 Question: /quit
```

### Mode Programmatique (Python)

```python
from rag_query import ComplianceRAG

# Initialiser le système
rag = ComplianceRAG()

# Poser une question
result = rag.query("Quelles règles pour document retail français?")
print(result['answer'])
print(f"Sources: {result['num_sources']}")

# Recherche avec filtres
docs = rag.search_only(
    "disclaimers retail",
    k=5,
    filters={"type": "disclaimer", "client_type": "NON_PROFESSIONAL"}
)

# Récupérer une règle spécifique
rule = rag.get_rule("1.1")
print(rule['content'])

# Récupérer un disclaimer
disclaimer = rag.get_disclaimer("FR_PRES_RET_SAS")
print(disclaimer['content'])

# Valider un document
validation = rag.validate_document(
    document_type="OBAM_PRESENTATION",
    client_type="retail",
    language="fr",
    country="FR"
)
print(validation['answer'])
```

## 🔧 Configuration Avancée

### Choix du Vector Store

**ChromaDB (par défaut, recommandé)**
```bash
VECTOR_STORE=chromadb
CHROMA_PERSIST_DIR=./chroma_db
```

**FAISS (plus rapide, pas de persistance)**
```bash
VECTOR_STORE=faiss
```

**Pinecone (cloud, scalable)**
```bash
VECTOR_STORE=pinecone
PINECONE_API_KEY=your-key
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=oddo-compliance
```

### Choix des Embeddings

**OpenAI (meilleur qualité)**
```bash
USE_LOCAL_EMBEDDINGS=false
EMBEDDING_MODEL=text-embedding-3-small  # ou text-embedding-3-large
```

**Local (gratuit, pas de clé API)**
```bash
USE_LOCAL_EMBEDDINGS=true
EMBEDDING_MODEL=all-MiniLM-L6-v2  # ou all-mpnet-base-v2
```

### Paramètres de Retrieval

```bash
# Nombre de documents retournés
TOP_K_RESULTS=5

# Seuil de similarité (0-1)
SIMILARITY_THRESHOLD=0.7

# Taille des chunks
CHUNK_SIZE=500
CHUNK_OVERLAP=50
```

### Choix du LLM

```bash
# OpenAI
LLM_MODEL=gpt-4-turbo-preview  # ou gpt-3.5-turbo
LLM_TEMPERATURE=0.1

# Pour utiliser un autre LLM (Claude, Llama, etc.)
# Modifier rag_query.py ligne 50-55
```

## 📊 Structure des Données

### Documents Indexés

| Type | Nombre | Source |
|------|--------|--------|
| **Règles** | ~150 | rules_database.json |
| **Disclaimers** | ~40 | disclaimers-glossary.json |
| **Enregistrements** | ~200 | registration-countries.json |
| **Mappings** | 12 | compliance-mapping.json |
| **Validations** | ~50 | validation-schema.json |
| **Exemples** | 14 | usage-examples.json |
| **Total** | ~470 | |

### Métadonnées Indexées

Chaque document contient:
- `type`: rule, disclaimer, registration, mapping, validation, example, faq
- `doc_id`: Identifiant unique
- `source_file`: Fichier JSON source
- `source_path`: Chemin JSON exact

**Métadonnées spécifiques par type:**

**Rules:**
- `rule_id`, `category`, `applicability`, `mandatory`, `country`

**Disclaimers:**
- `disclaimer_id`, `language`, `client_type`, `management_company`

**Registrations:**
- `fund_name`, `share_class`, `isin`, `registered_countries`

## 🎯 Exemples de Requêtes

### Questions Générales

```
Q: Quelles sont les règles obligatoires pour un document retail?
Q: Comment valider un document pour la Belgique?
Q: Quels disclaimers pour un client professionnel allemand?
Q: Règles pour afficher des performances?
Q: Comment vérifier l'enregistrement d'un fonds?
```

### Questions Spécifiques

```
Q: Puis-je afficher des performances backtestées?
Q: Le fonds ODDO BHF Active Small Cap est-il enregistré en Allemagne?
Q: Quelle est la règle 1.9?
Q: Montrer le disclaimer FR_PRES_RET_SAS
Q: Règles spécifiques pour la Suisse
```

### Validation de Documents

```
Q: Valider présentation retail française pour ODDO BHF Avenir Europe
Q: Checklist pour document professionnel allemand
Q: Exigences FSMA pour Belgique
Q: Disclaimers requis pour stratégie professionnelle
```

## 🔍 Filtres Disponibles

Recherche avec filtres pour affiner les résultats:

```python
# Par type
filters = {"type": "rule"}
filters = {"type": "disclaimer"}

# Par langue
filters = {"language": "fr"}

# Par type de client
filters = {"client_type": "NON_PROFESSIONAL"}

# Par pays
filters = {"country": "BE"}

# Règles obligatoires uniquement
filters = {"type": "rule", "mandatory": True}

# Combinaisons
filters = {
    "type": "disclaimer",
    "language": "fr",
    "client_type": "NON_PROFESSIONAL"
}
```

## 📈 Performance

### Temps de Réponse

- **Recherche seule**: 50-200ms
- **RAG complet (avec LLM)**: 1-3 secondes
- **Construction initiale**: 2-5 minutes

### Ressources

- **Mémoire**: ~500MB (ChromaDB + embeddings)
- **Disque**: ~100MB (base vectorielle)
- **CPU**: Minimal (sauf embeddings locaux)

## 🛠️ Développement

### Ajouter de Nouveaux Documents

1. Ajouter/modifier les fichiers JSON dans `../database/`
2. Reconstruire la base vectorielle:

```bash
python build_vectorstore.py --rebuild
```

### Personnaliser le Prompt

Éditer `rag_query.py` ligne 20-45 (SYSTEM_PROMPT)

### Ajouter un Nouveau Vector Store

Implémenter dans `build_vectorstore.py`:

```python
def _build_custom(self, documents):
    # Votre implémentation
    pass
```

## 🐛 Troubleshooting

### Erreur: "OPENAI_API_KEY not set"

**Solution**: Ajouter la clé dans `.env` ou utiliser embeddings locaux:
```bash
USE_LOCAL_EMBEDDINGS=true
```

### Erreur: "ChromaDB not found"

**Solution**: Reconstruire la base:
```bash
python build_vectorstore.py --rebuild
```

### Résultats non pertinents

**Solution 1**: Augmenter TOP_K_RESULTS dans `.env`
```bash
TOP_K_RESULTS=10
```

**Solution 2**: Utiliser des filtres:
```python
result = rag.query(question, filters={"type": "rule"})
```

**Solution 3**: Utiliser un meilleur modèle d'embeddings:
```bash
EMBEDDING_MODEL=text-embedding-3-large
```

### Performance lente

**Solution 1**: Utiliser FAISS au lieu de ChromaDB
```bash
VECTOR_STORE=faiss
```

**Solution 2**: Réduire TOP_K_RESULTS
```bash
TOP_K_RESULTS=3
```

**Solution 3**: Utiliser GPT-3.5 au lieu de GPT-4
```bash
LLM_MODEL=gpt-3.5-turbo
```

## 📚 Documentation Complète

- **Guide complet**: `../database/README.md`
- **Démarrage rapide**: `../database/QUICK-START.md`
- **Intégration**: `../database/INTEGRATION-SUMMARY.md`
- **Exemples**: `../database/usage-examples.json`

## 🤝 Support

Pour toute question:
1. Consulter `../database/usage-examples.json` (9 scénarios)
2. Consulter `../database/INDEX.md` (navigation complète)
3. Tester avec `/search` pour recherche simple

## ✅ Checklist de Déploiement

- [ ] Python 3.9+ installé
- [ ] Dépendances installées (`pip install -r requirements.txt`)
- [ ] Fichier `.env` configuré
- [ ] Clé API OpenAI ajoutée (ou USE_LOCAL_EMBEDDINGS=true)
- [ ] Base vectorielle construite (`python build_vectorstore.py --rebuild`)
- [ ] Tests exécutés (`--test`)
- [ ] Système lancé (`python rag_query.py`)
- [ ] Requêtes de test validées

## 🎉 Prêt à l'Emploi!

Le système RAG est maintenant opérationnel. Vous pouvez:

✅ Poser des questions en langage naturel  
✅ Valider des documents automatiquement  
✅ Rechercher des règles et disclaimers  
✅ Vérifier les enregistrements par pays  
✅ Intégrer dans vos applications Python  

**Commencez maintenant:**

```bash
python rag_query.py
```

---

**Version**: 1.0  
**Date**: 2025-11-05  
**Système**: ODDO BHF Compliance RAG
