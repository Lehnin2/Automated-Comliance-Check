"""
Extracteur Intelligent de Règles avec Multi-Pass et Validation
Système en 3 passes pour garantir l'exhaustivité et la qualité
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Any, Tuple
from dotenv import load_dotenv
import fitz  # PyMuPDF

load_dotenv()


class SmartRulesExtractor:
    """Extracteur intelligent avec validation multi-pass"""
    
    def __init__(self, model: str = "llama-3.3-70b-versatile"):
        """
        Initialise l'extracteur intelligent
        
        Args:
            model: Modèle Groq à utiliser
        """
        self.model = model
        
        try:
            from groq import Groq
            
            api_key = os.getenv("GROQ_API_KEY")
            if not api_key or api_key == "votre_cle_groq_ici":
                raise ValueError("Clé API Groq manquante dans .env")
            
            self.client = Groq(api_key=api_key)
            print(f"[OK] Extracteur Intelligent avec Groq")
            print(f"    Modèle: {model}")
        except ImportError:
            print("[ERREUR] groq non installé")
            raise
    
    def extract_with_validation(self, pdf_path: str) -> Dict[str, Any]:
        """
        Extraction complète avec validation multi-pass
        
        Args:
            pdf_path: Chemin vers le PDF des règles
            
        Returns:
            Dict avec règles validées et rapport de confiance
        """
        print("\n" + "="*70)
        print("EXTRACTION INTELLIGENTE MULTI-PASS")
        print("="*70)
        
        # Extraire le texte du PDF
        print("\n[PASS 0] Extraction du texte du PDF...")
        full_text, pages_text = self._extract_pdf_text(pdf_path)
        print(f"[OK] {len(pages_text)} pages extraites")
        
        # PASS 1: Extraction initiale
        print("\n[PASS 1] Extraction des règles...")
        rules_v1 = self._pass1_extract_rules(full_text)
        print(f"[OK] {len(rules_v1)} règles extraites")
        
        # PASS 2: Vérification de complétude
        print("\n[PASS 2] Vérification de complétude...")
        rules_v2, missing_rules = self._pass2_verify_completeness(full_text, rules_v1)
        print(f"[OK] {len(missing_rules)} règles manquantes détectées")
        print(f"[OK] Total après Pass 2: {len(rules_v2)} règles")
        
        # PASS 3: Scoring et validation
        print("\n[PASS 3] Scoring de confiance...")
        rules_scored = self._pass3_score_confidence(rules_v2, pages_text)
        print(f"[OK] Scoring terminé")
        
        # Générer rapport
        report = self._generate_report(rules_scored)
        
        print("\n" + "="*70)
        print("✅ EXTRACTION TERMINÉE")
        print("="*70)
        
        return {
            "rules": rules_scored,
            "report": report,
            "statistics": self._compute_statistics(rules_scored)
        }
    
    def _extract_pdf_text(self, pdf_path: str) -> Tuple[str, List[str]]:
        """Extrait le texte du PDF page par page"""
        doc = fitz.open(pdf_path)
        full_text = ""
        pages_text = []
        
        for page_index in range(doc.page_count):
            page = doc[page_index]
            text = page.get_text()
            pages_text.append(text)
            full_text += f"\n--- Page {page_index + 1} ---\n{text}"
        
        doc.close()
        return full_text, pages_text
    
    def _pass1_extract_rules(self, text: str) -> List[Dict[str, Any]]:
        """
        PASS 1: Extraction initiale des règles
        """
        # Limiter la taille du texte
        max_chars = 20000
        if len(text) > max_chars:
            text = text[:max_chars]
        
        prompt = f"""Tu es un expert en conformité financière. Analyse le document de règles ci-dessous et extrait TOUTES les règles de conformité.

