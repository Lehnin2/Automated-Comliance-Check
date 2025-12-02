"""
Compliance Checklist Extractor
Génère une checklist de conformité à partir des règles
Chaque règle → Liste de champs à extraire du PowerPoint
"""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict, field

from groq import Groq


@dataclass
class ComplianceCheckItem:
    """Un item de la checklist de conformité"""
    rule_id: str
    rule_category: str
    rule_description: str
    slide_location: str  # "slide_1", "slide_2", "any", "every_slide"
    
    # Champs à extraire du PowerPoint
    fields_to_extract: List[Dict[str, Any]]
    
    # Critères de validation
    validation_criteria: Dict[str, Any]
    
    # Priorité
    severity: str  # "critique", "majeure", "mineure"
    required: bool
    
    # NOUVEAU : Références externes
    external_references: List[Dict[str, Any]] = field(default_factory=list)
    
    # NOUVEAU : Règles conditionnelles
    conditional_rules: List[Dict[str, Any]] = field(default_factory=list)
    
    # NOUVEAU : Validations de format
    format_validations: List[Dict[str, Any]] = field(default_factory=list)
    
    # NOUVEAU : Validation multi-niveau
    validation_priority: int = 1  # 0=critique, 1=haute, 2=normale, 3=basse
    field_dependencies: List[str] = field(default_factory=list)  # Champs requis avant validation
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class ComplianceChecklistGenerator:
    """Générateur de checklist de conformité avec Groq LLM"""
    
    SUPPORTED_LOCALES = ["fr_FR", "en_US", "de_DE"]
    
    def __init__(self, groq_api_key: str, rules_file: Path, enable_cache: bool = True, locale: str = "fr_FR"):
        self.client = Groq(api_key=groq_api_key)
        self.model = "llama-3.3-70b-versatile"
        self.rules_file = rules_file
        self.rules_data = self._load_rules()
        self.enable_cache = enable_cache
        self.cache = {} if enable_cache else None
        self.cache_file = rules_file.parent / "checklist_cache.json"
        self.locale = locale if locale in self.SUPPORTED_LOCALES else "fr_FR"
        if enable_cache:
            self._load_cache()
    
    def _load_rules(self) -> Dict[str, Any]:
        """Charge les règles"""
        with self.rules_file.open("r", encoding="utf-8") as f:
            return json.load(f)
    
    def _load_cache(self):
        """Charge le cache depuis le fichier"""
        if self.cache_file.exists():
            try:
                with open(self.cache_file, 'r', encoding='utf-8') as f:
                    self.cache = json.load(f)
                print(f"📂 Cache chargé : {len(self.cache)} entrées")
            except Exception as e:
                print(f"⚠️  Erreur chargement cache : {e}")
                self.cache = {}
    
    def _save_cache(self):
        """Sauvegarde le cache"""
        if self.enable_cache and self.cache:
            try:
                with open(self.cache_file, 'w', encoding='utf-8') as f:
                    json.dump(self.cache, f, ensure_ascii=False, indent=2)
            except Exception as e:
                print(f"⚠️  Erreur sauvegarde cache : {e}")
    
    def _get_cache_key(self, rule: Dict[str, Any]) -> str:
        """Génère une clé de cache pour une règle"""
        rule_id = rule.get("rule_id", "")
        description = rule.get("description", "")
        # Hash simple basé sur id + premiers 100 caractères description
        import hashlib
        content = f"{rule_id}_{description[:100]}"
        return hashlib.md5(content.encode()).hexdigest()
    
    def _determine_slide_location(self, rule: Dict[str, Any]) -> str:
        """Détermine la catégorie de règle avec analyse LLM intelligente"""
        slide_number = rule.get("slide_number", "any")
        category = rule.get("category", "global")
        description = rule.get("description", "").lower()
        
        # Méthode 1 : Détection rapide par mots-clés (fallback)
        if (slide_number == "1" or category == "page_de_garde" or
            any(kw in description for kw in ["page de garde", "cover", "première page", "titre"])):
            return "page_de_garde"
        
        elif (slide_number == "2" or category == "slide_2" or
              any(kw in description for kw in ["slide 2", "après la page de garde", "deuxième slide"])):
            return "slide_2"
        
        elif any(kw in description for kw in ["fin de présentation", "dernière slide", "glossaire"]):
            return "page_finale"
        
        elif (slide_number and slide_number not in ["any", "global", "1", "2"] or
              category in ["performances", "ESG", "valeurs", "stratégies"]):
            return "pages_suivantes"
        
        # Méthode 2 : Analyse LLM intelligente pour cas ambigus
        if not slide_number or slide_number in ["any", "global"]:
            return self._llm_detect_slide_location(rule)
        
        return "regles_generales"
    
    def _llm_detect_slide_location(self, rule: Dict[str, Any]) -> str:
        """Détection intelligente via LLM pour cas ambigus"""
        description = rule.get("description", "")
        category = rule.get("category", "")
        
        prompt = f"""Tu es expert en structure de présentations PowerPoint financières.

RÈGLE: {description}
CATÉGORIE: {category}

QUESTION: Cette règle s'applique à quel(s) slide(s) ?

CHOIX POSSIBLES:
- page_de_garde (slide 1 uniquement)
- slide_2 (slide 2 uniquement, disclaimers)
- pages_suivantes (slides 3+, contenu)
- page_finale (dernière slide uniquement)
- regles_generales (tous les slides)

Réponds UNIQUEMENT avec un mot parmi : page_de_garde, slide_2, pages_suivantes, page_finale, regles_generales"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
                max_tokens=50
            )
            
            content = response.choices[0].message.content
            if content is None:
                return "regles_generales"
            
            location = content.strip().lower()
            valid_locations = ["page_de_garde", "slide_2", "pages_suivantes", "page_finale", "regles_generales"]
            
            if location in valid_locations:
                return location
        except Exception:
            pass
        
        return "regles_generales"
    
    def generate_check_item(self, rule: Dict[str, Any]) -> ComplianceCheckItem:
        """Génère un item de checklist pour une règle avec extraction intelligente 2-passes"""
        rule_id = rule.get("rule_id", "N/A")
        category = rule.get("category", "N/A")
        description = rule.get("description", "")
        validation_type = rule.get("validation_type", "presence")
        severity = rule.get("severity", "mineure")
        required = rule.get("required", True)
        
        slide_location = self._determine_slide_location(rule)
        
        # Vérifier cache
        if self.enable_cache and self.cache:
            cache_key = self._get_cache_key(rule)
            if cache_key in self.cache:
                print(f"📂 {rule_id}: Depuis cache")
                cached_data = self.cache[cache_key]
                return ComplianceCheckItem(
                    rule_id=rule_id,
                    rule_category=category,
                    rule_description=description,
                    slide_location=slide_location,
                    fields_to_extract=cached_data.get("fields_to_extract", []),
                    validation_criteria=cached_data.get("validation_criteria", {}),
                    severity=severity,
                    required=required,
                    external_references=cached_data.get("external_references", []),
                    conditional_rules=cached_data.get("conditional_rules", []),
                    format_validations=cached_data.get("format_validations", [])
                )
        
        # ============ EXTRACTION AVEC PROMPT DÉTAILLÉ OPTIMISÉ ============
        prompt = f"""Tu es un expert en conformité de documents financiers.

