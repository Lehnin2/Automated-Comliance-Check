# 📋 Explication de la Logique de l'Agent de Compliance

## 🎯 Vue d'ensemble

L'agent de compliance vérifie automatiquement que les documents de présentation commerciale (fund presentations) respectent toutes les règles réglementaires. Il utilise l'API Llama (Token Factory) pour des vérifications intelligentes et contextuelles.

---

## 📁 Fichiers Nécessaires

### 1. **Fichiers de Configuration (Obligatoires)**

#### `metadata.json`
- **Rôle**: Contient les métadonnées du document à vérifier
- **Contenu**:
  - Société de Gestion
  - Type de client (professionnel/retail)
  - Nouveau produit/stratégie
- **Exemple**:
```json
{
  "Société de Gestion": "ODDO BHF ASSET MANAGEMENT SAS",
  "Le client est-il un professionnel": false,
  "Le document fait-il référence à un nouveau Produit": true
}
```

#### `.env`
- **Rôle**: Configuration de l'API
- **Contenu**:
  - `TOKENFACTORY_API_KEY`: Clé API pour Llama (Token Factory)

---

### 2. **Fichiers de Règles (Obligatoires)**

#### `structure_rules.json`
- **Rôle**: Règles de structure du document
- **Vérifie**:
  - Page de garde (nom du fonds, date, mention promotionnelle)
  - Slide 2 (disclaimers, risques)
  - Page de fin (caractéristiques détaillées)
- **Nombre de règles**: 11

#### `general_rules.json`
- **Rôle**: Règles générales applicables partout dans le document
- **Vérifie**:
  - Disclaimers retail/professionnel
  - Sources et dates des données
  - SRI (Synthetic Risk Indicator)
  - Glossaire pour documents retail
  - Mentions interdites (limites internes, liquidité ETF, etc.)
- **Nombre de règles**: 24

#### `values_rules.json`
- **Rôle**: Règles sur les valeurs/titres (régulation MAR)
- **Vérifie**:
  - Absence de recommandations d'investissement
  - Absence de valorisations
  - Absence de projections
  - Répétitions excessives de mentions de titres
- **Nombre de règles**: 18

#### `esg_rules.json`
- **Rôle**: Règles ESG (Article 6, 8, 9)
- **Vérifie**:
  - Présence de contenu ESG selon classification
  - Distribution du contenu ESG dans le document
  - Conformité avec SFDR
- **Nombre de règles**: 5 (ESG_001 exclu)

#### `performance_rules.json`
- **Rôle**: Règles sur la présentation de la performance
- **Vérifie**:
  - Présence de performance (selon âge du fonds)
  - Comparaison avec benchmark officiel
  - Disclaimers obligatoires
  - Scénarios de performance
- **Nombre de règles**: 40

#### `prospectus_rules.json`
- **Rôle**: Règles de conformité avec le prospectus
- **Vérifie**:
  - Stratégie d'investissement conforme
  - Allocation d'actifs conforme
  - Allocation géographique conforme
  - SRI conforme
  - Frais de gestion conformes
  - Objectif d'investissement conforme
- **Nombre de règles**: 14

---

### 3. **Fichiers de Données de Référence (Obligatoires)**

#### `registration.csv`
- **Rôle**: Base de données des fonds et pays autorisés
- **Contenu**:
  - Nom du fonds
  - ISIN
  - Share class
  - Liste des pays autorisés pour distribution
- **Utilisation**: Vérifie que le document ne mentionne que des pays autorisés

#### `GLOSSAIRE DISCLAIMERS 20231122.xlsx`
- **Rôle**: Base de données des disclaimers requis
- **Contenu**:
  - Disclaimers par type de document
  - Disclaimers retail vs professionnel
- **Utilisation**: Vérifie la présence des disclaimers requis

#### `prospectus.docx` (Optionnel)
- **Rôle**: Prospectus du fonds
- **Utilisation**: Extraction des données de référence (stratégie, allocation, SRI, etc.)
- **Note**: Si absent, certaines vérifications prospectus sont désactivées

