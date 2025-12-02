"""
Smart Disclaimers Extractor
Extraction intelligente multi-pass des disclaimers avec LLM Groq
Similaire à SmartRulesExtractor mais adapté pour les disclaimers Excel
"""

import pandas as pd
import json
import os
from groq import Groq
from typing import List, Dict, Optional
from pathlib import Path
import re


class SmartDisclaimersExtractor:
    """
    Extracteur intelligent de disclaimers avec analyse LLM multi-pass
    
    Architecture:
    - Pass 1: Lecture Excel brute (pandas)
    - Pass 2: Analyse sémantique (LLM)
    - Pass 3: Structuration avancée (LLM)
    - Pass 4: Validation et scoring (LLM)
    """
    
    def __init__(self, excel_path: str):
        """
        Initialise l'extracteur
        
        Args:
            excel_path: Chemin vers le fichier Excel des disclaimers
        """
        self.excel_path = excel_path
        
        # Initialiser client Groq
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY non trouvée dans .env")
        
        self.client = Groq(api_key=api_key)
        self.model = "llama-3.3-70b-versatile"
        
        # Résultats
        self.disclaimers_raw = []
        self.disclaimers_analyzed = []
        self.disclaimers_structured = []
        self.disclaimers_final = []
    
    def extract(self) -> Dict:
        """
        Extraction complète en 4 passes
        
        Returns:
            Dictionnaire avec disclaimers et métadonnées
        """
        print("=" * 80)
        print("🤖 SMART DISCLAIMERS EXTRACTOR - Extraction Intelligente")
        print("=" * 80)
        print()
        
        # Pass 1: Lecture Excel
        print("[Pass 1/4] Lecture Excel brute")
        print("-" * 80)
        self.disclaimers_raw = self._pass1_read_excel()
        print(f"✅ {len(self.disclaimers_raw)} disclaimers extraits")
        print()
        
        # Pass 2: Analyse sémantique
        print("[Pass 2/4] Analyse sémantique avec LLM")
        print("-" * 80)
        self.disclaimers_analyzed = self._pass2_semantic_analysis()
        print(f"✅ {len(self.disclaimers_analyzed)} disclaimers analysés")
        print()
        
        # Pass 3: Structuration avancée
        print("[Pass 3/4] Structuration avancée")
        print("-" * 80)
        self.disclaimers_structured = self._pass3_advanced_structure()
        print(f"✅ {len(self.disclaimers_structured)} disclaimers structurés")
        print()
        
        # Pass 4: Validation et scoring
        print("[Pass 4/4] Validation et scoring")
        print("-" * 80)
        self.disclaimers_final = self._pass4_validation()
        print(f"✅ {len(self.disclaimers_final)} disclaimers validés")
        print()
        
        # Résultat final
        result = {
            "disclaimers": self.disclaimers_final,
            "metadata": {
                "total_disclaimers": len(self.disclaimers_final),
                "source_file": self.excel_path,
                "extraction_model": self.model,
                "languages": ["french", "english", "german"]
            }
        }
        
        print("=" * 80)
        print("✅ EXTRACTION TERMINÉE AVEC SUCCÈS")
        print("=" * 80)
        
        return result
    
    def _pass1_read_excel(self) -> List[Dict]:
        """
        Pass 1: Lecture Excel avec pandas
        Extrait les textes bruts des 3 langues
        """
        disclaimers = []
        
        try:
            # Lire les 3 feuilles
            df_en = pd.read_excel(self.excel_path, sheet_name='ENGLISH')
            df_fr = pd.read_excel(self.excel_path, sheet_name='FRENCH')
            df_de = pd.read_excel(self.excel_path, sheet_name='GERMAN')
            
            print(f"   📄 Feuille ENGLISH: {len(df_en)} lignes")
            print(f"   📄 Feuille FRENCH: {len(df_fr)} lignes")
            print(f"   📄 Feuille GERMAN: {len(df_de)} lignes")
            
            # Utiliser le minimum de lignes pour éviter les erreurs d'index
            max_rows = min(len(df_en), len(df_fr), len(df_de))
            print(f"   ✅ Traitement de {max_rows} lignes (minimum commun)")
            
            # Parcourir les lignes
            for i in range(max_rows):
                # Extraire données brutes
                doc_type = df_en.iloc[i, 0] if pd.notna(df_en.iloc[i, 0]) else ""
                client_cat = df_en.iloc[i, 2] if pd.notna(df_en.iloc[i, 2]) else ""
                
                text_en = df_en.iloc[i, 1] if pd.notna(df_en.iloc[i, 1]) else ""
                text_fr = df_fr.iloc[i, 1] if pd.notna(df_fr.iloc[i, 1]) else ""
                text_de = df_de.iloc[i, 1] if pd.notna(df_de.iloc[i, 1]) else ""
                
                # Ignorer lignes vides
                if not text_en and not text_fr and not text_de:
                    continue
                
                disclaimer = {
                    "id": f"DISC_{i+1:03d}",
                    "row_number": i + 1,
                    "document_type_raw": str(doc_type),
                    "client_category_raw": str(client_cat),
                    "texts": {
                        "english": str(text_en),
                        "french": str(text_fr),
                        "german": str(text_de)
                    }
                }
                
                disclaimers.append(disclaimer)
            
        except Exception as e:
            print(f"❌ Erreur lecture Excel: {e}")
            raise
        
        return disclaimers
    
    def _pass2_semantic_analysis(self) -> List[Dict]:
        """
        Pass 2: Analyse sémantique avec LLM
        Extrait contexte, éléments clés, conditions d'application
        """
        analyzed = []
        
        for i, disclaimer in enumerate(self.disclaimers_raw, 1):
            print(f"   Analyse {i}/{len(self.disclaimers_raw)}: {disclaimer['id']}")
            
            # Préparer prompt
            prompt = self._create_analysis_prompt(disclaimer)
            
            try:
                # Appeler LLM
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {
                            "role": "system",
                            "content": "Tu es un expert en conformité financière. Analyse les disclaimers et extrait les informations structurées en JSON."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    temperature=0.1,
                    max_tokens=2000
                )
                
                # Parser réponse
                analysis_text = response.choices[0].message.content
                analysis = self._parse_llm_response(analysis_text)
                
                # Fusionner avec disclaimer original
                disclaimer_analyzed = {**disclaimer, **analysis}
                analyzed.append(disclaimer_analyzed)
                
            except Exception as e:
                print(f"   ⚠️  Erreur analyse {disclaimer['id']}: {e}")
                # Garder disclaimer sans analyse
                analyzed.append(disclaimer)
        
        return analyzed
    
    def _create_analysis_prompt(self, disclaimer: Dict) -> str:
        """Crée le prompt pour l'analyse sémantique"""
        
        text_fr = disclaimer['texts']['french']
        doc_type = disclaimer['document_type_raw']
        client_cat = disclaimer['client_category_raw']
        
        prompt = f"""
Analyse ce disclaimer financier et extrait les informations suivantes en JSON:

DISCLAIMER:
Type de document: {doc_type}
Catégorie client: {client_cat}
Texte (français): {text_fr[:1000]}...

EXTRAIT EN JSON:
{{
  "client_type": "retail" ou "professional",
  "management_company": "OBAM SAS" ou "OBAM GmbH" ou "OBAM Lux",
  "contexts": ["performances", "risques", "frais", "distribution", etc.],
  "key_mentions": [
    "performances passées",
    "risque de perte en capital",
    "consulter le DIC",
    etc.
  ],
  "applicable_when": {{
    "has_performances": true/false,
    "has_risk_profile": true/false,
    "is_new_product": true/false,
    "document_types": ["presentation", "factsheet", "reporting"]
  }},
  "keywords": ["mot-clé 1", "mot-clé 2", ...]
}}

IMPORTANT:
- Sois précis et exhaustif
- Identifie TOUS les contextes d'application
- Extrait TOUTES les mentions importantes
- Réponds UNIQUEMENT en JSON valide
"""
        
        return prompt
    
    def _pass3_advanced_structure(self) -> List[Dict]:
        """
        Pass 3: Structuration avancée
        Découpe en sections, identifie mentions obligatoires
        """
        structured = []
        
        for i, disclaimer in enumerate(self.disclaimers_analyzed, 1):
            print(f"   Structuration {i}/{len(self.disclaimers_analyzed)}: {disclaimer['id']}")
            
            # Préparer prompt
            prompt = self._create_structure_prompt(disclaimer)
            
            try:
                # Appeler LLM
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {
                            "role": "system",
                            "content": "Tu es un expert en structuration de documents financiers. Découpe les disclaimers en sections sémantiques."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    temperature=0.1,
                    max_tokens=2000
                )
                
                # Parser réponse
                structure_text = response.choices[0].message.content
                structure = self._parse_llm_response(structure_text)
                
                # Fusionner
                disclaimer_structured = {**disclaimer, **structure}
                structured.append(disclaimer_structured)
                
            except Exception as e:
                print(f"   ⚠️  Erreur structuration {disclaimer['id']}: {e}")
                structured.append(disclaimer)
        
        return structured
    
    def _create_structure_prompt(self, disclaimer: Dict) -> str:
        """Crée le prompt pour la structuration"""
        
        text_fr = disclaimer['texts']['french']
        
        prompt = f"""
Découpe ce disclaimer en sections sémantiques et identifie les mentions obligatoires:

TEXTE:
{text_fr[:1500]}

STRUCTURE EN JSON:
{{
  "sections": [
    {{
      "order": 1,
      "type": "identification_emetteur",
      "text": "Ce document est établi par...",
      "required": true
    }},
    {{
      "order": 2,
      "type": "avertissement_risques",
      "text": "Le fonds présente un risque...",
      "required": true
    }}
  ],
  "required_elements": [
    {{
      "element": "performances_passees_disclaimer",
      "text": "Les performances passées ne préjugent pas...",
      "present": true
    }}
  ]
}}

TYPES DE SECTIONS POSSIBLES:
- identification_emetteur
- avertissement_conseil
- avertissement_risques
- avertissement_performances
- obligation_documentation
- informations_legales
- politique_reclamations
- droits_investisseurs

Réponds UNIQUEMENT en JSON valide.
"""
        
        return prompt
    
    def _pass4_validation(self) -> List[Dict]:
        """
        Pass 4: Validation et scoring
        Vérifie complétude et calcule score de confiance
        """
        validated = []
        
        for i, disclaimer in enumerate(self.disclaimers_structured, 1):
            print(f"   Validation {i}/{len(self.disclaimers_structured)}: {disclaimer['id']}")
            
            # Calculer score de confiance
            confidence = self._calculate_confidence(disclaimer)
            
            # Valider complétude
            completeness = self._check_completeness(disclaimer)
            
            # Ajouter métadonnées finales
            disclaimer_final = {
                **disclaimer,
                "confidence_score": confidence,
                "completeness": completeness,
                "status": "validated" if confidence > 0.8 else "to_review",
                "extraction_model": self.model
            }
            
            validated.append(disclaimer_final)
        
        return validated
    
    def _calculate_confidence(self, disclaimer: Dict) -> float:
        """Calcule le score de confiance de l'extraction"""
        score = 0.0
        
        # Présence de textes (30%)
        if disclaimer.get('texts', {}).get('french'):
            score += 0.1
        if disclaimer.get('texts', {}).get('english'):
            score += 0.1
        if disclaimer.get('texts', {}).get('german'):
            score += 0.1
        
        # Présence d'analyse (30%)
        if disclaimer.get('client_type'):
            score += 0.1
        if disclaimer.get('contexts'):
            score += 0.1
        if disclaimer.get('keywords'):
            score += 0.1
        
        # Présence de structure (40%)
        if disclaimer.get('sections'):
            score += 0.2
        if disclaimer.get('required_elements'):
            score += 0.2
        
        return round(score, 2)
    
    def _check_completeness(self, disclaimer: Dict) -> Dict:
        """Vérifie la complétude de l'extraction"""
        return {
            "has_texts": bool(disclaimer.get('texts')),
            "has_analysis": bool(disclaimer.get('contexts')),
            "has_structure": bool(disclaimer.get('sections')),
            "has_keywords": bool(disclaimer.get('keywords'))
        }
    
    def _parse_llm_response(self, response_text: str) -> Dict:
        """Parse la réponse JSON du LLM"""
        try:
            # Nettoyer la réponse
            cleaned = self._clean_json_response(response_text)
            
            # Parser JSON
            data = json.loads(cleaned)
            return data
            
        except json.JSONDecodeError as e:
            print(f"   ⚠️  Erreur parsing JSON: {e}")
            return {}
    
    def _clean_json_response(self, text: str) -> str:
        """Nettoie la réponse JSON du LLM"""
        # Extraire JSON entre ```json et ```
        json_match = re.search(r'```json\s*(.*?)\s*```', text, re.DOTALL)
        if json_match:
            text = json_match.group(1)
        
        # Extraire JSON entre { et }
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            text = json_match.group(0)
        
        # Normaliser échappements
        text = text.replace('\\\\', '\\')
        
        return text
    
    def save_to_json(self, output_path: str):
        """Sauvegarde les disclaimers en JSON"""
        result = {
            "disclaimers": self.disclaimers_final,
            "metadata": {
                "total_disclaimers": len(self.disclaimers_final),
                "source_file": self.excel_path,
                "extraction_model": self.model,
                "languages": ["french", "english", "german"]
            }
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Disclaimers sauvegardés: {output_path}")