RÈGLE DE CONFORMITÉ:
ID: {rule_id}
Catégorie: {category}
Description: {description}
Type validation: {validation_type}
Localisation: {slide_location}

⚠️ INSTRUCTIONS CRITIQUES POUR L'EXTRACTION DES CHAMPS ⚠️

**RÈGLE #1 - SÉPARATION STRICTE**: 
Si la règle mentionne "X ET Y" ou "X/Y/Z" → crée des champs DISTINCTS pour chaque élément.

EXEMPLES OBLIGATOIRES:
- "études/données/graphiques" avec "source et date" → 6 CHAMPS:
  * source_etude, date_etude
  * source_donnee_chiffree, date_donnee_chiffree  
  * source_graphique, date_graphique

- "nom et code ISIN" → 2 CHAMPS: nom_fonds, code_isin

- "performances YTD, 5 ans, 10 ans" → 3 CHAMPS:
  * performance_ytd
  * performance_5ans
  * performance_10ans

**RÈGLE #2 - UN CONCEPT = UN CHAMP**:
❌ INTERDIT: "source_et_date", "nom_et_code", "titre_et_description"
✅ CORRECT: Toujours séparer en champs individuels

**RÈGLE #3 - EXHAUSTIVITÉ**:
Liste TOUS les éléments (contenu + format + style + position)

**RÈGLE #4 - NOMS PROFESSIONNELS**:
Utilise snake_case précis (source_etude, date_publication_graphique, taille_police_titre)

**RÈGLE #5 - ÉCHAPPEMENT JSON OBLIGATOIRE POUR LES REGEX**:
Dans le champ "regex_pattern", TOUTES les barres obliques inverses (\) DOIVENT être doublées (\\).
❌ INCORRECT: "\d{{4}}"
✅ CORRECT: "\\d{{4}}"
C'est une exigence JSON critique.

TÂCHE: Génère UNE SEULE checklist enrichie pour cette règle.
IMPORTANT: Groupe TOUS les champs de cette règle dans une seule réponse.

DÉTECTION FOOTER: Si la règle mentionne "bas de page", "footer", "pied de slide", ajoute "footer_location": true dans le champ.

Pour CHAQUE élément à vérifier, spécifie:

