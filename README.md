# Jira Template Injector

Une extension Chrome minimaliste pour automatiser l'injection de modèles de texte dans les champs de formulaires (Jira, Confluence, etc.).

## Fonctionnalités

*   **Injection Automatique** : Remplit automatiquement le champ description s'il est vide (configurable).
*   **Menu Contextuel** : Clic-droit dans n'importe quel champ texte pour insérer un modèle.
*   **Snippets (Raccourcis)** : Tapez un mot-clé (ex: `$$$okoro_small`) et il sera remplacé instantanément par le texte complet.
*   **Popup** : Cliquez sur l'icône de l'extension pour choisir un modèle dans une liste.
*   **Compatibilité** : Fonctionne sur Jira (y compris dans les iframes complexes) et sur la plupart des sites web.

## Installation

1.  Clonez ce dépôt ou téléchargez les fichiers dans un dossier.
2.  Ouvrez Google Chrome et allez sur `chrome://extensions/`.
3.  Activez le **Mode développeur** (en haut à droite).
4.  Cliquez sur **Charger l'extension non empaquetée**.
5.  Sélectionnez le dossier du projet.

## Configuration des Modèles

Les modèles sont stockés dans le fichier `templates/templates.json`. Vous pouvez modifier ce fichier pour ajouter vos propres textes.

**Format du fichier `templates.json` :**

```json
[
    {
        "name": "Nom du modèle (visible dans le menu)",
        "trigger": "$$$mon_raccourci",
        "content": "Le texte à insérer.\nPeut contenir des sauts de ligne."
    }
]
```

*   **name** : Le nom affiché dans le menu contextuel et le popup.
*   **trigger** : (Optionnel) Le raccourci texte qui déclenchera l'insertion automatique lors de la frappe.
*   **content** : Le contenu textuel à insérer.

## Utilisation

### Via Snippet
Tapez simplement le trigger défini (ex: `$$$okoro_small`) dans n'importe quel champ texte.

### Via Menu Contextuel
1.  Faites un clic-droit dans la zone de texte.
2.  Allez dans le menu **"Insérer un modèle Jira"**.
3.  Cliquez sur le modèle souhaité.

### Via Popup
1.  Cliquez sur l'icône de l'extension dans la barre d'outils Chrome.
2.  Cliquez sur le bouton correspondant au modèle.

## Structure du Projet

*   `manifest.json` : Configuration de l'extension (Manifest V3).
*   `content.js` : Script injecté dans les pages pour gérer la détection de texte et l'insertion.
*   `background.js` : Script d'arrière-plan pour gérer le menu contextuel.
*   `popup.html` / `popup.js` : Interface utilisateur du popup.
*   `templates/` : Dossier contenant les modèles JSON.
