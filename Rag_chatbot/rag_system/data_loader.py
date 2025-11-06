"""
Data Loader for ODDO BHF Compliance JSON Files
ULTRA COMPLETE VERSION - Extracts ALL 121 rules
"""
import json
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from config import JSON_FILES, MARKDOWN_FILES

@dataclass
class Document:
    """Structured document for RAG system"""
    id: str
    text: str
    metadata: Dict[str, Any]
    source_file: str
    source_path: str

class ComplianceDataLoader:
    """Load and structure compliance data from JSON files"""
    
    def __init__(self):
        self.data = {}
        self.documents = []
    
    def load_all(self) -> List[Document]:
        """Load all JSON files and create documents"""
        print("📂 Loading compliance data...")
        
        # Load each JSON file
        for name, path in JSON_FILES.items():
            print(f"  Loading {name}...")
            self.data[name] = self._load_json(path)
        
        # Create documents from each source
        print("\n📝 Creating documents...")
        self.documents.extend(self._create_rules_documents())
        self.documents.extend(self._create_disclaimers_documents())
        self.documents.extend(self._create_registration_documents())
        self.documents.extend(self._create_mapping_documents())
        self.documents.extend(self._create_validation_documents())
        self.documents.extend(self._create_examples_documents())
        
        print(f"\n✅ Created {len(self.documents)} documents")
        return self.documents
    
    def _load_json(self, path: Path) -> Dict:
        """Load JSON file"""
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def _create_rules_documents(self) -> List[Document]:
        """Create documents from rules_database.json - ULTRA COMPLETE VERSION"""
        documents = []
        rules_data = self.data['rules']
        
        print("    🔍 Processing sections...")
        
        # Process each section
        for section in rules_data.get('sections', []):
            section_id = section.get('id')
            section_title = section.get('title')
            
            print(f"      Section {section_id}: {section_title}")
            
            # 1. Process direct rules in section
            if 'rules' in section:
                count = len(section['rules'])
                print(f"        → Found {count} direct rules")
                for rule in section['rules']:
                    doc = self._create_rule_document(rule, section_id, section_title)
                    if doc:
                        documents.append(doc)
            
            # 2. Process general_rules in section
            if 'general_rules' in section:
                count = len(section['general_rules'])
                print(f"        → Found {count} general rules")
                for rule in section['general_rules']:
                    doc = self._create_rule_document(rule, section_id, section_title)
                    if doc:
                        documents.append(doc)
            
            # 3. Process mandatory_elements (Section 2, 3, 5)
            if 'mandatory_elements' in section:
                count = len(section['mandatory_elements'])
                print(f"        → Found {count} mandatory elements")
                for i, elem in enumerate(section['mandatory_elements']):
                    rule_id = f"{section_id}.mandatory.{i+1}"
                    text = f"Élément obligatoire {rule_id}\n"
                    text += f"Type: {elem.get('element', 'unknown')}\n"
                    text += json.dumps(elem, ensure_ascii=False, indent=2)
                    
                    doc = Document(
                        id=f"rule_{rule_id}",
                        text=text,
                        metadata={
                            "type": "rule",
                            "rule_id": rule_id,
                            "section_id": section_id,
                            "section_title": section_title,
                            "category": "mandatory_element",
                            "applicability": ["all"],
                            "mandatory": elem.get('mandatory', True),
                        },
                        source_file="rules_database.json",
                        source_path=f"sections[{section_id}].mandatory_elements[{i}]"
                    )
                    documents.append(doc)
            
            # 4. Process conditional_elements (Section 2)
            if 'conditional_elements' in section:
                count = len(section['conditional_elements'])
                print(f"        → Found {count} conditional elements")
                for i, elem in enumerate(section['conditional_elements']):
                    rule_id = f"{section_id}.conditional.{i+1}"
                    text = f"Élément conditionnel {rule_id}\n"
                    text += f"Condition: {elem.get('condition', 'unknown')}\n"
                    text += json.dumps(elem, ensure_ascii=False, indent=2)
                    
                    doc = Document(
                        id=f"rule_{rule_id}",
                        text=text,
                        metadata={
                            "type": "rule",
                            "rule_id": rule_id,
                            "section_id": section_id,
                            "section_title": section_title,
                            "category": "conditional_element",
                            "applicability": ["all"],
                            "mandatory": elem.get('mandatory', False),
                            "condition": elem.get('condition'),
                        },
                        source_file="rules_database.json",
                        source_path=f"sections[{section_id}].conditional_elements[{i}]"
                    )
                    documents.append(doc)
            
            # 5. Process subsections (Section 4 - THE BIG ONE!)
            if 'subsections' in section:
                print(f"        → Found {len(section['subsections'])} subsections")
                subsec_docs = self._process_subsections(
                    section['subsections'], 
                    section_id, 
                    section_title
                )
                documents.extend(subsec_docs)
        
        print(f"    ✅ {len(documents)} total rules extracted")
        return documents
    
    def _create_rule_document(self, rule: Dict, section_id: str, section_title: str) -> Optional[Document]:
        """Helper to create a document from a standard rule object"""
        rule_id = rule.get('id')
        if not rule_id:
            return None
        
        # Create text content
        text_parts = [f"Règle {rule_id}: {rule.get('rule', '')}"]
        
        if rule.get('note'):
            text_parts.append(f"Note: {rule['note']}")
        if rule.get('reference'):
            text_parts.append(f"Référence: {rule['reference']}")
        if rule.get('examples'):
            text_parts.append(f"Exemples: {', '.join(str(e) for e in rule['examples'])}")
        if rule.get('action'):
            text_parts.append(f"Action: {rule['action']}")
        
        text = "\n".join(text_parts)
        
        # Create metadata
        metadata = {
            "type": "rule",
            "rule_id": rule_id,
            "section_id": section_id,
            "section_title": section_title,
            "category": rule.get('category', ''),
            "applicability": rule.get('applicability', []),
            "mandatory": rule.get('mandatory', False),
            "prohibited": rule.get('prohibited', False),
        }
        
        # Add optional fields
        for field in ['country', 'disclaimer_refs', 'source_document', 'condition']:
            if field in rule:
                metadata[field] = rule[field]
        
        return Document(
            id=f"rule_{rule_id}",
            text=text,
            metadata=metadata,
            source_file="rules_database.json",
            source_path=f"sections[{section_id}].rules[{rule_id}]"
        )
    
    def _process_subsections(self, subsections: List[Dict], parent_section_id: str, parent_section_title: str) -> List[Document]:
        """Process subsections recursively - ULTRA COMPLETE"""
        documents = []
        
        for subsection in subsections:
            subsection_id = subsection.get('id')
            subsection_title = subsection.get('title')
            print(f"          Subsection {subsection_id}: {subsection_title}")
            
            # SECTION 4.1 - ESG approaches
            if 'approaches' in subsection:
                count = len(subsection['approaches'])
                print(f"            → {count} ESG approaches")
                for i, approach in enumerate(subsection['approaches']):
                    rule_id = f"{subsection_id}.approach.{approach.get('name', i)}"
                    text = f"Règle ESG {rule_id}\n"
                    text += f"Approche: {approach.get('name')}\n"
                    text += f"Description: {approach.get('description')}\n"
                    text += f"Limite de communication: {approach.get('communication_limit')}\n"
                    if approach.get('criteria'):
                        text += f"Critères: {json.dumps(approach['criteria'], ensure_ascii=False)}"
                    
                    doc = Document(
                        id=f"rule_{rule_id}",
                        text=text,
                        metadata={
                            "type": "rule",
                            "rule_id": rule_id,
                            "section_id": subsection_id,
                            "section_title": subsection_title,
                            "category": "esg",
                            "applicability": subsection.get('applicability', ['retail']),
                            "mandatory": True,
                        },
                        source_file="rules_database.json",
                        source_path=f"sections[{parent_section_id}].subsections[{subsection_id}].approaches[{i}]"
                    )
                    documents.append(doc)
            
            # SECTION 4.2 - Securities mentions
            if 'prohibited_actions' in subsection:
                count = len(subsection['prohibited_actions'])
                print(f"            → {count} prohibited actions")
                for i, action in enumerate(subsection['prohibited_actions']):
                    rule_id = f"{subsection_id}.prohibited.{i+1}"
                    text = f"Règle interdite {rule_id}\n"
                    text += f"Action: {action.get('action')}\n"
                    text += f"Description: {action.get('description')}\n"
                    if action.get('note'):
                        text += f"Note: {action['note']}"
                    
                    doc = Document(
                        id=f"rule_{rule_id}",
                        text=text,
                        metadata={
                            "type": "rule",
                            "rule_id": rule_id,
                            "section_id": subsection_id,
                            "section_title": subsection_title,
                            "category": "securities_mention",
                            "applicability": ["all"],
                            "mandatory": True,
                            "prohibited": True,
                        },
                        source_file="rules_database.json",
                        source_path=f"sections[{parent_section_id}].subsections[{subsection_id}].prohibited_actions[{i}]"
                    )
                    documents.append(doc)
            
            if 'permitted_actions' in subsection:
                count = len(subsection['permitted_actions'])
                print(f"            → {count} permitted actions")
                for i, action in enumerate(subsection['permitted_actions']):
                    rule_id = f"{subsection_id}.permitted.{i+1}"
                    text = f"Règle permise {rule_id}\n"
                    text += f"Action: {action.get('action')}\n"
                    text += f"Description: {action.get('description')}\n"
                    if action.get('examples'):
                        text += f"Exemples: {', '.join(str(e) for e in action['examples'])}"
                    if action.get('note'):
                        text += f"Note: {action['note']}"
                    
                    doc = Document(
                        id=f"rule_{rule_id}",
                        text=text,
                        metadata={
                            "type": "rule",
                            "rule_id": rule_id,
                            "section_id": subsection_id,
                            "section_title": subsection_title,
                            "category": "securities_mention",
                            "applicability": ["all"],
                            "mandatory": False,
                            "prohibited": False,
                        },
                        source_file="rules_database.json",
                        source_path=f"sections[{parent_section_id}].subsections[{subsection_id}].permitted_actions[{i}]"
                    )
                    documents.append(doc)
            
            # SECTION 4.3 - Performance rules
            if 'general_principles' in subsection:
                count = len(subsection['general_principles'])
                print(f"            → {count} general principles")
                for key, value in subsection['general_principles'].items():
                    rule_id = f"{subsection_id}.general_principles.{key}"
                    text = f"Règle {rule_id}\n{key}: {value}"
                    
                    doc = Document(
                        id=f"rule_{rule_id}",
                        text=text,
                        metadata={
                            "type": "rule",
                            "rule_id": rule_id,
                            "section_id": subsection_id,
                            "section_title": subsection_title,
                            "category": "performance_general",
                            "applicability": ["all"],
                            "mandatory": True,
                        },
                        source_file="rules_database.json",
                        source_path=f"sections[{parent_section_id}].subsections[{subsection_id}].general_principles.{key}"
                    )
                    documents.append(doc)
            
            # SECTION 4.3 - funds_rules (EXTRACT ALL SUB-RULES!)
            if 'funds_rules' in subsection:
                funds_docs = self._process_funds_rules_complete(
                    subsection['funds_rules'],
                    subsection_id,
                    subsection_title,
                    parent_section_id
                )
                print(f"            → {len(funds_docs)} funds rules (detailed)")
                documents.extend(funds_docs)
            
            # SECTION 4.3 - strategy_rules (EXTRACT ALL SUB-RULES!)
            if 'strategy_rules' in subsection:
                strategy_docs = self._process_strategy_rules_complete(
                    subsection['strategy_rules'],
                    subsection_id,
                    subsection_title,
                    parent_section_id
                )
                print(f"            → {len(strategy_docs)} strategy rules (detailed)")
                documents.extend(strategy_docs)
            
            # SECTION 4.3 - other specific sections
            for special_key in ['listed_securities_specific', 'dated_funds_yields', 
                               'private_equity_specific', 'future_simulations', 
                               'past_simulations', 'disclaimers']:
                if special_key in subsection:
                    special_docs = self._process_complex_rules(
                        subsection[special_key],
                        f"{subsection_id}.{special_key}",
                        subsection_title,
                        parent_section_id,
                        special_key
                    )
                    if special_docs:
                        print(f"            → {len(special_docs)} {special_key}")
                        documents.extend(special_docs)
        
        return documents
    
    def _process_funds_rules_complete(self, funds_rules: Dict, subsection_id: str, 
                                     subsection_title: str, parent_section_id: str) -> List[Document]:
        """Process funds_rules - EXTRACT ALL SUB-RULES (26 total)"""
        documents = []
        
        for key, value in funds_rules.items():
            # Si value est un dict, extraire CHAQUE sous-règle
            if isinstance(value, dict):
                for sub_key, sub_value in value.items():
                    rule_id = f"{subsection_id}.funds_rules.{key}.{sub_key}"
                    
                    text = f"Règle fonds {rule_id}\n"
                    text += f"Catégorie: {key}\n"
                    text += f"Sous-règle: {sub_key}\n"
                    
                    # Format sub_value nicely
                    if isinstance(sub_value, (dict, list)):
                        text += f"Contenu:\n{json.dumps(sub_value, ensure_ascii=False, indent=2)}"
                    else:
                        text += f"Contenu: {sub_value}"
                    
                    doc = Document(
                        id=f"rule_{rule_id}",
                        text=text,
                        metadata={
                            "type": "rule",
                            "rule_id": rule_id,
                            "section_id": subsection_id,
                            "section_title": subsection_title,
                            "category": f"performance_funds_{key}",
                            "applicability": ["retail"],
                            "mandatory": True,
                        },
                        source_file="rules_database.json",
                        source_path=f"sections[{parent_section_id}].subsections[{subsection_id}].funds_rules.{key}.{sub_key}"
                    )
                    documents.append(doc)
            else:
                # Si ce n'est pas un dict, une seule règle
                rule_id = f"{subsection_id}.funds_rules.{key}"
                
                text = f"Règle fonds {rule_id}\n"
                text += f"Catégorie: {key}\n"
                text += json.dumps(value, ensure_ascii=False, indent=2)
                
                doc = Document(
                    id=f"rule_{rule_id}",
                    text=text,
                    metadata={
                        "type": "rule",
                        "rule_id": rule_id,
                        "section_id": subsection_id,
                        "section_title": subsection_title,
                        "category": f"performance_funds_{key}",
                        "applicability": ["retail"],
                        "mandatory": True,
                    },
                    source_file="rules_database.json",
                    source_path=f"sections[{parent_section_id}].subsections[{subsection_id}].funds_rules.{key}"
                )
                documents.append(doc)
        
        return documents
    
    def _process_strategy_rules_complete(self, strategy_rules: Dict, subsection_id: str,
                                        subsection_title: str, parent_section_id: str) -> List[Document]:
        """Process strategy_rules - EXTRACT ALL SUB-RULES (14 total)"""
        documents = []
        
        for key, value in strategy_rules.items():
            # Si value est un dict, extraire CHAQUE sous-règle
            if isinstance(value, dict):
                for sub_key, sub_value in value.items():
                    rule_id = f"{subsection_id}.strategy_rules.{key}.{sub_key}"
                    
                    text = f"Règle stratégie {rule_id}\n"
                    text += f"Catégorie: {key}\n"
                    text += f"Sous-règle: {sub_key}\n"
                    
                    # Format sub_value nicely
                    if isinstance(sub_value, (dict, list)):
                        text += f"Contenu:\n{json.dumps(sub_value, ensure_ascii=False, indent=2)}"
                    else:
                        text += f"Contenu: {sub_value}"
                    
                    doc = Document(
                        id=f"rule_{rule_id}",
                        text=text,
                        metadata={
                            "type": "rule",
                            "rule_id": rule_id,
                            "section_id": subsection_id,
                            "section_title": subsection_title,
                            "category": f"performance_strategy_{key}",
                            "applicability": ["professional"],
                            "mandatory": True,
                        },
                        source_file="rules_database.json",
                        source_path=f"sections[{parent_section_id}].subsections[{subsection_id}].strategy_rules.{key}.{sub_key}"
                    )
                    documents.append(doc)
            else:
                # Si ce n'est pas un dict, une seule règle
                rule_id = f"{subsection_id}.strategy_rules.{key}"
                
                text = f"Règle stratégie {rule_id}\n"
                text += f"Catégorie: {key}\n"
                text += json.dumps(value, ensure_ascii=False, indent=2)
                
                doc = Document(
                    id=f"rule_{rule_id}",
                    text=text,
                    metadata={
                        "type": "rule",
                        "rule_id": rule_id,
                        "section_id": subsection_id,
                        "section_title": subsection_title,
                        "category": f"performance_strategy_{key}",
                        "applicability": ["professional"],
                        "mandatory": True,
                    },
                    source_file="rules_database.json",
                    source_path=f"sections[{parent_section_id}].subsections[{subsection_id}].strategy_rules.{key}"
                )
                documents.append(doc)
        
        return documents
    
    def _process_complex_rules(self, rules_data: Any, base_rule_id: str,
                              subsection_title: str, parent_section_id: str,
                              category: str) -> List[Document]:
        """Process complex nested rule structures"""
        documents = []
        
        if isinstance(rules_data, dict):
            for key, value in rules_data.items():
                rule_id = f"{base_rule_id}.{key}"
                
                text = f"Règle {rule_id}\n"
                text += json.dumps({key: value}, ensure_ascii=False, indent=2)
                
                # Extract applicability if present
                applicability = ["all"]
                mandatory = True
                if isinstance(value, dict):
                    if 'applicability' in value:
                        applicability = value['applicability']
                    if 'mandatory' in value:
                        mandatory = value['mandatory']
                
                doc = Document(
                    id=f"rule_{rule_id}",
                    text=text,
                    metadata={
                        "type": "rule",
                        "rule_id": rule_id,
                        "section_id": base_rule_id.split('.')[0],
                        "section_title": subsection_title,
                        "category": category,
                        "applicability": applicability,
                        "mandatory": mandatory,
                    },
                    source_file="rules_database.json",
                    source_path=f"sections[{parent_section_id}].subsections[{base_rule_id}].{key}"
                )
                documents.append(doc)
        elif isinstance(rules_data, list):
            for i, item in enumerate(rules_data):
                rule_id = f"{base_rule_id}.{i+1}"
                
                text = f"Règle {rule_id}\n"
                text += json.dumps(item, ensure_ascii=False, indent=2)
                
                doc = Document(
                    id=f"rule_{rule_id}",
                    text=text,
                    metadata={
                        "type": "rule",
                        "rule_id": rule_id,
                        "section_id": base_rule_id.split('.')[0],
                        "section_title": subsection_title,
                        "category": category,
                        "applicability": ["all"],
                        "mandatory": True,
                    },
                    source_file="rules_database.json",
                    source_path=f"sections[{parent_section_id}].subsections[{base_rule_id}][{i}]"
                )
                documents.append(doc)
        
        return documents
    
    # Keep all other methods unchanged
    def _create_disclaimers_documents(self) -> List[Document]:
        """Create documents from disclaimers-glossary.json"""
        documents = []
        disclaimers_data = self.data['disclaimers']
        
        for language, disclaimers in disclaimers_data.get('disclaimers', {}).items():
            for key, disclaimer in disclaimers.items():
                disclaimer_id = disclaimer.get('id')
                
                text_parts = [
                    f"Disclaimer {disclaimer_id}",
                    f"Langue: {language}",
                    f"Type: {disclaimer.get('document_type', '')}",
                    f"Client: {disclaimer.get('client_type', '')}",
                    f"Société: {disclaimer.get('management_company', '')}",
                    "",
                    disclaimer.get('content', '')
                ]
                
                text = "\n".join(text_parts)
                
                metadata = {
                    "type": "disclaimer",
                    "disclaimer_id": disclaimer_id,
                    "language": language,
                    "document_type": disclaimer.get('document_type', ''),
                    "client_type": disclaimer.get('client_type', ''),
                    "management_company": disclaimer.get('management_company', ''),
                }
                
                if disclaimer.get('belgium_specific'):
                    metadata['belgium_specific'] = True
                
                doc = Document(
                    id=f"disclaimer_{disclaimer_id}",
                    text=text,
                    metadata=metadata,
                    source_file="disclaimers-glossary.json",
                    source_path=f"disclaimers.{language}.{key}"
                )
                documents.append(doc)
        
        for key, disclaimer in disclaimers_data.get('special_disclaimers', {}).items():
            disclaimer_id = disclaimer.get('id')
            
            for lang, content in disclaimer.get('languages', {}).items():
                text_parts = [
                    f"Special Disclaimer {disclaimer_id}",
                    f"Type: {disclaimer.get('type', '')}",
                    f"Langue: {lang}",
                    "",
                    content
                ]
                
                text = "\n".join(text_parts)
                
                metadata = {
                    "type": "special_disclaimer",
                    "disclaimer_id": disclaimer_id,
                    "language": lang,
                    "disclaimer_type": disclaimer.get('type', ''),
                    "applicability": disclaimer.get('applicability', ''),
                }
                
                doc = Document(
                    id=f"special_disclaimer_{disclaimer_id}_{lang}",
                    text=text,
                    metadata=metadata,
                    source_file="disclaimers-glossary.json",
                    source_path=f"special_disclaimers.{key}.languages.{lang}"
                )
                documents.append(doc)
        
        print(f"    ✓ {len(documents)} disclaimers")
        return documents
    
    def _create_registration_documents(self) -> List[Document]:
        """Create documents from registration-countries.json"""
        documents = []
        registration_data = self.data['registration']
        
        for fund in registration_data.get('funds', []):
            fund_name = fund.get('fund_name')
            category = fund.get('category', '')
            
            for share_class in fund.get('share_classes', []):
                sc_name = share_class.get('share_class')
                isin = share_class.get('isin')
                
                registered_countries = []
                for reg in share_class.get('registrations', []):
                    if reg.get('status') in ['R', 'RX']:
                        country = reg.get('country')
                        status = reg.get('status')
                        registered_countries.append(f"{country} ({status})")
                
                text_parts = [
                    f"Fonds: {fund_name}",
                    f"Catégorie: {category}",
                    f"Share Class: {sc_name}",
                    f"ISIN: {isin}",
                    f"Pays enregistrés: {', '.join(registered_countries)}"
                ]
                
                text = "\n".join(text_parts)
                
                metadata = {
                    "type": "registration",
                    "fund_name": fund_name,
                    "category": category,
                    "share_class": sc_name,
                    "isin": isin,
                    "registered_countries": [reg.get('country') for reg in share_class.get('registrations', []) if reg.get('status') in ['R', 'RX']],
                    "total_countries": len(registered_countries),
                }
                
                doc = Document(
                    id=f"registration_{isin}",
                    text=text,
                    metadata=metadata,
                    source_file="registration-countries.json",
                    source_path=f"funds[{fund_name}].share_classes[{sc_name}]"
                )
                documents.append(doc)
        
        print(f"    ✓ {len(documents)} registrations")
        return documents
    
    def _create_mapping_documents(self) -> List[Document]:
        """Create documents from compliance-mapping.json"""
        documents = []
        mapping_data = self.data['mapping']
        
        for mapping in mapping_data.get('mappings', []):
            rule_id = mapping.get('rule_id')
            
            text_parts = [
                f"Mapping pour règle {rule_id}",
                f"Description: {mapping.get('rule_description', '')}",
            ]
            
            if mapping.get('required_disclaimers'):
                text_parts.append(f"Disclaimers requis: {json.dumps(mapping['required_disclaimers'], ensure_ascii=False)}")
            
            if mapping.get('validation_logic'):
                text_parts.append(f"Logique de validation: {json.dumps(mapping['validation_logic'], ensure_ascii=False)}")
            
            text = "\n".join(text_parts)
            
            metadata = {
                "type": "mapping",
                "rule_id": rule_id,
                "applicability": mapping.get('applicability', []),
                "mandatory": mapping.get('mandatory', False),
            }
            
            if mapping.get('country'):
                metadata['country'] = mapping['country']
            
            doc = Document(
                id=f"mapping_{rule_id}",
                text=text,
                metadata=metadata,
                source_file="compliance-mapping.json",
                source_path=f"mappings[rule_id={rule_id}]"
            )
            documents.append(doc)
        
        print(f"    ✓ {len(documents)} mappings")
        return documents
    
    def _create_validation_documents(self) -> List[Document]:
        """Create documents from validation-schema.json"""
        documents = []
        validation_data = self.data['validation']
        
        for section_key, section in validation_data.get('document_validation', {}).items():
            section_id = section.get('section_id', section_key)
            section_name = section.get('section_name', section_key)
            
            text_parts = [
                f"Validation {section_name}",
                f"Section ID: {section_id}",
            ]
            
            if section.get('required_fields'):
                text_parts.append(f"Champs requis: {len(section['required_fields'])}")
            
            if section.get('required_disclaimers'):
                text_parts.append(f"Disclaimers requis: {len(section['required_disclaimers'])}")
            
            text = "\n".join(text_parts)
            
            metadata = {
                "type": "validation",
                "section_id": section_id,
                "section_name": section_name,
                "section_key": section_key,
            }
            
            doc = Document(
                id=f"validation_{section_key}",
                text=text,
                metadata=metadata,
                source_file="validation-schema.json",
                source_path=f"document_validation.{section_key}"
            )
            documents.append(doc)
        
        print(f"    ✓ {len(documents)} validations")
        return documents
    
    def _create_examples_documents(self) -> List[Document]:
        """Create documents from usage-examples.json"""
        documents = []
        examples_data = self.data['examples']
        
        for scenario in examples_data.get('scenarios', []):
            scenario_id = scenario.get('scenario_id')
            
            text_parts = [
                f"Scénario {scenario_id}: {scenario.get('scenario_name', '')}",
                f"Description: {scenario.get('description', '')}",
                "",
                "Paramètres:",
                json.dumps(scenario.get('input_parameters', {}), indent=2, ensure_ascii=False),
            ]
            
            text = "\n".join(text_parts)
            
            metadata = {
                "type": "example",
                "scenario_id": scenario_id,
                "scenario_name": scenario.get('scenario_name', ''),
            }
            
            params = scenario.get('input_parameters', {})
            if params.get('client_type'):
                metadata['client_type'] = params['client_type']
            if params.get('country'):
                metadata['country'] = params['country']
            
            doc = Document(
                id=f"example_{scenario_id}",
                text=text,
                metadata=metadata,
                source_file="usage-examples.json",
                source_path=f"scenarios[{scenario_id}]"
            )
            documents.append(doc)
        
        for query_key, query in examples_data.get('common_queries', {}).items():
            text_parts = [
                f"Question: {query.get('question', '')}",
                "",
                "Réponse:",
                json.dumps(query.get('answer', {}), indent=2, ensure_ascii=False)
            ]
            
            text = "\n".join(text_parts)
            
            metadata = {
                "type": "faq",
                "query_key": query_key,
            }
            
            doc = Document(
                id=f"faq_{query_key}",
                text=text,
                metadata=metadata,
                source_file="usage-examples.json",
                source_path=f"common_queries.{query_key}"
            )
            documents.append(doc)
        
        print(f"    ✓ {len(documents)} examples")
        return documents

if __name__ == "__main__":
    loader = ComplianceDataLoader()
    docs = loader.load_all()
    
    print(f"\n📊 Document Statistics:")
    print(f"  Total: {len(docs)}")
    
    # Count by type
    types = {}
    for doc in docs:
        doc_type = doc.metadata.get('type', 'unknown')
        types[doc_type] = types.get(doc_type, 0) + 1
    
    for doc_type, count in sorted(types.items()):
        print(f"  {doc_type}: {count}")
    
    # Show rule counts by section
    print(f"\n📋 Rules by Section:")
    rule_sections = {}
    for doc in docs:
        if doc.metadata.get('type') == 'rule':
            section_id = doc.metadata.get('section_id', 'unknown')
            rule_sections[section_id] = rule_sections.get(section_id, 0) + 1
    
    for section_id, count in sorted(rule_sections.items(), key=lambda x: str(x[0])):
        print(f"  Section {section_id}: {count} rules")