1. **field_name**: Nom technique du champ (snake_case, ex: "source_etude", "date_graphique")
2. **extraction_method**: 
   - "text_search": Chercher texte spécifique
   - "text_presence": Vérifier présence texte
   - "style_check": Vérifier style (gras, couleur, taille)
   - "position_check": Vérifier position/ordre
   - "data_extraction": Extraire donnée (date, nombre, liste)
   - "regex_match": Validation regex
   - "external_lookup": Vérifier dans document externe
3. **search_keywords**: Mots-clés pour trouver ce champ
4. **auto_synonyms**: Synonymes et variations linguistiques (FR, EN, DE) - OBLIGATOIRE
5. **validation_priority**: 0=critique, 1=haute, 2=normale, 3=basse
6. **depends_on**: Liste de champs requis avant validation (ex: ["disclaimer_text"] requis avant "disclaimer_bold")
7. **expected_format**: Format attendu (optionnel)
8. **validation_rule**: Règle de validation spécifique
9. **regex_pattern**: Pattern regex si validation format (optionnel)
10. **external_doc_type**: Type de document externe si applicable (optionnel)
11. **external_doc_ref**: Référence exacte dans le document externe (optionnel)

LANGUES SUPPORTÉES:
Génère TOUJOURS search_keywords et auto_synonyms en 3 langues:
- FR (Français)
- EN (English)
- DE (Deutsch)

EXEMPLES CONCRETS D'EXTRACTION PRÉCISE:

Règle: "Les études/données chiffrées/graphiques doivent faire l'objet d'un renvoi précisant la source et la date"
→ Champs (PRÉCIS, SÉPARÉS) :
{{
  "field_name": "source_etude",
  "extraction_method": "text_search",
  "search_keywords": ["source", "étude", "study source", "Studienquelle"],
  "auto_synonyms": {{
    "fr": ["origine étude", "provenance étude", "référence étude"],
    "en": ["study origin", "study reference", "research source"],
    "de": ["Studienherkunft", "Studienreferenz", "Forschungsquelle"]
  }},
  "validation_rule": "must_be_present",
  "validation_priority": 0,
  "depends_on": [],
  "footer_location": true
}},
{{
  "field_name": "date_etude",
  "extraction_method": "regex_match",
  "search_keywords": ["date", "année", "study date", "Studiendatum"],
  "auto_synonyms": {{
    "fr": ["date publication", "année publication", "période étude"],
    "en": ["publication date", "study year", "research period"],
    "de": ["Veröffentlichungsdatum", "Studienjahr", "Forschungszeitraum"]
  }},
  "expected_format": "YYYY ou MM/YYYY",
  "validation_rule": "must_match_format",
  "validation_priority": 0,
  "depends_on": [],
  "regex_pattern": "20[0-9]{{2}}|(0[1-9]|1[0-2])/20[0-9]{{2}}",
  "footer_location": true
}},
{{
  "field_name": "source_donnee_chiffree",
  "extraction_method": "text_search",
  "search_keywords": ["source", "données", "data source", "Datenquelle"],
  "auto_synonyms": {{
    "fr": ["origine données", "provenance chiffres", "source statistiques"],
    "en": ["data origin", "statistics source", "figures source"],
    "de": ["Datenherkunft", "Statistikquelle", "Zahlenquelle"]
  }},
  "validation_rule": "must_be_present",
  "validation_priority": 0,
  "depends_on": [],
  "footer_location": true
}},
{{
  "field_name": "date_donnee_chiffree",
  "extraction_method": "regex_match",
  "search_keywords": ["date", "données", "data date", "Datendatum"],
  "auto_synonyms": {{
    "fr": ["date collecte", "période données", "actualisation"],
    "en": ["collection date", "data period", "update date"],
    "de": ["Erhebungsdatum", "Datenperiode", "Aktualisierungsdatum"]
  }},
  "expected_format": "YYYY ou MM/YYYY",
  "validation_rule": "must_match_format",
  "validation_priority": 0,
  "depends_on": [],
  "regex_pattern": "20[0-9]{{2}}|(0[1-9]|1[0-2])/20[0-9]{{2}}",
  "footer_location": true
}},
{{
  "field_name": "source_graphique",
  "extraction_method": "text_search",
  "search_keywords": ["source", "graphique", "chart source", "Diagrammquelle"],
  "auto_synonyms": {{
    "fr": ["origine graphique", "provenance visualisation", "source schéma"],
    "en": ["chart origin", "visualization source", "diagram source"],
    "de": ["Diagrammherkunft", "Visualisierungsquelle", "Schemaherkunft"]
  }},
  "validation_rule": "must_be_present",
  "validation_priority": 0,
  "depends_on": [],
  "footer_location": true
}},
{{
  "field_name": "date_graphique",
  "extraction_method": "regex_match",
  "search_keywords": ["date", "graphique", "chart date", "Diagrammdatum"],
  "auto_synonyms": {{
    "fr": ["date création graphique", "période représentée", "actualisation graphique"],
    "en": ["chart creation date", "period shown", "chart update"],
    "de": ["Diagrammerstellungsdatum", "dargestellter Zeitraum", "Diagrammaktualisierung"]
  }},
  "expected_format": "YYYY ou MM/YYYY",
  "validation_rule": "must_match_format",
  "validation_priority": 0,
  "depends_on": [],
  "regex_pattern": "20[0-9]{{2}}|(0[1-9]|1[0-2])/20[0-9]{{2}}",
  "footer_location": true
}}

