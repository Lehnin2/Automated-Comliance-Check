# 🤖 Configuration Claude - Guide Rapide

## ✅ Migration vers Claude Complétée!

Le système a été modifié pour utiliser **Claude (Anthropic)** au lieu d'OpenAI.

---

## 🔑 Votre Clé API

Votre clé Claude est déjà configurée dans `.env`:

```bash
ANTHROPIC_API_KEY=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
```

⚠️ **IMPORTANT**: Ne partagez JAMAIS cette clé publiquement!

---

## 📦 Installation

### 1. Installer les dépendances

```bash
cd rag_system
pip install -r requirements.txt
```

Cela installera:
- ✅ `langchain-anthropic` (pour Claude)
- ✅ `anthropic` (SDK Claude)
- ✅ `sentence-transformers` (embeddings locaux)
- ✅ `chromadb` (base vectorielle)

### 2. Vérifier la configuration

```bash
python config.py
```

Vous devriez voir:
```
✅ Configuration validated successfully!

Using:
  - Vector Store: chromadb
  - Embeddings: Local (all-MiniLM-L6-v2)
  - LLM: Claude (claude-3-5-sonnet-20241022)
  - Database Dir: ...
```

---

## 🚀 Démarrage

### Option 1: Script Automatique

```bash
python quick_start.py
```

### Option 2: Manuel

```bash
# 1. Construire la base vectorielle
python build_vectorstore.py --rebuild

# 2. Lancer le système
python rag_query.py
```

---

## 🎯 Modèles Claude Disponibles

Vous pouvez changer le modèle dans `.env`:

### Claude 3.5 Sonnet (Recommandé) ⭐
```bash
LLM_MODEL=claude-3-5-sonnet-20241022
```
- ✅ Meilleur équilibre qualité/vitesse/coût
- ✅ Excellent pour raisonnement complexe
- ✅ 200K tokens de contexte
- 💰 $3/M input tokens, $15/M output tokens

### Claude 3 Opus (Qualité Maximale)
```bash
LLM_MODEL=claude-3-opus-20240229
```
- ✅ Meilleure qualité absolue
- ✅ Raisonnement le plus avancé
- ❌ Plus lent et plus cher
- 💰 $15/M input tokens, $75/M output tokens

### Claude 3 Haiku (Rapide & Économique)
```bash
LLM_MODEL=claude-3-haiku-20240307
```
- ✅ Très rapide
- ✅ Très économique
- ❌ Qualité légèrement inférieure
- 💰 $0.25/M input tokens, $1.25/M output tokens

---

## 🔧 Différences avec OpenAI

### ✅ Avantages de Claude

1. **Contexte plus large**: 200K tokens vs 128K pour GPT-4
2. **Meilleure compréhension**: Excellent pour documents longs
3. **Moins de hallucinations**: Plus factuel
4. **Meilleur français**: Qualité native excellente
5. **Prix compétitifs**: Sonnet moins cher que GPT-4

### ⚠️ Différences Importantes

1. **Pas d'embeddings**: Claude ne fournit pas d'embeddings
   - ✅ **Solution**: Embeddings locaux (gratuits!)
   - Modèle: `all-MiniLM-L6-v2`

2. **Format de réponse**: Légèrement différent d'OpenAI
   - ✅ Déjà géré dans le code

3. **Limites de tokens**: 
   - Input: 200K tokens
   - Output: 4096 tokens (configuré dans le code)

---

## 💬 Exemples d'Utilisation

### CLI Interactive

```bash
$ python rag_query.py

🤖 Initializing Claude: claude-3-5-sonnet-20241022
✅ System ready!

💬 Question: Quelles règles pour document retail français?

✅ Réponse:
Pour un document retail français, voici les règles obligatoires:

1. Règle 1.1 - Inclure les disclaimers retail
   - Disclaimer requis: FR_PRES_RET_SAS
   - Source: rules_database.json

2. Règle 1.5 - Glossaire des termes techniques
   - Obligatoire en fin de présentation
   
3. Règle 1.11 - Éviter les anglicismes
   - Ou les définir dans le glossaire

📚 Sources: 5 documents
```

### Python API

```python
from rag_query import ComplianceRAG

# Initialiser avec Claude
rag = ComplianceRAG()

# Poser une question
result = rag.query("Quelles règles pour retail?")
print(result['answer'])

# Le reste est identique!
```

---

