# 🧪 Guide de Test du Pipeline

## 📋 Fichiers Disponibles

✅ **Tous les fichiers sont présents :**
- `XXX-PRS-GB-ODDO BHF US Equity Active ETF-20250630_6PN.pptx` - Présentation
- `metadata.json` - Métadonnées
- `prospectus.docx` - Prospectus

---

## 🚀 Commande de Test

### Commande complète avec les 3 fichiers :

```bash
python pipeline.py "XXX-PRS-GB-ODDO BHF US Equity Active ETF-20250630_6PN.pptx" metadata.json prospectus.docx
```

**Note importante :** Le nom du fichier PPTX contient des espaces, donc il doit être entre guillemets `"..."` sur Windows.

### Alternative (sans guillemets si pas d'espaces) :

Si le nom du fichier n'avait pas d'espaces, vous pourriez utiliser :
```bash
python pipeline.py presentation.pptx metadata.json prospectus.docx
```

---

## 📝 Étapes du Test

### 1. Vérifier que vous êtes dans le bon répertoire

```bash
cd C:\Users\fida\Desktop\newtest
```

### 2. Vérifier que le fichier .env existe

```bash
dir .env
```

Le fichier `.env` doit contenir :
```
TOKENFACTORY_API_KEY=sk-xxxxxxxxxxxxx
```

### 3. Exécuter le pipeline

```bash
python pipeline.py "XXX-PRS-GB-ODDO BHF US Equity Active ETF-20250630_6PN.pptx" metadata.json prospectus.docx
```

---

## 🔍 Ce qui va se passer

1. **Extraction PPTX** (~2-5 minutes)
   - Le script va extraire toutes les données de la présentation
   - Créera un fichier `extracted_data_XXX-PRS-GB-ODDO BHF US Equity Active ETF-20250630_6PN.json`

2. **Chargement métadonnées** (~1 seconde)
   - Fusionne les métadonnées avec les données extraites

3. **Extraction prospectus** (~1-3 minutes)
   - Analyse le prospectus avec l'IA
   - Extrait les informations clés (benchmark, SRI, frais, etc.)

4. **Vérification de conformité** (~1-2 minutes)
   - Vérifie toutes les règles
   - Génère un rapport des violations

5. **Rapport final**
   - Affiche toutes les violations détectées
   - Résumé par type et sévérité

---

## ✅ Résultat Attendu

Le pipeline devrait :
- ✅ Extraire le PPTX avec succès
- ✅ Charger les métadonnées
- ✅ Extraire le prospectus
- ✅ Effectuer toutes les vérifications
- ✅ Afficher le rapport de violations

---

## 🐛 Dépannage

### Erreur : "File not found"
- Vérifiez que vous êtes dans le bon répertoire
- Vérifiez que les noms de fichiers sont corrects

### Erreur : "TOKENFACTORY_API_KEY not found"
- Vérifiez que le fichier `.env` existe
- Vérifiez que la clé API est correcte

### Erreur : "Module not found"
- Installez les dépendances : `pip install python-docx python-pptx openai httpx python-dotenv`

---

## 📊 Fichiers Générés

Après l'exécution, vous aurez :
- `extracted_data_XXX-PRS-GB-ODDO BHF US Equity Active ETF-20250630_6PN.json` - Données extraites

---

## 🎯 Prochaines Étapes

Après le test :
1. Examiner les violations détectées
2. Corriger les violations dans le document source
3. Ré-exécuter pour vérifier les corrections

