import json
from pathlib import Path

# Chemins des fichiers
input_file = r"c:\Users\Lenovo\Desktop\PROJET_IA\DATA\extracted\XXX-PRS-GB-ODDO BHF US Equity Active ETF-20250630_6PN.grouped_by_slide.json"
output_file = r"c:\Users\Lenovo\Desktop\PROJET_IA\DATA\extracted\XXX-PRS-GB-ODDO BHF US Equity Active ETF-20250630_6PN.summary_by_slide.json"

# Charger le JSON
with open(input_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Créer le résumé
summary = {
    "metadata": data.get('metadata', {}),
    "summary_by_slide": {}
}

# Parcourir chaque slide
for slide_num, results in data.get('results_by_slide', {}).items():
    # Filtrer les éléments avec found=true
    found_items = [item for item in results if item.get('found') is True]
    
    # Créer un résumé compact
    summary["summary_by_slide"][slide_num] = [
        {
            "field_name": item.get('field_name'),
            "value": item.get('value'),
            "confidence": item.get('confidence'),
            "rule_id": item.get('rule_id')
        }
        for item in found_items
    ]

# Sauvegarder le résumé
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(summary, f, indent=2, ensure_ascii=False)

print(f"✓ Fichier résumé créé: {output_file}")
print(f"✓ Nombre de slides: {len(summary['summary_by_slide'])}")
print(f"\n✓ Aperçu des résultats par slide:")

for slide_num in sorted([int(k) for k in summary['summary_by_slide'].keys()]):
    items = summary['summary_by_slide'][str(slide_num)]
    print(f"\n  Slide {slide_num}: {len(items)} champ(s) trouvé(s)")
    for item in items[:3]:
        val = str(item['value'])[:50] if item['value'] else 'null'
        print(f"    - {item['field_name']}: {val}{'...' if item['value'] and len(str(item['value'])) > 50 else ''}")
    if len(items) > 3:
        print(f"    ... et {len(items) - 3} autre(s)")