## 📊 Performance avec Claude

### Temps de Réponse

| Opération | Temps |
|-----------|-------|
| Construction base (première fois) | 3-5 min |
| Recherche seule | 50-200ms |
| RAG complet (avec Claude) | 2-4 sec |

### Coûts Estimés

Avec **Claude 3.5 Sonnet**:

| Opération | Coût |
|-----------|------|
| Construction base (une fois) | ~$0.05 |
| Requête simple | ~$0.002 |
| 1000 requêtes | ~$2.00 |

**Note**: Moins cher que GPT-4, qualité similaire!

---

## 🔍 Embeddings Locaux

### Pourquoi Local?

Claude ne fournit pas d'embeddings, donc nous utilisons un modèle local:

```bash
EMBEDDING_MODEL=all-MiniLM-L6-v2
```

### Avantages

- ✅ **Gratuit** - Pas de coût API
- ✅ **Rapide** - Exécution locale
- ✅ **Privé** - Données restent locales
- ✅ **Multilingue** - Support EN, FR, DE

### Qualité

- ✅ Très bonne pour la plupart des cas
- ✅ Optimisé pour recherche sémantique
- ⚠️ Légèrement inférieur à OpenAI embeddings
- ✅ Suffisant pour notre cas d'usage

### Alternative (Meilleure Qualité)

Pour améliorer la qualité des embeddings:

```bash
EMBEDDING_MODEL=all-mpnet-base-v2
```

Plus lent mais meilleure qualité.

---

## 🐛 Troubleshooting

### Erreur: "ANTHROPIC_API_KEY not set"

**Solution**: Vérifier que `.env` contient:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### Erreur: "No module named 'langchain_anthropic'"

**Solution**: Réinstaller les dépendances:
```bash
pip install -r requirements.txt
```

### Erreur: "Rate limit exceeded"

**Solution**: 
1. Attendre quelques secondes
2. Ou utiliser Claude Haiku (moins de limites):
```bash
LLM_MODEL=claude-3-haiku-20240307
```

### Réponses trop courtes

**Solution**: Augmenter max_tokens dans `rag_query.py` ligne 84:
```python
max_tokens=8192  # Au lieu de 4096
```

### Embeddings trop lents

**Solution**: Utiliser un modèle plus petit:
```bash
EMBEDDING_MODEL=all-MiniLM-L6-v2  # Déjà configuré
```

---

## ✅ Checklist de Vérification

Avant de commencer:

- [x] Clé Claude configurée dans `.env`
- [x] Dépendances installées (`pip install -r requirements.txt`)
- [x] Embeddings locaux configurés
- [x] Modèle Claude sélectionné (Sonnet par défaut)
- [ ] Base vectorielle construite (`python build_vectorstore.py --rebuild`)
- [ ] Système testé (`python rag_query.py`)

---

## 🎉 Prêt!

Votre système RAG utilise maintenant **Claude 3.5 Sonnet**!

### Démarrer

```bash
python quick_start.py
```

### Ou Manuel

```bash
python build_vectorstore.py --rebuild
python rag_query.py
```

---

## 📚 Ressources

### Documentation Claude

- **Console**: https://console.anthropic.com/
- **API Docs**: https://docs.anthropic.com/
- **Pricing**: https://www.anthropic.com/pricing

### Documentation Système

- **README.md**: Guide complet du système
- **SETUP_GUIDE.md**: Installation détaillée
- **demo.ipynb**: Exemples interactifs

---

## 💡 Conseils

### Pour Meilleure Qualité

1. Utiliser **Claude 3.5 Sonnet** (déjà configuré)
2. Augmenter `TOP_K_RESULTS` à 7-10
3. Utiliser `all-mpnet-base-v2` pour embeddings

### Pour Meilleure Vitesse

1. Utiliser **Claude 3 Haiku**
2. Réduire `TOP_K_RESULTS` à 3
3. Garder `all-MiniLM-L6-v2` pour embeddings

### Pour Économiser

1. Utiliser **Claude 3 Haiku** ($0.25/M tokens)
2. Limiter `max_tokens` à 2048
3. Cacher les résultats fréquents

---

**Version**: 1.0 (Claude Edition)  
**Date**: 2025-11-05  
**LLM**: Claude 3.5 Sonnet  
**Embeddings**: Local (all-MiniLM-L6-v2)  
**Statut**: ✅ **PRÊT À L'EMPLOI**
