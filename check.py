#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Simple command-line compliance checker
Usage: python check.py <json_file>
"""

import sys
import os
import io

# Fix encoding for ALL output streams
if sys.platform == 'win32':
    # Windows-specific fix
    import locale
    try:
        locale.setlocale(locale.LC_ALL, 'fr_FR.UTF-8')
    except:
        try:
            locale.setlocale(locale.LC_ALL, '')
        except:
            pass
    
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace', line_buffering=True)
else:
    # Unix/Linux
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# Set environment encoding
os.environ['PYTHONIOENCODING'] = 'utf-8'

from dotenv import load_dotenv

# Load environment
load_dotenv()

if not os.path.exists('.env'):
    print("ERROR: .env file not found! Run: python setup.py")
    sys.exit(1)

# Load the agent
print("Loading agent...")
with open('agent_local.py', encoding='utf-8') as f:
    exec(f.read())
def check_document_compliance(json_file_path):
    """
    Full document compliance checker
    
    Args:
        json_file_path: Path to JSON document
    
    Returns:
        dict with violations list
    """
    try:
        # Load document
        import json
        with open(json_file_path, 'r', encoding='utf-8') as f:
            doc = json.load(f)

        violations = []

        # Extract metadata
        doc_metadata = doc.get('document_metadata', {})
        fund_isin = doc_metadata.get('fund_isin')
        client_type = doc_metadata.get('client_type', 'retail')
        doc_type = doc_metadata.get('document_type', 'fund_presentation')
        fund_status = doc_metadata.get('fund_status', 'active')
        esg_classification = doc_metadata.get('fund_esg_classification', 'other')
        country_code = doc_metadata.get('country_code', None)
        fund_age_years = doc_metadata.get('fund_age_years', None)

        print(f"\n{'='*70}")
        print(f"ðŸ” COMPLIANCE REPORT")
        print(f"{'='*70}")
        print(f"File: {json_file_path}")
        print(f"Fund ISIN: {fund_isin or 'Not specified'}")
        print(f"Client Type: {client_type.upper()}")
        print(f"Document Type: {doc_type}")
        print(f"Fund Status: {fund_status}")
        print(f"ESG Classification: {esg_classification}")
        print(f"{'='*70}\n")
        # ====================================================================
        # CHECK 2: DISCLAIMERS (Keep existing AI check - it's already good)
        # ====================================================================
        if disclaimers_db:
            doc_type_mapping = {
                'fund_presentation': 'OBAM Presentation',
                'commercial_doc': 'Commercial documentation',
                'fact_sheet': 'OBAM Presentation'
            }

            disclaimer_type = doc_type_mapping.get(doc_type, 'OBAM Presentation')

            if disclaimer_type in disclaimers_db:
                client_key = 'professional' if client_type.lower() == 'professional' else 'retail'
                required_disclaimer = disclaimers_db[disclaimer_type].get(client_key)

                if required_disclaimer and len(required_disclaimer) > 50:
                    all_slides_text = extract_all_text_from_doc(doc)

                    if tokenfactory_client:  # Using Token Factory (Llama) for this check
                        result = check_disclaimer_in_document(all_slides_text, required_disclaimer)

                        if result.get('status') == 'MISSING':
                            violations.append({
                                'type': 'DISCLAIMER',
                                'severity': 'CRITICAL',
                                'slide': 'Document-wide',
                                'location': 'Missing',
                                'rule': f'Required {client_key} disclaimer',
                                'message': f"Required disclaimer not found",
                                'evidence': result.get('explanation', ''),
                                'confidence': result.get('confidence', 0)
                            })
        # ====================================================================
        # CHECK 1: REGISTRATION (Enhanced with LLM Context Analysis)
        # ====================================================================
        if fund_isin and funds_db:
            fund_info = None
            for fund in funds_db:
                if fund['isin'] == fund_isin:
                    fund_info = fund
                    break

            if fund_info:
                authorized_countries = fund_info['authorized_countries']
                print(f" Fund: {fund_info['fund_name']}")
                print(f" Authorized in {len(authorized_countries)} countries\n")

                # Use enhanced LLM-based registration check
                reg_violations = check_registration_rules_enhanced(
                    doc,
                    fund_isin,
                    authorized_countries
                )
                violations.extend(reg_violations)

                if not reg_violations:
                    print(" Registration compliance: OK\n")
            else:
                print(f"¸  Fund {fund_isin} not found in registration database\n")

        # CHECK 2: STRUCTURE
        if structure_rules:
            print("Checking structure...")
            try:
                structure_violations = check_structure_rules_enhanced(doc, client_type, fund_status)
                violations.extend(structure_violations)
                if not structure_violations:
                    print(" Structure: OK\n")
            except Exception as e:
                print(f"¸  Structure check error: {e}\n")

        # CHECK 3: GENERAL RULES
        if general_rules:
            print("Checking general rules...")
            try:
                gen_violations = check_general_rules_enhanced(doc, client_type, country_code)
                violations.extend(gen_violations)
                if not gen_violations:
                    print(" General rules: OK\n")
            except Exception as e:
                print(f"¸  General rules check error: {e}\n")

        # CHECK 4: VALUES/SECURITIES
        if values_rules:
            print("Checking securities/values...")
            try:
                values_violations = check_values_rules_enhanced(doc)
                violations.extend(values_violations)
                if not values_violations:
                    print(" Securities/Values: OK\n")
            except Exception as e:
                print(f"¸  Values check error: {e}\n")

        # CHECK 5: ESG
        if esg_rules:
            print("Checking ESG rules...")
            try:
                esg_violations = check_esg_rules_enhanced(doc, esg_classification, client_type)
                violations.extend(esg_violations)
                if not esg_violations:
                    print(" ESG: OK\n")
            except Exception as e:
                print(f"¸  ESG check error: {e}\n")

        # CHECK 6: PERFORMANCE
        if performance_rules:
            print("Checking performance rules...")
            try:
                perf_violations = check_performance_rules_enhanced(doc, client_type, fund_age_years)
                violations.extend(perf_violations)
                if not perf_violations:
                    print(" Performance: OK\n")
            except Exception as e:
                print(f"¸  Performance check error: {e}\n")

        # CHECK 7: PROSPECTUS
        if prospectus_data and prospectus_rules:
            print("Checking prospectus compliance...")
            try:
                prosp_violations = check_prospectus_compliance(doc, prospectus_data)
                violations.extend(prosp_violations)
                if not prosp_violations:
                    print(" Prospectus: OK\n")
            except Exception as e:
                print(f"¸  Prospectus check error: {e}\n")

        # FINAL REPORT
        print(f"\n{'='*70}")
        if len(violations) == 0:
            print(" NO VIOLATIONS FOUND - Document is compliant!")
        else:
            print(f" {len(violations)} VIOLATION(S) FOUND")
        print(f"{'='*70}\n")

        # Display violations
        for i, v in enumerate(violations, 1):
            print(f"{'='*70}")
            print(f"[{v['severity']}] {v['type']} Violation #{i}")
            print(f"{'='*70}")
            print(f"‹ Rule: {v['rule']}")
            print(f"¸  Issue: {v['message']}")
            print(f" Location: {v['slide']} - {v['location']}")
            print(f"\n„ Evidence:")
            print(f"   {v['evidence']}")
            print()

        # Summary
        if violations:
            print(f"\n{'='*70}")
            print(f"SUMMARY")
            print(f"{'='*70}")

            # By type
            type_counts = {}
            for v in violations:
                vtype = v['type']
                type_counts[vtype] = type_counts.get(vtype, 0) + 1

            print(f"\nViolations by type:")
            for vtype, count in sorted(type_counts.items()):
                print(f"   {vtype}: {count}")

            # By severity
            severity_counts = {}
            for v in violations:
                sev = v['severity']
                severity_counts[sev] = severity_counts.get(sev, 0) + 1

            print(f"\nViolations by severity:")
            for sev in ['CRITICAL', 'MAJOR', 'WARNING']:
                if sev in severity_counts:
                    print(f"   {sev}: {severity_counts[sev]}")

        return {
            'total_violations': len(violations),
            'violations': violations,
            'fund_isin': fund_isin,
            'client_type': client_type
        }

    except FileNotFoundError:
        print(f"\n File '{json_file_path}' not found")
        return {'error': 'File not found'}
    except json.JSONDecodeError as e:
        print(f"\n Invalid JSON file: {e}")
        return {'error': 'Invalid JSON'}
    except Exception as e:
        print(f"\n Error checking document: {e}")
        import traceback
        traceback.print_exc()
        return {'error': str(e)}


def main():
    """Main function"""
    if len(sys.argv) < 2:
        print("\n" + "="*70)
        print("FUND COMPLIANCE CHECKER")
        print("="*70)
        print("\nUsage:")
        print("  python check.py <json_file>")
        print("\nExample:")
        print("  python check.py exemple.json")
        print("\nThe JSON file should contain:")
        print("  - document_metadata with fund_isin, client_type, etc.")
        print("  - page_de_garde, slide_2, pages_suivantes, page_de_fin")
        print("="*70)
        sys.exit(1)

    json_file = sys.argv[1]
    
    if not os.path.exists(json_file):
        print(f"\n File '{json_file}' not found")
        print(f" Current directory: {os.getcwd()}")
        print(f"„ Available JSON files:")
        json_files = [f for f in os.listdir('.') if f.endswith('.json')]
        if json_files:
            for f in json_files:
                print(f"  - {f}")
        else:
            print("  (none found)")
        sys.exit(1)

    result = check_document_compliance(json_file)
    
    if 'error' not in result:
        print(f"\n{'='*70}")
        print("Š CHECK COMPLETE")
        print(f"{'='*70}")
        
        if result['total_violations'] == 0:
            print("\nðŸŽ‰ Document is fully compliant!")
            sys.exit(0)
        else:
            print(f"\n¸  Please review and fix {result['total_violations']} violation(s)")
            sys.exit(1)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()