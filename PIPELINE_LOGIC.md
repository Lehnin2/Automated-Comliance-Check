# Pipeline de Validation de Conformité Marketing

## 📋 Vue d'ensemble

Ce document décrit la logique complète du pipeline d'automatisation du contrôle de conformité pour les présentations marketing, utilisant l'IA Générative avec une approche "Human in the loop".

---

## 🎯 Objectif du Projet

**Contexte :** L'équipe Compliance doit vérifier les documents marketing d'un acteur de l'Asset Management pour s'assurer qu'ils respectent le corpus de règles de conformité.

**Solution :** Automatiser la détection des violations de conformité en annotant chaque document avec la règle enfreinte, tout en permettant une validation humaine finale.

**Principe clé :** Les règles de conformité sont **constantes**, les présentations marketing sont **variables**.

---

## 🏗️ Architecture Globale du Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                     PHASE 0 : PRÉPARATION                        │
│                  (Exécutée UNE SEULE FOIS)                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Entrée : PDF Règles de Conformité                              │
│  "Synthèse règles présentations commerciales.pdf"               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │  SmartRulesExtractor (Multi-pass)       │
        │  ─────────────────────────────────      │
        │  • PASS 1 : Extraction initiale (LLM)   │
        │  • PASS 2 : Vérification complétude     │
        │  • PASS 3 : Scoring de confiance        │
        └─────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Sortie : smart_extracted_rules.json                             │