Règle: "Page de garde doit indiquer nom du fonds, mois et année (format MM/YYYY), mention 'document promotionnel'"
→ Champs:
{{
  "field_name": "nom_fonds",
  "extraction_method": "text_search",
  "search_keywords": ["nom", "fonds", "fund name", "Fondsname"],
  "auto_synonyms": {{
    "fr": ["dénomination", "intitulé", "appellation"],
    "en": ["fund title", "fund denomination", "product name"],
    "de": ["Fonds", "Produktname", "Bezeichnung"]
  }},
  "expected_format": "text",
  "validation_rule": "must_be_present",
  "validation_priority": 0,
  "depends_on": []
}},
{{
  "field_name": "date_document",
  "extraction_method": "regex_match",
  "search_keywords": ["date", "mois", "année", "month", "year", "Monat", "Jahr"],
  "auto_synonyms": {{
    "fr": ["datation", "période", "millésime"],
    "en": ["period", "vintage", "edition"],
    "de": ["Datum", "Zeitraum", "Jahrgang"]
  }},
  "expected_format": "MM/YYYY ou Mois YYYY",
  "validation_rule": "must_match_format",
  "validation_priority": 0,
  "depends_on": [],
  "regex_pattern": "(0[1-9]|1[0-2])/20[0-9]{{2}}|([Jj]anvier|[Ff]évrier|[Mm]ars|[Aa]vril|[Mm]ai|[Jj]uin|[Jj]uillet|[Aa]oût|[Ss]eptembre|[Oo]ctobre|[Nn]ovembre|[Dd]écembre)\\s+20[0-9]{{2}}"
}},
{{
  "field_name": "mention_promotionnel",
  "extraction_method": "text_presence",
  "search_keywords": ["document promotionnel", "promotional document", "Werbedokument"],
  "auto_synonyms": {{
    "fr": ["document marketing", "support commercial", "matériel publicitaire"],
    "en": ["marketing material", "advertising document", "promotional material"],
    "de": ["Marketingdokument", "Werbematerial", "Verkaufsunterlage"]
  }},
  "expected_format": "exact_text",
  "validation_rule": "must_contain_exact_text",
  "validation_priority": 0,
  "depends_on": []
}}

Règle: "Disclaimer PRIIPS en gras, même taille que texte principal"
→ Champs:
{{
  "field_name": "disclaimer_priips_text",
  "extraction_method": "text_search",
  "search_keywords": ["PRIIPS", "DIC", "DICI", "KID"],
  "auto_synonyms": {{
    "fr": ["document d'informations clés", "informations essentielles"],
    "en": ["key information document", "essential information"],
    "de": ["Basisinformationsblatt", "wesentliche Informationen"]
  }},
  "validation_rule": "must_be_present",
  "validation_priority": 0,
  "depends_on": []
}},
{{
  "field_name": "disclaimer_priips_bold",
  "extraction_method": "style_check",
  "search_keywords": ["gras", "bold", "fett"],
  "auto_synonyms": {{
    "fr": ["caractères gras", "texte en gras"],
    "en": ["bold text", "bold font"],
    "de": ["fetter Text", "Fettdruck"]
  }},
  "expected_format": "bold=true",
  "validation_rule": "style_must_be_bold",
  "validation_priority": 1,
  "depends_on": ["disclaimer_priips_text"]
}},
{{
  "field_name": "disclaimer_priips_font_size",
  "extraction_method": "style_check",
  "search_keywords": ["taille", "font size", "Schriftgröße"],
  "auto_synonyms": {{
    "fr": ["taille de police", "corps de texte"],
    "en": ["font size", "text size"],
    "de": ["Schriftgröße", "Textgröße"]
  }},
  "expected_format": "same_as_body_text",
  "validation_rule": "size_equals_body",
  "validation_priority": 1,
  "depends_on": ["disclaimer_priips_text"]
}}

Règle: "Disclaimer PRIIPS obligatoire (cf. Glossaire des disclaimers, référence DISCLAIMER_PRIIPS_V2)"
→ Champs:
{{
  "field_name": "disclaimer_priips",
  "extraction_method": "external_lookup",
  "search_keywords": ["PRIIPS", "DIC", "DICI", "document d'informations clés"],
  "expected_format": "exact_match_from_glossary",
  "validation_rule": "must_match_external_reference",
  "external_doc_type": "glossaire_disclaimers",
  "external_doc_ref": "DISCLAIMER_PRIIPS_V2"
}}