RÈGLES D'EXTRACTION CRITIQUES:
1. COPIE TEXTUELLEMENT les descriptions du PDF - NE RÉSUME PAS
2. INCLUS TOUS LES DÉTAILS:
   - Exemples concrets (ex: "selon notre opinion", "selon nos analyses")
   - Références aux fichiers (ex: "cf. Glossaire des disclaimers", "Registration abroad of Funds")
   - Spécifications techniques (ex: "en gras", "même police et taille", "note de bas de page")
   - Exceptions (ex: "sauf si présentation de gamme")
   - Conditions (ex: "à minima", "sur la même slide")
3. AJOUTE les notes de bas de page dans le champ "notes"
4. EXTRAIT le texte source exact dans "source_text"

Pour chaque règle, identifie:
- Le numéro de slide concerné (1, 2, 3, etc.) ou "any" si applicable à tous les slides
- La catégorie (page_de_garde, slide_2, performances, global, etc.)
- La sévérité (critique, majeure, mineure)

STRUCTURE JSON REQUISE:
{{
  "rules": [
    {{
      "rule_id": "RG.1",
      "category": "global",
      "slide_number": "any",
      "title": "Titre court de la règle",
      "description": "Description COMPLÈTE ET DÉTAILLÉE avec TOUS les détails, exemples, références, conditions et exceptions mentionnés dans le PDF",
      "required": true,
      "validation_type": "presence",
      "keywords": ["mot1", "mot2"],
      "error_message": "Message d'erreur",
      "severity": "critique",
      "source_text": "Texte EXACT extrait du PDF",
      "notes": "Notes de bas de page ou remarques associées",
      "references": ["Glossaire des disclaimers", "Autre fichier référencé"]
    }}
  ]
}}

