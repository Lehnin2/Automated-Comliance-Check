"""
Rules Indexer
Charge et prépare les règles pour indexation dans ChromaDB
"""

import json
from pathlib import Path
from typing import List, Dict


class RulesIndexer:
    """Gère le chargement et la préparation des règles"""
    
    def __init__(self, rules_path: str = "DATA/rules/smart_extracted_rules.json"):
        """
        Initialise l'indexeur de règles
        
        Args:
            rules_path: Chemin vers le fichier JSON des règles
        """
        self.rules_path = rules_path
        self.rules = []
    
    def load_rules(self) -> List[Dict]:
        """
        Charge les règles depuis le fichier JSON
        
        Returns:
            Liste des règles
            
        Raises:
            FileNotFoundError: Si le fichier n'existe pas
            ValueError: Si le fichier est invalide ou vide
        """
        print(f"📂 Chargement des règles: {self.rules_path}")
        
        # Vérifier existence
        if not Path(self.rules_path).exists():
            raise FileNotFoundError(f"Fichier de règles introuvable: {self.rules_path}")
        
        # Charger JSON
        with open(self.rules_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Extraire règles
        self.rules = data.get('rules', [])
        
        if not self.rules:
            raise ValueError("Aucune règle trouvée dans le fichier")
        
        print(f"✅ {len(self.rules)} règles chargées")
        
        return self.rules
    
    def get_rules_by_category(self, category: str) -> List[Dict]:
        """
        Filtre les règles par catégorie
        
        Args:
            category: Catégorie de règles (ex: "page_de_garde", "performances")
            
        Returns:
            Liste des règles de cette catégorie
        """
        return [rule for rule in self.rules if rule.get('category') == category]
    
    def get_rules_by_slide(self, slide_number: str) -> List[Dict]:
        """
        Filtre les règles par numéro de slide
        
        Args:
            slide_number: Numéro de slide (ex: "1", "2", "any")
            
        Returns:
            Liste des règles applicables à ce slide
        """
        return [
            rule for rule in self.rules
            if rule.get('slide_number') in [slide_number, 'any']
        ]
    
    def get_rules_by_severity(self, severity: str) -> List[Dict]:
        """
        Filtre les règles par sévérité
        
        Args:
            severity: Sévérité (ex: "critique", "majeure", "mineure")
            
        Returns:
            Liste des règles de cette sévérité
        """
        return [rule for rule in self.rules if rule.get('severity') == severity]
    
    def get_rule_by_id(self, rule_id: str) -> Dict:
        """
        Récupère une règle par son ID
        
        Args:
            rule_id: ID de la règle (ex: "RG.1")
            
        Returns:
            Règle correspondante ou None
        """
        for rule in self.rules:
            if rule.get('rule_id') == rule_id:
                return rule
        return None
    
    def get_statistics(self) -> Dict:
        """
        Calcule des statistiques sur les règles
        
        Returns:
            Dictionnaire de statistiques
        """
        stats = {
            'total_rules': len(self.rules),
            'by_category': {},
            'by_severity': {},
            'by_slide': {}
        }
        
        # Par catégorie
        for rule in self.rules:
            category = rule.get('category', 'unknown')
            stats['by_category'][category] = stats['by_category'].get(category, 0) + 1
        
        # Par sévérité
        for rule in self.rules:
            severity = rule.get('severity', 'unknown')
            stats['by_severity'][severity] = stats['by_severity'].get(severity, 0) + 1
        
        # Par slide
        for rule in self.rules:
            slide = str(rule.get('slide_number', 'any'))
            stats['by_slide'][slide] = stats['by_slide'].get(slide, 0) + 1
        
        return stats
    
    def validate_rules(self) -> List[str]:
        """
        Valide la structure des règles
        
        Returns:
            Liste des erreurs trouvées (vide si tout est OK)
        """
        errors = []
        required_fields = ['rule_id', 'category', 'title', 'description']
        
        for i, rule in enumerate(self.rules):
            # Vérifier champs requis
            for field in required_fields:
                if not rule.get(field):
                    errors.append(f"Règle {i+1}: Champ '{field}' manquant")
            
            # Vérifier format rule_id
            if rule.get('rule_id') and not rule['rule_id'].startswith('RG.'):
                errors.append(f"Règle {i+1}: Format rule_id invalide (doit commencer par 'RG.')")
        
        return errors