Règle: "Performances obligatoires SAUF si présentation de gamme"
→ Champs:
{{
  "field_name": "performance_data",
  "extraction_method": "data_extraction",
  "search_keywords": ["performance", "rendement", "return"],
  "validation_rule": "conditional_presence",
  "condition": "required_unless_presentation_type_is_gamme"
}}

Règle: "Vérifier que le fonds est autorisé dans les pays mentionnés (cf. Registration of Funds Excel)"
→ Champs:
{{
  "field_name": "pays_mentions",
  "extraction_method": "data_extraction",
  "search_keywords": ["pays", "country", "zone géographique"],
  "validation_rule": "must_be_in_authorized_list",
  "external_doc_type": "registration_of_funds",
  "external_doc_ref": "authorized_countries_list"
}}

Règle: "Montants en euros avec format: 1 234,56 € ou 1.234,56 EUR"
→ Champs:
{{
  "field_name": "montant_euro",
  "extraction_method": "regex_match",
  "search_keywords": ["euro", "€", "EUR", "montant"],
  "expected_format": "1 234,56 € ou 1.234,56 EUR",
  "validation_rule": "must_match_currency_format",
  "regex_pattern": "[0-9]{{1,3}}([\\s.]?[0-9]{{3}})*,[0-9]{{2}}\\s*(€|EUR)"
}}

ANALYSE DES RÉFÉRENCES EXTERNES:
Si la règle mentionne:
- "Glossaire", "disclaimers" → external_doc_type: "glossaire_disclaimers"
- "Prospectus", "DICI", "KID" → external_doc_type: "prospectus"
- "Registration", "pays autorisés" → external_doc_type: "registration_of_funds"

ANALYSE DES CONDITIONS:
Si la règle contient:
- "SAUF SI", "UNIQUEMENT SI", "À L'EXCEPTION DE" → Créer règle conditionnelle
- "SELON LE TYPE", "DÉPEND DE" → Créer règle conditionnelle

ANALYSE DES FORMATS:
Si la règle spécifie un format précis:
- Date (JJ/MM/AAAA, MM/YYYY, etc.) → regex_pattern
- Montant (devise, séparateurs) → regex_pattern
- Email, téléphone, URL → regex_pattern
- Pourcentage, nombre → regex_pattern

