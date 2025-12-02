import json
from collections import defaultdict
from pathlib import Path

# Chemin du fichier JSON
input_file = r"c:\Users\Lenovo\Desktop\PROJET_IA\DATA\extracted\XXX-PRS-GB-ODDO BHF US Equity Active ETF-20250630_6PN.complete_extraction.json"
output_file = r"c:\Users\Lenovo\Desktop\PROJET_IA\DATA\extracted\XXX-PRS-GB-ODDO BHF US Equity Active ETF-20250630_6PN.grouped_by_slide.json"

# Charger le JSON
with open(input_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Regrouper par slide_number
results_by_slide = defaultdict(list)

# Parcourir tous les résultats par champ
for field_name, results in data.get('results_by_field', {}).items():
    for result in results:
        slide_num = result.get('slide_number')
        if slide_num is not None:
            results_by_slide[slide_num].append(result)

# Trier par numéro de slide
results_by_slide = dict(sorted(results_by_slide.items()))

# Créer la structure de sortie
output_data = {
    "metadata": data.get('metadata', {}),
    "results_by_slide": results_by_slide
}

# Sauvegarder le résultat
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(output_data, f, indent=2, ensure_ascii=False)

print(f"✓ Fichier regroupé créé: {output_file}")
print(f"✓ Nombre de slides: {len(results_by_slide)}")
print(f"✓ Aperçu des slides:")
for slide_num in sorted(results_by_slide.keys())[:5]:
    count = len(results_by_slide[slide_num])
    print(f"  - Slide {slide_num}: {count} résultats")