---

### 4. **Document à Vérifier**

#### `extracted_data_exhaustive11.json` (ou autre fichier JSON)
- **Rôle**: Document à vérifier
- **Structure**:
```json
{
  "document_metadata": {
    "document_type": "fund_presentation",
    "client_type": "retail",
    "fund_isin": "...",
    "fund_esg_classification": "Article 6, Article 8, Article 9"
  },
  "page_de_garde": { ... },
  "slide_2": { ... },
  "pages_suivantes": [ ... ],
  "page_de_fin": { ... }
}
```

---

## 🔄 Flux de Vérification

### Étape 1: Initialisation
1. Charge `metadata.json`
2. Charge tous les fichiers de règles JSON
3. Charge `registration.csv`
4. Charge `GLOSSAIRE DISCLAIMERS 20231122.xlsx`
5. Configure l'API Token Factory (Llama)
6. Parse `prospectus.docx` si disponible

### Étape 2: Vérification du Document

#### ✅ CHECK 1: REGISTRATION
- **Fonction**: `check_registration_rules_enhanced()`
- **Vérifie**: 
  - Les pays mentionnés dans le document sont autorisés
  - Utilise LLM pour distinguer mentions de distribution vs mentions d'investissement
- **Violations**: Pays non autorisés mentionnés

#### ✅ CHECK 2: DISCLAIMERS
- **Fonction**: `check_disclaimer_in_document()`
- **Vérifie**:
  - Présence des disclaimers requis selon type de document et client
  - Utilise LLM pour matching flou (variations de texte)
- **Violations**: Disclaimers manquants ou incomplets

#### ✅ CHECK 3: STRUCTURE
- **Fonction**: `check_structure_rules_enhanced()`
- **Vérifie**:
  - Page de garde: nom du fonds, date, mention promotionnelle, audience cible
  - Slide 2: disclaimers, risques
  - Page de fin: caractéristiques détaillées
- **Violations**: Éléments manquants ou incorrects

#### ✅ CHECK 4: SECURITIES/VALUES
- **Fonction**: `check_values_rules_enhanced()`
- **Vérifie**:
  - Absence de recommandations d'investissement (régulation MAR)
  - Répétitions excessives de mentions de titres
  - Utilise LLM pour détecter le contexte sémantique
- **Violations**: Recommandations détectées, répétitions excessives

#### ✅ CHECK 5: ESG
- **Fonction**: `check_esg_rules_enhanced()`
- **Vérifie**:
  - Présence de contenu ESG selon classification (Article 6/8/9)
  - Distribution du contenu ESG dans le document
  - Utilise LLM pour analyser le contenu ESG
- **Violations**: Contenu ESG manquant ou mal distribué

#### ✅ CHECK 6: PERFORMANCE
- **Fonction**: `check_performance_rules_enhanced()`
- **Vérifie**:
  - Présence de performance (selon âge du fonds)
  - Comparaison avec benchmark officiel
  - Disclaimers obligatoires
  - Utilise LLM pour distinguer performance du fonds vs performance du marché
- **Violations**: Performance manquante, mauvais benchmark, disclaimers manquants

#### ✅ CHECK 7: GENERAL RULES
- **Fonction**: `check_general_rules_enhanced()`
- **Vérifie**:
  - Disclaimers retail/professionnel
  - Sources et dates des données externes
  - SRI présent et conforme
  - Glossaire pour documents retail
  - Mentions interdites (limites internes, liquidité ETF, etc.)
- **Violations**: Règles générales non respectées

#### ✅ CHECK 8: PROSPECTUS
- **Fonction**: `check_prospectus_compliance_enhanced()`
- **Vérifie**:
  - Stratégie d'investissement conforme au prospectus
  - Allocation d'actifs conforme
  - Allocation géographique conforme
  - SRI conforme
  - Frais de gestion conformes
  - Utilise LLM pour matching flou et détection de contradictions