│  {                                                               │
│    "rules": [                                                    │
│      {                                                           │
│        "rule_id": "RG.1",                                        │
│        "category": "global",                                     │
│        "title": "Disclaimer obligatoire",                        │
│        "description": "Détails complets...",                     │
│        "severity": "critique",                                   │
│        "keywords": ["disclaimer", "mention légale"],             │
│        "confidence_score": 0.95,                                 │
│        "status": "validated"                                     │
│      }                                                           │
│    ]                                                             │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │  ComplianceChecklistGenerator           │
        │  ─────────────────────────────────      │
        │  Transforme chaque règle en checklist   │
        │  de champs à vérifier                   │
        └─────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Sortie : compliance_checklist.json                              │
│  {                                                               │
│    "RG.1": {                                                     │
│      "rule_id": "RG.1",                                          │
│      "fields_to_extract": [                                      │
│        {                                                         │
│          "field_name": "Disclaimer PRIIPS",                      │
│          "validation_type": "presence",                          │
│          "required": true,                                       │
│          "keywords": ["PRIIPS", "DIC", "DICI"],                  │
│          "location": "slide_2",                                  │
│          "external_doc": "glossaire_disclaimers",                │
│          "external_ref": "DISCLAIMER_PRIIPS_V2"                  │
│        },                                                        │
│        {                                                         │
│          "field_name": "Affirmations subjectives",               │
│          "validation_type": "absence",                           │
│          "forbidden_terms": ["selon notre opinion", "meilleur"], │
│          "severity": "critique"                                  │
│        }                                                         │
│      ]                                                           │
│    }                                                             │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │  VectorStore + EmbeddingsManager        │
        │  ─────────────────────────────────      │
        │  • Génération embeddings (Sentence      │
        │    Transformers)                        │
        │  • Indexation dans ChromaDB             │
        │  • Préparation recherche sémantique     │
        └─────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Sortie : Base Vectorielle ChromaDB                              │
│  DATA/chroma_db/                                                 │
│  → Permet recherche sémantique rapide des règles pertinentes     │
└─────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│              PHASE 1 : EXTRACTION CONTENU PPTX                   │
│            (Pour CHAQUE présentation à vérifier)                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Entrée : presentation_marketing.pptx                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │  PPTXExtractor                          │
        │  ─────────────────────────────────      │
        │  Pour chaque slide :                    │
        │  • Extraction texte (shapes, zones)     │
        │  • OCR images (Tesseract)               │
        │  • Extraction tableaux                  │
        │  • Métadonnées (police, taille, layout) │
        │  • Notes du présentateur                │
        └─────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Sortie : presentation_content.json                              │
│  {                                                               │
│    "metadata": {                                                 │
│      "filename": "presentation_marketing.pptx",                  │
│      "total_slides": 15,                                         │
│      "extraction_date": "2025-11-18"                             │
│    },                                                            │
│    "slides": [                                                   │
│      {                                                           │
│        "slide_number": 1,                                        │
│        "layout": "Title Slide",                                  │
│        "text": [                                                 │
│          "Fonds ABC - Performance 2024",                         │
│          "Présentation Commerciale"                              │
│        ],                                                        │
│        "images_text": [],  // Texte extrait par OCR             │
│        "tables": [],                                             │
│        "notes": "Insister sur les performances",                 │
│        "metadata": {                                             │
│          "font_sizes": [28, 18, 12],                             │
│          "colors": ["#000000", "#FF0000"],                       │
│          "has_images": true                                      │
│        }                                                         │
│      },                                                          │
│      {                                                           │
│        "slide_number": 2,                                        │
│        "text": ["Performance : +15% en 2024"],                   │
│        ...                                                       │
│      }                                                           │
│    ]                                                             │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│          PHASE 2 : VALIDATION SLIDE PAR SLIDE                    │
│              (Cœur du système de détection)                      │
└─────────────────────────────────────────────────────────────────┘

Pour CHAQUE slide de la présentation :

                              ↓
        ┌─────────────────────────────────────────┐
        │  ÉTAPE 2.1 : Recherche RAG              │
        │  ─────────────────────────────────      │
        │  VectorStore.search_similar_rules()     │
        │                                         │
        │  Input : Texte du slide actuel          │
        │  Process :                              │
        │    • Génération embedding du texte      │
        │    • Recherche similarité dans ChromaDB │
        │    • Récupération top-k règles (k=5-10) │
        │                                         │
        │  Output : Liste règles pertinentes      │
        │    [RG.12, RG.15, RG.3, RG.8, RG.20]    │
        └─────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │  ÉTAPE 2.2 : Vérification Checklist     │
        │  ─────────────────────────────────      │
        │  Pour chaque règle trouvée :            │
        │                                         │
        │  1. Charger compliance_checklist.json   │
        │     pour cette règle                    │
        │                                         │
        │  2. Pour chaque champ de la checklist : │
        │                                         │
        │     TYPE : "presence" (obligatoire)     │
        │     ──────────────────────────          │
        │     • Rechercher keywords dans texte    │
        │     • Si absent → VIOLATION             │
        │                                         │
        │     TYPE : "absence" (interdit)         │
        │     ──────────────────────────          │
        │     • Rechercher forbidden_terms        │
        │     • Si présent → VIOLATION            │
        │                                         │
        │     TYPE : "format" (regex)             │
        │     ──────────────────────────          │
        │     • Valider format (date, montant)    │
        │     • Si non conforme → VIOLATION       │
        │                                         │
        │     TYPE : "external_doc"               │
        │     ──────────────────────────          │
        │     • Vérifier dans Glossaire/          │
        │       Prospectus/Excel                  │
        │     • Si non trouvé → VIOLATION         │
        │                                         │
        │  3. Enregistrer violations détectées    │
        └─────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │  ÉTAPE 2.3 : Analyse LLM Contextuelle   │
        │  ─────────────────────────────────      │
        │  ComplianceValidator._llm_analysis()    │
        │                                         │
        │  Pour détecter violations COMPLEXES :   │
        │                                         │
        │  Prompt Groq :                          │
        │  ─────────                              │
        │  "Tu es expert Compliance.              │
        │   Analyse ce slide et détecte :         │
        │   • Affirmations trompeuses             │
        │   • Disclaimers mal positionnés         │
        │   • Taille police non conforme          │
        │   • Termes subjectifs interdits         │
        │   • Incohérences avec règles"           │
        │                                         │
        │  Input :                                │
        │    • Contenu slide complet              │
        │    • Liste règles pertinentes (RAG)     │
        │    • Checklist attendue                 │
        │                                         │
        │  Output : JSON violations               │
        │    {                                    │
        │      "violations": [                    │
        │        {                                │
        │          "rule_id": "RG.12",            │
        │          "type": "missing_disclaimer",  │
        │          "explanation": "...",          │
        │          "evidence": "texte exact",     │
        │          "suggestion": "Ajouter..."     │
        │        }                                │
        │      ]                                  │
        │    }                                    │
        └─────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │  ÉTAPE 2.4 : Vérification Documents     │
        │              Externes                   │
        │  ─────────────────────────────────      │
        │  ExternalDocsChecker                    │
        │                                         │
        │  1. GLOSSAIRE DISCLAIMERS               │
        │     ──────────────────────              │
        │     Si règle référence un disclaimer :  │
        │     • Charger texte exact du glossaire  │
        │     • Comparer avec texte slide         │
        │     • Tolérance : similarité 90%+       │
        │     • Si absent/différent → VIOLATION   │
        │                                         │
        │  2. PROSPECTUS PRODUIT                  │
        │     ──────────────────                  │
        │     Si slide fait affirmations :        │
        │     • Extraire claims du slide          │
        │     • Chercher justification prospectus │
        │     • Si non justifié → VIOLATION       │
        │                                         │
        │  3. REGISTRATION OF FUNDS (Excel)       │
        │     ──────────────────────────────      │
        │     Si slide mentionne pays :           │
        │     • Extraire noms pays mentionnés     │
        │     • Vérifier dans Excel autorisation  │
        │     • Si pays non autorisé → VIOLATION  │
        └─────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Sortie pour CE SLIDE : violations_slide_N.json                  │
│  {                                                               │
│    "slide_number": 2,                                            │
│    "violations_count": 2,                                        │
│    "violations": [                                               │
│      {                                                           │
│        "violation_id": "V001",                                   │
│        "rule_id": "RG.12",                                       │
│        "rule_title": "Disclaimer performances obligatoire",      │
│        "rule_category": "performances",                          │
│        "severity": "critique",                                   │
│        "violation_type": "missing_field",                        │
│        "field_missing": "Disclaimer performances passées",       │
│        "explanation": "Le slide présente des performances       │
│                        (+15% en 2024) mais ne contient pas      │
│                        le disclaimer obligatoire",              │
│        "evidence": "Texte exact du slide : 'Performance :       │
│                     +15% en 2024'",                             │
│        "suggestion": "Ajouter en bas du slide (police ≥8pt) :   │
│                      'Les performances passées ne préjugent     │
│                       pas des performances futures'",           │
│        "confidence_score": 0.95,                                 │
│        "detection_method": "checklist + LLM"                     │
│      },                                                          │
│      {                                                           │
│        "violation_id": "V002",                                   │
│        "rule_id": "RG.15",                                       │
│        "rule_title": "Interdiction termes subjectifs",           │
│        "severity": "majeure",                                    │
│        "violation_type": "forbidden_term",                       │
│        "forbidden_term_found": "meilleur fonds",                 │
│        "explanation": "Affirmation subjective interdite",        │
│        "suggestion": "Remplacer par données objectives",         │
│        "confidence_score": 1.0,                                  │
│        "detection_method": "checklist"                           │
│      }                                                           │
│    ],                                                            │
│    "compliant_rules": ["RG.1", "RG.3", "RG.8"],                  │
│    "rules_checked": 10                                           │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘

        ↓ Répéter pour TOUS les slides ↓

═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│         PHASE 3 : GÉNÉRATION RAPPORT D'ANNOTATION                │
│              (Compilation de tous les résultats)                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │  AnnotationGenerator                    │
        │  ─────────────────────────────────      │
        │  1. Compiler toutes violations          │
        │  2. Grouper par slide                   │
        │  3. Trier par sévérité                  │
        │  4. Calculer statistiques               │
        │  5. Générer recommandations             │
        └─────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Sortie : compliance_report.json                                 │
│  {                                                               │
│    "report_metadata": {                                          │
│      "presentation": "presentation_marketing.pptx",              │
│      "validation_date": "2025-11-18T14:30:00",                   │
│      "pipeline_version": "1.0",                                  │
│      "model_used": "llama-3.3-70b-versatile"                     │
│    },                                                            │
│    "summary": {                                                  │
│      "total_slides": 15,                                         │
│      "slides_with_violations": 8,                                │
│      "total_violations": 23,                                     │
│      "violations_by_severity": {                                 │
│        "critique": 5,                                            │
│        "majeure": 12,                                            │
│        "mineure": 6                                              │
│      },                                                          │
│      "most_violated_rules": [                                    │
│        {"rule_id": "RG.12", "count": 7},                         │
│        {"rule_id": "RG.15", "count": 5}                          │
│      ],                                                          │
│      "compliance_score": 0.62  // (15-8)/15                      │
│    },                                                            │
│    "detailed_violations": [                                      │
│      {                                                           │
│        "slide_number": 2,                                        │
│        "violations": [...],  // Détails complets                 │
│        "status": "to_correct",                                   │
│        "priority": "high"                                        │
│      }                                                           │
│    ],                                                            │
│    "compliant_slides": [1, 3, 5, 7, 9, 11, 13],                  │
│    "recommendations": [                                          │
│      "Ajouter disclaimers performances sur slides 2, 4, 6",      │
│      "Retirer termes subjectifs slides 8, 12",                   │
│      "Vérifier autorisation pays slide 14"                       │
│    ]                                                             │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│            PHASE 4 : HUMAN IN THE LOOP                           │
│          (Validation et correction par Compliance)               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │  Interface de Révision                  │
        │  ─────────────────────────────────      │
        │  (Web UI ou CLI)                        │
        │                                         │
        │  Pour chaque violation détectée :       │
        │                                         │
        │  ┌───────────────────────────────┐      │
        │  │ SLIDE 2 - VIOLATION CRITIQUE  │      │
        │  ├───────────────────────────────┤      │
        │  │ Règle : RG.12                 │      │
        │  │ "Disclaimer performances      │      │
        │  │  obligatoire"                 │      │
        │  │                               │      │
        │  │ Problème détecté :            │      │
        │  │ Disclaimer manquant           │      │
        │  │                               │      │
        │  │ Suggestion :                  │      │
        │  │ "Ajouter en bas..."           │      │
        │  │                               │      │
        │  │ Actions :                     │      │
        │  │ [✅ Valider violation]         │      │
        │  │ [❌ Faux positif]              │      │
        │  │ [✏️ Modifier suggestion]       │      │
        │  └───────────────────────────────┘      │
        └─────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Sortie : compliance_report_validated.json                       │
│  + PPTX annoté avec commentaires insérés                         │
└─────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════

## 🔄 Flux de Données Complet

```
PDF Règles
    ↓
[SmartRulesExtractor] → smart_extracted_rules.json
    ↓
[ComplianceChecklistGenerator] → compliance_checklist.json
    ↓
[VectorStore] → ChromaDB

═══════════════════════════════════════════════

PPTX Marketing
    ↓
[PPTXExtractor] → presentation_content.json
    ↓
[ComplianceValidator]
    ├─ RAG (ChromaDB)
    ├─ Checklist verification
    ├─ LLM analysis
    └─ External docs check
    ↓
[AnnotationGenerator] → compliance_report.json
    ↓
[Human Review] → compliance_report_validated.json
    ↓
PPTX annoté + Rapport final
```

---

## 🧩 Composants Techniques

### **Composants Existants** ✅
- `SmartRulesExtractor` : Extraction multi-pass règles
- `ComplianceChecklistGenerator` : Génération checklist
- `VectorStore` : Indexation ChromaDB
- `EmbeddingsManager` : Génération embeddings
- `RulesIndexer` : Validation et chargement règles

### **Composants à Créer** ⚠️
- `PPTXExtractor` : Extraction contenu PPTX
- `ComplianceValidator` : Validation slide par slide
- `ExternalDocsChecker` : Vérification documents externes
- `AnnotationGenerator` : Génération rapports
- `ReviewInterface` : Interface Human-in-the-loop

---

## 📊 Technologies Utilisées

| Composant | Technologie |
|-----------|-------------|
| LLM | Groq (llama-3.3-70b-versatile) |
| Embeddings | Sentence Transformers |
| Vector DB | ChromaDB |
| RAG | LangChain |
| PDF Parsing | PyMuPDF (fitz) |
| PPTX Parsing | python-pptx |
| OCR | Tesseract |
| Orchestration | Python scripts |

---

## 🎯 Critères de Validation

### **Détection de Violation**
Une violation est détectée si :
1. **Checklist automatique** : Champ obligatoire absent OU terme interdit présent
2. **Score confiance LLM** : ≥ 0.80 (sinon → révision humaine obligatoire)
3. **Document externe** : Non-conformité vérifiée (Glossaire/Prospectus/Excel)

### **Niveaux de Sévérité**
- **🔴 CRITIQUE** : Bloque publication (ex: disclaimer manquant)
- **🟠 MAJEURE** : Correction fortement recommandée (ex: terme subjectif)
- **🟡 MINEURE** : Amélioration suggérée (ex: formulation imprécise)

### **Scoring de Conformité**
```
Score = (Slides conformes) / (Total slides)

≥ 0.90 → ✅ CONFORME (publication possible)
0.70-0.89 → ⚠️ RÉVISION REQUISE
< 0.70 → ❌ NON CONFORME (corrections majeures)
```

---

## 🔧 Configuration et Paramètres

### **Paramètres RAG**
- `top_k` : 5-10 règles par slide
- `similarity_threshold` : 0.65 (règles pertinentes)
- `embedding_model` : "paraphrase-multilingual-MiniLM-L12-v2"

### **Paramètres LLM**
- `model` : "llama-3.3-70b-versatile"
- `temperature` : 0.05-0.1 (déterministe)
- `max_tokens` : 2000-4000
- `confidence_threshold` : 0.80

### **Paramètres Validation**
- `fuzzy_match_threshold` : 0.90 (disclaimers)
- `ocr_languages` : "fra+eng"
- `min_font_size` : 8pt (disclaimers)

---

## 📈 Performance Attendue

- **Extraction règles** : ~5-10 min (une seule fois)
- **Indexation ChromaDB** : ~2-3 min (une seule fois)
- **Validation PPTX (15 slides)** : ~2-3 min
  - Extraction PPTX : ~30 sec
  - Validation slides : ~90-120 sec (parallélisable)
  - Génération rapport : ~10 sec

**Optimisations possibles :**
- Traitement parallèle des slides (asyncio)
- Cache LLM pour règles similaires
- Pré-calcul embeddings slides

---

## 🚨 Gestion des Cas Limites

### **Faux Positifs**
- Score confiance < 0.80 → Révision humaine obligatoire
- Flagging explicite dans rapport
- Possibilité rejet par utilisateur

### **Faux Négatifs**
- Pass 2 SmartRulesExtractor vérifie complétude règles
- LLM analysis pour détections contextuelles
- Révision humaine systématique recommandée

### **Règles Conditionnelles**
Exemple : "Disclaimer obligatoire SAUF si présentation de gamme"
- Détection type présentation via LLM
- Application règle conditionnelle
- Justification explicite dans rapport

---

## 📝 Format de Sortie Final

Le système génère :

1. **compliance_report.json** : Rapport technique complet
2. **compliance_report.html** : Rapport lisible (optionnel)
3. **presentation_annotated.pptx** : PPTX avec commentaires insérés
4. **validation_log.txt** : Log technique pour debug

---

## 🔄 Évolutions Futures

### **Phase 1** (Actuel)
- Validation règles basiques (présence/absence)
- RAG simple
- LLM analysis standard

### **Phase 2** (Améliorations)
- Fine-tuning LLM sur corpus compliance
- Détection layout (position disclaimers)
- Analyse formatage avancée (polices, couleurs)

### **Phase 3** (Avancé)
- Multi-modal : analyse graphiques/images
- Historique décisions (apprentissage)
- Suggestions corrections automatiques

---

## 📚 Références

- **Corpus règles** : `DATA/source/Synthèse règles présentations commerciales.pdf`
- **Règles extraites** : `DATA/extracted/smart_extracted_rules.json`
- **Checklist** : `DATA/extracted/compliance_checklist.json`
- **Vector DB** : `DATA/chroma_db/`
- **Exemples PPTX** : `DATA/examples/`

---

## ✅ Checklist Implémentation

### Phase 0 : Préparation ✅
- [x] SmartRulesExtractor
- [x] ComplianceChecklistGenerator
- [x] VectorStore + ChromaDB
- [x] EmbeddingsManager

### Phase 1 : Extraction PPTX ⚠️
- [ ] PPTXExtractor
- [ ] OCR integration
- [ ] Metadata extraction

### Phase 2 : Validation ⚠️
- [ ] ComplianceValidator
- [ ] RAG integration
- [ ] LLM analysis
- [ ] ExternalDocsChecker

### Phase 3 : Annotation ⚠️
- [ ] AnnotationGenerator
- [ ] Report formatting
- [ ] PPTX annotation

### Phase 4 : Human-in-the-loop ⚠️
- [ ] ReviewInterface
- [ ] Validation workflow
- [ ] Export final

---

**Dernière mise à jour :** 2025-11-18  
**Version :** 1.0  
**Statut :** Phase 0 complète, Phases 1-4 en cours
