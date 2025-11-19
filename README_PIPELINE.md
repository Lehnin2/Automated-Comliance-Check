# 🚀 Pipeline Complet - Extraction et Vérification de Conformité

## 📋 Vue d'Ensemble

Le script `pipeline.py` est un pipeline unifié qui automatise tout le processus :
1. ✅ Extraction de la présentation `.pptx` (utilise `test.py`)
2. ✅ Chargement des métadonnées (`metadata.json`)
3. ✅ Extraction du prospectus (`prospectus.docx`)
4. ✅ Vérification complète de conformité
5. ✅ Rapport détaillé des violations

---

## 🎯 Utilisation

### Syntaxe de base

```bash
python pipeline.py <presentation.pptx> <metadata.json> <prospectus.docx>
```

**Les 3 fichiers peuvent être fournis en paramètres :**
- `presentation.pptx` - **OBLIGATOIRE** : Présentation à vérifier
- `metadata.json` - **OPTIONNEL** : Métadonnées du document
- `prospectus.docx` - **OPTIONNEL** : Prospectus du fonds

### Exemples

#### Exemple 1 : Avec tous les 3 fichiers (RECOMMANDÉ)
```bash
python pipeline.py presentation.pptx metadata.json prospectus.docx
```

#### Exemple 2 : Avec seulement le PPTX
```bash
python pipeline.py presentation.pptx
```
⚠️ Les vérifications prospectus seront ignorées si le prospectus n'est pas fourni.

#### Exemple 3 : Avec PPTX et métadonnées
```bash
python pipeline.py presentation.pptx metadata.json
```

#### Exemple 4 : Avec PPTX et prospectus (sans métadonnées)
```bash
python pipeline.py presentation.pptx "" prospectus.docx
```
Note: Utilisez `""` pour sauter un paramètre optionnel.

---

## 📁 Fichiers

### Fichiers Requis
- `.env` - Contient `TOKENFACTORY_API_KEY` (obligatoire)
- `presentation.pptx` - Présentation à vérifier (obligatoire)

### Fichiers Optionnels
- `metadata.json` - Métadonnées supplémentaires
- `prospectus.docx` - Prospectus du fonds

### Fichiers Générés
- `extracted_data_<nom>.json` - Données extraites du PPTX

---

## 📊 Format de `metadata.json`

```json
{
  "Société de Gestion": "ODDO BHF ASSET MANAGEMENT SAS",
  "Est ce que le produit fait partie de la Sicav d'Oddo": false,
  "Le client est-il un professionnel": false,
  "Le document fait-il référence à une nouvelle Stratégie": false,
  "Le document fait-il référence à un nouveau Produit": true
}
```

**Mapping automatique :**
- `"Le client est-il un professionnel"` → `document_metadata.client_type` (retail/professional)
- `"Société de Gestion"` → `document_metadata.management_company`

---

## 🔄 Workflow du Pipeline

```
1. INPUT
   ├── presentation.pptx (requis)
   ├── metadata.json (optionnel)
   └── prospectus.docx (optionnel)
        ↓
2. EXTRACTION PPTX
   └── Utilise test.py pour extraire les données
        ↓
3. CHARGEMENT MÉTADONNÉES
   └── Fusionne metadata.json avec les données extraites
        ↓
4. EXTRACTION PROSPECTUS
   └── Analyse prospectus.docx avec IA (si disponible)
        ↓
5. VÉRIFICATION DE CONFORMITÉ
   ├── Registration
   ├── Disclaimers
   ├── Structure
   ├── Règles générales
   ├── Valeurs/Titres
   ├── ESG
   ├── Performance
   └── Prospectus
        ↓
6. RAPPORT
   └── Liste détaillée des violations
```

---

## 📋 Rapport de Conformité

Le pipeline génère un rapport détaillé avec :

### Vérifications Effectuées
1. ✅ **Registration** - Vérification des pays autorisés
2. ✅ **Disclaimers** - Vérification des disclaimers requis
3. ✅ **Structure** - Vérification de la structure du document
4. ✅ **General Rules** - Règles générales
5. ✅ **Securities/Values** - Vérification des valeurs
6. ✅ **ESG** - Règles ESG
7. ✅ **Performance** - Règles de performance
8. ✅ **Prospectus** - Conformité avec le prospectus (si disponible)

### Format du Rapport

Pour chaque violation :
```
======================================================================
[SEVERITY] TYPE Violation #N
======================================================================
📋 Règle: RULE_CODE: Description
⚠️  Problème: Description du problème
📍 Localisation: Slide - Location

📄 Preuve:
   Détails de la violation
```

**Résumé :**
- Nombre total de violations
- Violations par type (STRUCTURE, PROSPECTUS, etc.)
- Violations par sévérité (CRITICAL, MAJOR, WARNING)

---

## ⚙️ Configuration

### Variables d'Environnement (.env)

```env
TOKENFACTORY_API_KEY=sk-xxxxxxxxxxxxx
```

---

## 📝 Exemple Complet

```bash
# Fichiers présents :
# - presentation.pptx
# - metadata.json
# - prospectus.docx
# - .env

python pipeline.py presentation.pptx metadata.json prospectus.docx
```

**Sortie :**
```
======================================================================
🚀 DÉMARRAGE DU PIPELINE
======================================================================
📄 Présentation: presentation.pptx
📋 Métadonnées: metadata.json
📑 Prospectus: prospectus.docx
======================================================================

======================================================================
📊 EXTRACTION DE LA PRÉSENTATION PPTX
======================================================================
...
✓ Données sauvegardées: extracted_data_presentation.json

✓ Métadonnées chargées: metadata.json
  → Type client: retail
  → Société de gestion: ODDO BHF ASSET MANAGEMENT SAS

======================================================================
📄 EXTRACTION DU PROSPECTUS
======================================================================
✓ Fichier chargé: prospectus.docx
  Caractères: 45,234 (~12,000 tokens)

🤖 Analyse avec Token Factory (Llama-3.1-70B)...
   Taille acceptable. Traitement en une seule requête...
✓ Prospectus analysé (15/20 champs extraits)

📊 Informations extraites:
  - Fonds: ODDO BHF US Equity Active ETF
  - SRI: 3/7
  - Benchmark: S&P 500 Index (USD, NR)
  - Frais de gestion: 0.45%

======================================================================
🔍 RAPPORT DE CONFORMITÉ
======================================================================
...
```

---

## 🐛 Dépannage

### Erreur : "TOKENFACTORY_API_KEY not found"
**Solution :** Vérifiez que le fichier `.env` existe et contient la clé API.

### Erreur : "File not found"
**Solution :** Vérifiez que le chemin du fichier est correct.

### Erreur : "prospectus.docx not found"
**Solution :** C'est normal si le prospectus n'est pas disponible. Les vérifications prospectus seront ignorées.

---

## ✅ Avantages

1. **Automatisation complète** - Un seul script pour tout faire
2. **Flexible** - Fichiers optionnels gérés automatiquement
3. **Intégration** - Utilise `test.py` pour l'extraction PPTX
4. **Rapport détaillé** - Violations clairement identifiées
5. **Workflow unifié** - Tout en une seule commande

---

## 🎯 Prochaines Étapes

Après avoir exécuté le pipeline :
1. ✅ Examiner les violations détectées
2. ✅ Corriger les violations dans le document source
3. ✅ Ré-exécuter pour vérifier les corrections
4. ✅ Répéter jusqu'à ce qu'il n'y ait plus de violations

---

**Note :** Le pipeline utilise les mêmes règles de conformité que `check.py`, mais avec un workflow automatisé et amélioré.