- **Violations**: Données non conformes au prospectus

### Étape 3: Filtrage et Rapport
1. Filtre les faux positifs
2. Génère le rapport de violations
3. Affiche les statistiques

---

## 🧠 Utilisation de l'IA (Llama)

L'agent utilise l'API Llama pour:

1. **Analyse contextuelle**: Comprend le contexte des mentions (distribution vs investissement)
2. **Matching flou**: Détecte les variations de texte (disclaimers, stratégies)
3. **Détection sémantique**: Identifie les recommandations d'investissement même si non explicites
4. **Analyse multilingue**: Comprend le français et l'anglais
5. **Extraction de données**: Extrait les listes de pays autorisés, allocations, etc.

---

## 📊 Types de Violations

### Severity Levels:
- **CRITICAL**: Doit être corrigé avant publication
- **MAJOR**: Important à corriger
- **WARNING**: À vérifier manuellement

### Types de Violations:
- **REGISTRATION**: Pays non autorisés
- **DISCLAIMER**: Disclaimers manquants
- **STRUCTURE**: Éléments structurels manquants
- **VALUES**: Recommandations d'investissement
- **ESG**: Contenu ESG non conforme
- **PERFORMANCE**: Performance non conforme
- **GENERAL**: Règles générales non respectées
- **PROSPECTUS**: Non-conformité avec prospectus

---

## 🚀 Utilisation

### Commande de base:
```bash
python check.py extracted_data_exhaustive11.json
```

### Ce qui se passe:
1. L'agent charge tous les fichiers de règles
2. Parse le document JSON fourni
3. Exécute toutes les vérifications
4. Génère un rapport de violations

### Sortie attendue:
- Liste des violations trouvées
- Statistiques par type et sévérité
- Scores de confiance pour les vérifications LLM

---

## ⚠️ Problèmes Courants

### 1. Fichiers manquants
- **Erreur**: `⚠️ structure_rules.json not found`
- **Solution**: Vérifier que tous les fichiers JSON de règles sont présents

### 2. API non configurée
- **Erreur**: `⚠️ Token Factory API not configured`
- **Solution**: Vérifier que `TOKENFACTORY_API_KEY` est dans `.env`

### 3. Modules Python manquants
- **Erreur**: `ModuleNotFoundError: No module named 'docx'`
- **Solution**: Installer avec `pip install python-docx openpyxl`

### 4. Client type vide
- **Problème**: `client_type` vide dans le JSON
- **Solution**: Remplir `client_type` dans `document_metadata` ou utiliser `metadata.json`

---

## 📝 Notes Importantes

1. **LLM requis**: La plupart des vérifications nécessitent l'API Llama pour fonctionner correctement
2. **Métadonnées**: Le `client_type` est crucial car de nombreuses règles dépendent de ce paramètre
3. **Prospectus**: Si `prospectus.docx` est absent, les vérifications prospectus sont limitées
4. **Confidence scores**: Les vérifications LLM retournent des scores de confiance (0-100%)

---

## 🔍 Exemple de Sortie

```
======================================================================
🔍 COMPLIANCE REPORT
======================================================================
File: extracted_data_exhaustive11.json
Fund ISIN: Not specified
Client Type: RETAIL
Document Type: fund_presentation
Fund Status: active
ESG Classification: Article 6, Article 8, Article 9
======================================================================

Checking structure...
✅ Structure: OK

Checking general rules...
✅ General rules: OK

Checking securities/values...
✅ Securities/Values: OK

Checking ESG rules...
✅ ESG: OK

Checking performance rules...
✅ Performance: OK

======================================================================
✅ NO VIOLATIONS FOUND - Document is compliant!
======================================================================
```

---

## 📚 Références

- **PDF des règles**: `Synthèse règles présentations commerciales.pdf`
- **Fichiers de règles**: Tous les `*_rules.json`
- **Code principal**: `agent_local.py`
- **Script de vérification**: `check.py`