RÉPONDS UNIQUEMENT EN JSON:
{{
  "fields_to_extract": [
    {{
      "field_name": "nom_du_champ",
      "extraction_method": "text_search|text_presence|style_check|position_check|data_extraction|regex_match|external_lookup",
      "search_keywords": ["mot1_fr", "mot1_en", "mot1_de"],
      "auto_synonyms": {{
        "fr": ["synonyme1", "synonyme2"],
        "en": ["synonym1", "synonym2"],
        "de": ["Synonym1", "Synonym2"]
      }},
      "validation_priority": 0,
      "depends_on": ["champ_requis_avant"],
      "expected_format": "format attendu",
      "validation_rule": "règle de validation",
      "regex_pattern": "pattern regex si applicable",
      "external_doc_type": "type doc externe si applicable",
      "external_doc_ref": "référence exacte si applicable",
      "footer_location": true  // SEULEMENT si bas de page/footer
    }}
  ],
  "validation_criteria": {{
    "check_type": "presence|format|style|order|value|external|conditional",
    "success_condition": "condition de succès",
    "failure_action": "action si échec"
  }},
  "external_references": [
    {{
      "doc_type": "glossaire_disclaimers|prospectus|registration_of_funds",
      "reference": "référence exacte",
      "field_name": "champ concerné",
      "match_type": "exact|fuzzy|contains",
      "similarity_threshold": 0.9
    }}
  ],
  "conditional_rules": [
    {{
      "condition_type": "unless|only_if|depends_on",
      "condition_field": "champ de condition",
      "condition_value": "valeur attendue",
      "applies_to_field": "champ cible",
      "explanation": "explication de la condition"
    }}
  ],
  "format_validations": [
    {{
      "field_name": "champ concerné",
      "format_type": "date|currency|percentage|email|phone|url|number",
      "regex_pattern": "pattern regex",
      "expected_examples": ["exemple1", "exemple2"],
      "error_message": "message si non conforme"
    }}
  ],
  "validation_priority": 0,
  "field_dependencies": ["champ1", "champ2"]
}}"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=2000
            )
            
            content = response.choices[0].message.content
            if content is None:
                raise ValueError("Réponse LLM vide")
            content = content.strip()
            
            # Nettoyage
            if content.startswith("```"):
                content = "\n".join(content.split("\n")[1:-1])
            
            # Correction automatique des barres obliques pour les regex JSON
            import re
            content = re.sub(r'("regex_pattern":\s*")(.*?)(")', 
                             lambda m: m.group(1) + m.group(2).replace('\\', '\\\\') + m.group(3), 
                             content)

            result = json.loads(content)
            
            # Extraire les nouvelles sections enrichies
            external_refs = result.get("external_references", [])
            conditional_rules_data = result.get("conditional_rules", [])
            format_validations_data = result.get("format_validations", [])
            validation_priority = result.get("validation_priority", 1)
            field_dependencies = result.get("field_dependencies", [])
            
            check_item = ComplianceCheckItem(
                rule_id=rule_id,
                rule_category=category,
                rule_description=description,
                slide_location=slide_location,
                fields_to_extract=result.get("fields_to_extract", []),
                validation_criteria=result.get("validation_criteria", {}),
                severity=severity,
                required=required,
                external_references=external_refs,
                conditional_rules=conditional_rules_data,
                format_validations=format_validations_data,
                validation_priority=validation_priority,
                field_dependencies=field_dependencies
            )
            
            # Affichage enrichi
            extras = []
            if external_refs:
                extras.append(f"{len(external_refs)} ext.refs")
            if conditional_rules_data:
                extras.append(f"{len(conditional_rules_data)} conditions")
            if format_validations_data:
                extras.append(f"{len(format_validations_data)} formats")
            
            extras_str = f" ({', '.join(extras)})" if extras else ""
            print(f"✅ {rule_id}: {len(check_item.fields_to_extract)} champs → {slide_location}{extras_str}")
            
            # Sauvegarder en cache
            if self.enable_cache and self.cache is not None:
                cache_key = self._get_cache_key(rule)
                self.cache[cache_key] = {
                    "fields_to_extract": check_item.fields_to_extract,
                    "validation_criteria": check_item.validation_criteria,
                    "external_references": check_item.external_references,
                    "conditional_rules": check_item.conditional_rules,
                    "format_validations": check_item.format_validations
                }
            
            return check_item
            
        except Exception as e:
            print(f"❌ Erreur {rule_id}: {e}")
            
            # Fallback basique
            return ComplianceCheckItem(
                rule_id=rule_id,
                rule_category=category,
                rule_description=description,
                slide_location=slide_location,
                fields_to_extract=[],
                validation_criteria={"error": str(e)},
                severity=severity,
                required=required
            )
    
    def _extract_concepts_from_rule(self, description: str) -> List[str]:
        """PASS 1 : Extrait les concepts-clés de la règle (analyse sémantique)"""
        prompt = f"""Analyse cette règle de conformité et extrais TOUS les concepts/éléments distincts mentionnés.

RÈGLE : {description}

INSTRUCTIONS :
1. Identifie CHAQUE élément séparé (ne groupe JAMAIS)
2. Si "source et date" → liste ["source", "date"]
3. Si "études/données/graphiques" → liste ["études", "données", "graphiques"]
4. Inclus aussi les attributs (taille, couleur, position, format, etc.)

Réponds UNIQUEMENT avec un tableau JSON de concepts.
Exemple : ["source", "date", "taille police", "position"]
"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
                max_tokens=500
            )
            
            content = response.choices[0].message.content
            if content is None:
                return []
            
            content = content.strip()
            if content.startswith("```"):
                import re
                m = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", content)
                if m:
                    content = m.group(1)
            
            concepts = json.loads(content)
            return concepts if isinstance(concepts, list) else []
        except Exception as e:
            print(f"  ⚠️  Erreur extraction concepts : {e}")
            return []
    
    def _generate_fields_from_concepts(self, rule_id: str, description: str, concepts: List[str], slide_location: str) -> Optional[Dict[str, Any]]:
        """PASS 2 : Génère les champs à partir des concepts identifiés"""
        if not concepts:
            return None
        
        concepts_str = ", ".join(concepts)
        
        prompt = f"""Tu es expert en conformité. Génère des champs d'extraction PRÉCIS.

RÈGLE : {description}

CONCEPTS IDENTIFIÉS : {concepts_str}

Pour CHAQUE concept, crée UN champ distinct avec :
- field_name (snake_case, précis, ex: "source_etude", "date_graphique")
- extraction_method
- search_keywords (FR, EN, DE)
- auto_synonyms (FR, EN, DE)
- validation_priority (0-3)
- depends_on (si dépendance)
- expected_format
- validation_rule
- regex_pattern (si format)