DOCUMENT:
{text}

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Tu es un expert en conformité financière. Tu extrais et structures les règles AVEC TOUS LES DÉTAILS. Copie textuellement les descriptions, ne résume pas. Réponds UNIQUEMENT en JSON valide."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.05,
                max_tokens=16000
            )
            
            content = response.choices[0].message.content
            if content is None:
                print("[ERREUR] Réponse LLM vide")
                return []
            # Extraire bloc JSON si encapsulé dans ```json ... ```
            import re
            m = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", content)
            if m:
                content = m.group(1)
            
            # Extraire JSON
            json_start = content.find('{')
            json_end = content.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                json_str = content[json_start:json_end]
                # Sécuriser les backslashes Windows sans toucher \n, \t, \" ou \\
                json_str = re.sub(r"\\(?![nt\"\\])", r"\\\\", json_str)
                result = json.loads(json_str)
                return result.get("rules", [])
            else:
                print("[ERREUR] Pas de JSON dans la réponse")
                return []
        except Exception as e:
            print(f"[ERREUR] Pass 1: {e}")
            return []
    
    def _pass2_verify_completeness(
        self, 
        text: str, 
        existing_rules: List[Dict[str, Any]]
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        PASS 2: Vérification de complétude
        Demande au LLM s'il a oublié des règles
        """
        # Résumé des règles existantes
        rules_summary = "\n".join([
            f"- {r['rule_id']}: {r['title']}" 
            for r in existing_rules
        ])
        
        prompt = f"""Tu as extrait {len(existing_rules)} règles. Vérifie si tu as oublié des règles importantes.

RÈGLES DÉJÀ EXTRAITES:
{rules_summary}

DOCUMENT ORIGINAL (extrait):
{text[:15000]}

QUESTION: Y a-t-il des règles importantes que tu as oubliées?

Réponds en JSON:
{{
  "missing_rules": [
    {{
      "rule_id": "RX.X",
      "category": "...",
      "slide_number": "...",
      "title": "...",
      "description": "...",
      "required": true,
      "validation_type": "...",
      "keywords": [...],
      "error_message": "...",
      "severity": "..."
    }}
  ],
  "analysis": "Explication de ce qui manquait"
}}

Si rien ne manque, retourne {{"missing_rules": [], "analysis": "Complet"}}"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Tu es un expert en conformité. Vérifie l'exhaustivité. Réponds en JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.1,
                max_tokens=4000
            )
            
            content = response.choices[0].message.content
            if content is None:
                return existing_rules, []
            import re
            m = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", content)
            if m:
                content = m.group(1)
            json_start = content.find('{')
            json_end = content.rfind('}') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_str = content[json_start:json_end]
                
                # Sécuriser les backslashes Windows sans toucher \n, \t, \" ou \\
                json_str = re.sub(r"\\(?![nt\"\\])", r"\\\\", json_str)
                
                result = json.loads(json_str)
                missing = result.get("missing_rules", [])
                
                # Combiner règles existantes + manquantes
                all_rules = existing_rules + missing
                return all_rules, missing
            else:
                return existing_rules, []
        except Exception as e:
            print(f"[ERREUR] Pass 2: {e}")
            return existing_rules, []
    
    def _pass3_score_confidence(
        self, 
        rules: List[Dict[str, Any]], 
        pages_text: List[str]
    ) -> List[Dict[str, Any]]:
        """
        PASS 3: Calcul du score de confiance pour chaque règle
        """
        scored_rules = []
        
        for rule in rules:
            # Calculer score de confiance
            confidence = self._calculate_confidence(rule, pages_text)
            
            # Ajouter métadonnées
            rule["confidence_score"] = confidence
            rule["status"] = self._determine_status(confidence)
            
            scored_rules.append(rule)
        
        return scored_rules
    
    def _calculate_confidence(
        self, 
        rule: Dict[str, Any], 
        pages_text: List[str]
    ) -> float:
        """
        Calcule le score de confiance d'une règle
        Basé sur la présence des mots-clés dans le texte source
        """
        score = 0.5  # Score de base
        
        # Vérifier présence des mots-clés
        keywords = rule.get("keywords", [])
        if keywords:
            full_text = " ".join(pages_text).lower()
            matches = sum(1 for kw in keywords if kw.lower() in full_text)
            keyword_ratio = matches / len(keywords) if keywords else 0
            score += keyword_ratio * 0.3
        
        # Vérifier cohérence de la structure
        if rule.get("rule_id") and rule.get("title") and rule.get("description"):
            score += 0.1
        
        # Vérifier sévérité appropriée
        if rule.get("severity") in ["critique", "majeure", "mineure"]:
            score += 0.1
        
        return min(score, 1.0)
    
    def _determine_status(self, confidence: float) -> str:
        """Détermine le statut basé sur le score de confiance"""
        if confidence >= 0.8:
            return "validated"  # ✅ Auto-validé
        elif confidence >= 0.6:
            return "to_review"  # ⚠️ À vérifier
        else:
            return "to_correct"  # ❌ À corriger
    
    def _generate_report(self, rules: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Génère un rapport de validation"""
        validated = [r for r in rules if r["status"] == "validated"]
        to_review = [r for r in rules if r["status"] == "to_review"]
        to_correct = [r for r in rules if r["status"] == "to_correct"]
        
        return {
            "total_rules": len(rules),
            "validated": len(validated),
            "to_review": len(to_review),
            "to_correct": len(to_correct),
            "validation_rate": len(validated) / len(rules) if rules else 0,
            "rules_by_status": {
                "validated": [r["rule_id"] for r in validated],
                "to_review": [r["rule_id"] for r in to_review],
                "to_correct": [r["rule_id"] for r in to_correct]
            }
        }
    
    def _compute_statistics(self, rules: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calcule des statistiques sur les règles"""
        categories = {}
        severities = {}
        
        for rule in rules:
            cat = rule.get("category", "unknown")
            sev = rule.get("severity", "unknown")
            
            categories[cat] = categories.get(cat, 0) + 1
            severities[sev] = severities.get(sev, 0) + 1
        
        return {
            "by_category": categories,
            "by_severity": severities,
            "avg_confidence": sum(r["confidence_score"] for r in rules) / len(rules) if rules else 0
        }
    
    def save_results(
        self, 
        results: Dict[str, Any], 
        output_path: str
    ):
        """Sauvegarde les résultats"""
        out_path = Path(output_path)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        
        print(f"\n[OK] Résultats sauvegardés : {out_path}")
