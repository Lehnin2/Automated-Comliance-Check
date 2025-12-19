# 📁 Assets Images - VeriDeck

Ce dossier contient toutes les images utilisées dans l'application VeriDeck.

## 📂 Structure

```
public/assets/images/
├── team/              # Photos de l'équipe (6 membres)
│   ├── selim-manai.jpg (ou .png)
│   ├── fida-naimi.jpg
│   ├── mohamed-sillini.jpg
│   ├── ghassen-bousselm.jpg
│   ├── cyrine-maalel.jpg
│   └── safa-bachagha.jpg
├── company/           # Images de l'entreprise ODDO BHF
│   └── oddo-bhf-company.jpg (ou .png)
└── logos/             # Logos
    ├── oddo-bhf-logo.png (ou .svg)
    └── verideck-logo.png (optionnel)
```

## 📝 Instructions

### Images de l'Équipe
Placez les photos de l'équipe dans le dossier `team/` avec les noms suivants :
- `selim-manai.jpg` (ou .png)
- `fida-naimi.jpg`
- `mohamed-sillini.jpg`
- `ghassen-bousselm.jpg`
- `cyrine-maalel.jpg`
- `safa-bachagha.jpg`

**Format recommandé** : JPG ou PNG, 400x400px minimum, format carré

### Logo ODDO BHF
Placez le logo ODDO BHF dans `logos/oddo-bhf-logo.png`

**Format recommandé** : PNG avec transparence, hauteur 100-200px

### Image Entreprise ODDO BHF
Placez l'image de l'entreprise dans `company/oddo-bhf-company.jpg`

**Format recommandé** : JPG, largeur 1200px minimum

### Logo VeriDeck (optionnel)
Si vous avez un logo VeriDeck, placez-le dans `logos/verideck-logo.png`

## 🔗 Utilisation dans le Code

Une fois les images ajoutées, elles seront accessibles via :

### Dans React Components
```jsx
// Logo ODDO BHF
<img src="/assets/images/logos/oddo-bhf-logo.png" alt="ODDO BHF" />

// Photo équipe
<img src="/assets/images/team/selim-manai.jpg" alt="Selim Manai" />

// Image entreprise
<img src="/assets/images/company/oddo-bhf-company.jpg" alt="ODDO BHF" />
```

### Exemple d'utilisation
```jsx
import React from 'react';

const TeamMember = ({ name, image }) => {
  return (
    <div>
      <img 
        src={`/assets/images/team/${image}`} 
        alt={name}
        className="w-24 h-24 rounded-full object-cover"
      />
      <p>{name}</p>
    </div>
  );
};
```

### Chemin d'accès
Les images dans `public/assets/images/` sont accessibles directement via :
- `/assets/images/logos/oddo-bhf-logo.png`
- `/assets/images/team/selim-manai.jpg`
- `/assets/images/company/oddo-bhf-company.jpg`

## 📋 Checklist

### Logos
- [ ] `logos/oddo-bhf-logo.png` - Logo ODDO BHF
- [ ] `logos/verideck-logo.png` - Logo VeriDeck (optionnel)

### Entreprise
- [ ] `company/oddo-bhf-company.jpg` - Image entreprise ODDO BHF

### Équipe
- [ ] `team/selim-manai.jpg` - Photo Selim Manai
- [ ] `team/fida-naimi.jpg` - Photo Fida Naimi
- [ ] `team/mohamed-sillini.jpg` - Photo Mohamed Sillini
- [ ] `team/ghassen-bousselm.jpg` - Photo Ghassen Bousselm
- [ ] `team/cyrine-maalel.jpg` - Photo Cyrine Maalel
- [ ] `team/safa-bachagha.jpg` - Photo Safa Bachagha

## 📐 Spécifications Recommandées

### Photos Équipe
- **Format** : JPG ou PNG
- **Taille** : 400x400px minimum (format carré recommandé)
- **Poids** : < 500KB par image
- **Style** : Photo professionnelle, fond neutre

### Logo ODDO BHF
- **Format** : PNG avec transparence (ou SVG)
- **Hauteur** : 100-200px
- **Poids** : < 200KB
- **Fond** : Transparent

### Image Entreprise
- **Format** : JPG ou PNG
- **Largeur** : 1200px minimum
- **Ratio** : 16:9 ou 4:3
- **Poids** : < 1MB

## 💡 Notes

- Tous les fichiers images doivent être placés dans les dossiers correspondants
- Utilisez des noms de fichiers en minuscules avec tirets (kebab-case)
- Les images seront automatiquement servies depuis le dossier `public/`
- Après avoir ajouté les images, redémarrez le serveur de développement si nécessaire