RÉPONDS UNIQUEMENT EN JSON :
{{
  "fields_to_extract": [...],
  "validation_criteria": {{}},
  "external_references": [],
  "conditional_rules": [],
  "format_validations": [],
  "validation_priority": 0,
  "field_dependencies": []
}}
"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=2000
            )
            
            content = response.choices[0].message.content
            if content is None:
                return None
            
            content = content.strip()
            if content.startswith("```"):
                import re
                m = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", content)
                if m:
                    content = m.group(1)
            
            result = json.loads(content)
            return result
        except Exception as e:
            print(f"  ⚠️  Erreur génération champs : {e}")
            return None
    
    def _analyze_rule_semantics(self, description: str, category: str) -> Optional[Dict[str, Any]]:
        """PHASE 1: Analyse sémantique intelligente de la règle"""
        prompt = f"""Analyse cette règle de conformité et liste TOUS les éléments distincts à vérifier.

RÈGLE: {description}

INSTRUCTIONS:
1. Si "X et Y" ou "X/Y" → sépare en 2 concepts distincts
2. Si "études/données/graphiques" avec "source et date" → 6 champs (source_etude, date_etude, source_donnee, date_donnee, source_graphique, date_graphique)
3. Liste TOUS attributs: contenu + style + format + position

RÉPONDS UNIQUEMENT avec un tableau JSON de concepts:
["concept1", "concept2", "concept3"]

Exemple:
Règle: "études/données doivent avoir source et date"
Réponse: ["source_etude", "date_etude", "source_donnee", "date_donnee"]
"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
                max_tokens=500
            )
            
            content = response.choices[0].message.content
            if not content or content.strip() == "":
                return None
            
            content = content.strip()
            if content.startswith("```"):
                import re
                m = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", content)
                if m:
                    content = m.group(1).strip()
            
            # Parse as simple array
            concepts_list = json.loads(content)
            if not isinstance(concepts_list, list) or len(concepts_list) == 0:
                return None
            
            # Convert to expected format
            return {
                "field_concepts": [
                    {
                        "concept": c,
                        "type": "content",
                        "attributes": [],
                        "multiplicity": "single",
                        "description": ""
                    }
                    for c in concepts_list
                ],
                "rule_type": "presence",
                "complexity": "medium"
            }
        except Exception as e:
            print(f"  ⚠️  Erreur analyse sémantique : {e}")
            return None
    
    def _generate_precise_fields(self, rule_id: str, description: str, category: str, 
                                slide_location: str, semantic_analysis: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """PHASE 2: Génération précise des champs depuis l'analyse sémantique"""
        
        concepts = [c['concept'] for c in semantic_analysis.get("field_concepts", [])]
        concepts_str = ", ".join(concepts)
        
        prompt = f"""Génère des champs d'extraction pour cette règle de conformité.

RÈGLE: {description}
CONCEPTS IDENTIFIÉS: {concepts_str}

Crée UN CHAMP par concept avec:
- field_name (snake_case, ex: source_etude, date_graphique)
- extraction_method (text_search, data_extraction, style_check, regex_match)
- search_keywords (FR, EN, DE)
- auto_synonyms (fr/en/de avec 2-3 synonymes chacun)
- validation_priority (0-3)
- expected_format si applicable
- validation_rule
- regex_pattern si nécessaire

RÉPONDS EN JSON:
{{
  "fields_to_extract": [
    {{
      "field_name": "nom_champ",
      "extraction_method": "text_search",
      "search_keywords": ["mot", "word", "Wort"],
      "auto_synonyms": {{"fr": ["syn1"], "en": ["syn1"], "de": ["syn1"]}},
      "validation_priority": 0,
      "depends_on": [],
      "validation_rule": "must_be_present"
    }}
  ],
  "validation_criteria": {{}},
  "external_references": [],
  "conditional_rules": [],
  "format_validations": [],
  "validation_priority": 0,
  "field_dependencies": []
}}
"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=2500
            )
            
            content = response.choices[0].message.content
            if not content or content.strip() == "":
                return None
            
            content = content.strip()
            if content.startswith("```"):
                import re
                m = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", content)
                if m:
                    content = m.group(1).strip()
            
            result = json.loads(content)
            return result
        except Exception as e:
            print(f"  ⚠️  Erreur génération précise : {e}")
            return None
    
    def generate_full_checklist(self) -> Dict[str, Any]:
        """Génère la checklist complète"""
        rules = self.rules_data.get("rules", [])
        
        print(f"📋 Génération checklist depuis {len(rules)} règles...")
        print("=" * 70)
        
        # STRUCTURE CORRIGÉE - 5 CATÉGORIES DE RÈGLES
        checklist_by_location = {
            "regles_generales": [],      # Règles générales (s'appliquent partout)
            "page_de_garde": [],         # Règles spécifiques slide 1
            "slide_2": [],               # Règles spécifiques slide 2
            "pages_suivantes": [],       # Règles spécifiques slides 3+
            "page_finale": []             # Règles dernière slide uniquement
        }
        
        all_check_items = []
        
        for i, rule in enumerate(rules, 1):
            rule_id = rule.get("rule_id", "N/A")
            category = rule.get("category", "unknown")
            
            print(f"[{i}/{len(rules)}] {rule_id} ({category})...")
            
            # Générer check item
            check_item = self.generate_check_item(rule)
            all_check_items.append(check_item)
            
            # Organiser par catégorie de règle
            location = check_item.slide_location
            if location in checklist_by_location:
                checklist_by_location[location].append(check_item.to_dict())
            else:
                # Fallback vers règles générales
                checklist_by_location["regles_generales"].append(check_item.to_dict())
            
            time.sleep(0.5)  # Rate limiting
        
        # Sauvegarder cache
        if self.enable_cache:
            self._save_cache()
            print(f"\n📂 Cache sauvegardé : {len(self.cache or {})} entrées")
        
        # Statistiques
        total_fields = sum(
            len(item.fields_to_extract) 
            for item in all_check_items
        )
        
        total_external_refs = sum(
            len(item.external_references)
            for item in all_check_items
        )
        
        total_conditional_rules = sum(
            len(item.conditional_rules)
            for item in all_check_items
        )
        
        total_format_validations = sum(
            len(item.format_validations)
            for item in all_check_items
        )
        
        critical_rules = [
            item for item in all_check_items 
            if item.severity == "critique"
        ]
        
        # Grouper références externes par type
        external_refs_by_type = {}
        for item in all_check_items:
            for ref in item.external_references:
                doc_type = ref.get("doc_type", "unknown")
                external_refs_by_type[doc_type] = external_refs_by_type.get(doc_type, 0) + 1
        
        checklist = {
            "compliance_checklist": checklist_by_location,
            "statistics": {
                "total_rules": len(rules),
                "total_check_items": len(all_check_items),
                "total_fields_to_extract": total_fields,
                "total_external_references": total_external_refs,
                "total_conditional_rules": total_conditional_rules,
                "total_format_validations": total_format_validations,
                "critical_rules": len(critical_rules),
                "rules_by_location": {
                    loc: len(items) 
                    for loc, items in checklist_by_location.items() 
                    if items
                },
                "rules_by_severity": {
                    "critique": len([i for i in all_check_items if i.severity == "critique"]),
                    "majeure": len([i for i in all_check_items if i.severity == "majeure"]),
                    "mineure": len([i for i in all_check_items if i.severity == "mineure"])
                },
                "external_references_by_type": external_refs_by_type
            },
            "metadata": {
                "model_used": self.model,
                "generation_method": "compliance_checklist_llm_enriched",
                "purpose": "PowerPoint extraction and validation with external docs and conditional rules",
                "features": [
                    "format_validation",
                    "external_references",
                    "conditional_rules",
                    "regex_patterns"
                ]
            }
        }
        
        return checklist
    
    def save_checklist(self, output_path: Path):
        """Sauvegarde la checklist"""
        checklist = self.generate_full_checklist()
        
        with output_path.open("w", encoding="utf-8") as f:
            json.dump(checklist, f, ensure_ascii=False, indent=2)
        
        print(f"\n💾 Checklist sauvegardée: {output_path}")
        print(f"\n📊 STATISTIQUES:")
        stats = checklist["statistics"]
        print(f"  - Règles analysées: {stats['total_rules']}")
        print(f"  - Items de vérification: {stats['total_check_items']}")
        print(f"  - Champs à extraire: {stats['total_fields_to_extract']}")
        print(f"  - Règles critiques: {stats['critical_rules']}")
        
        print(f"\n✨ FONCTIONNALITÉS ENRICHIES:")
        print(f"  - Références externes: {stats['total_external_references']}")
        if stats['external_references_by_type']:
            for doc_type, count in stats['external_references_by_type'].items():
                print(f"    • {doc_type}: {count}")
        print(f"  - Règles conditionnelles: {stats['total_conditional_rules']}")
        print(f"  - Validations de format: {stats['total_format_validations']}")
        
        print(f"\n📍 PAR LOCATION:")
        for loc, count in stats['rules_by_location'].items():
            print(f"  - {loc}: {count} règles")


def main():
    """Génère la checklist de conformité"""
    import sys
    from pathlib import Path
    
    scripts_dir = Path(__file__).parent.parent
    sys.path.insert(0, str(scripts_dir))
    
    from config import RULES_JSON, GROQ_API_KEY, EXTRACTED_DIR
    
    if not RULES_JSON.exists():
        print(f"❌ Fichier introuvable: {RULES_JSON}")
        return
    
    print("GENERATEUR DE CHECKLIST DE CONFORMITE")
    print("=" * 70)
    
    try:
        generator = ComplianceChecklistGenerator(
            groq_api_key=GROQ_API_KEY or "",
            rules_file=RULES_JSON
        )
        
        output_path = EXTRACTED_DIR / "compliance_checklist.json"
        generator.save_checklist(output_path)
        
        print("\n✅ Checklist générée avec succès!")
        print(f"\n📌 PROCHAINE ÉTAPE:")
        print(f"   Utiliser cette checklist pour extraire les données du PowerPoint")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()