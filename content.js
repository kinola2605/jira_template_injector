// Eviter les chargements multiples
if (window.hasJiraInjector) {
    // Si déjà chargé, on ne fait rien, sauf peut-être recharger les templates si besoin
    // Mais pour l'instant on sort pour éviter de dupliquer les listeners
    // console.log("Jira Template Injector: Déjà chargé dans cette frame");
} else {
    window.hasJiraInjector = true;
    console.log("Jira Template Injector: Initialisation dans la frame", window.location.href);

    let templates = [];

    // Charger les modèles au démarrage
    fetch(chrome.runtime.getURL('templates/templates.json'))
        .then(response => response.json())
        .then(data => {
            templates = data;
            // Essayer d'injecter le premier modèle par défaut si le champ est vide
            if (templates.length > 0) {
                injectTemplate(templates[0].content);
            }
        })
        .catch(err => console.error("Jira Template Injector: Erreur chargement templates", err));

    function injectTemplate(content) {
        const descriptionField = document.getElementById('description');
        
        // Vérification : le champ existe
        if (descriptionField) {
            // Auto-injection uniquement si vide
            if (descriptionField.value.trim() === '') {
                descriptionField.value = content;
                triggerInputEvent(descriptionField);
            }
        }
    }

    function triggerInputEvent(field) {
        const event = new Event('input', { bubbles: true });
        field.dispatchEvent(event);
    }

    // Suivi du dernier élément focusé pour l'injection via Popup
    let lastFocusedElement = null;
    document.addEventListener('focus', (e) => {
        lastFocusedElement = e.target;
    }, true);

    // Écouter les messages du Popup et du Background (Menu Contextuel)
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "INJECT_TEMPLATE") {
            // Priorité : 
            // 1. Élément actuellement focusé (cas du Menu Contextuel)
            // 2. Dernier élément focusé (cas du Popup qui a volé le focus)
            // 3. Fallback sur #description
            
            let target = document.activeElement;
            
            if (!target || target === document.body) {
                target = lastFocusedElement;
            }
            
            if (!target || target === document.body) {
                target = document.getElementById('description');
            }

            if (target) {
                console.log("Jira Template Injector: Cible trouvée", target);
                insertTextAtCursor(target, request.content);
                sendResponse({status: "success"});
            } else {
                console.error("Jira Template Injector: Aucune cible trouvée. ActiveElement:", document.activeElement);
                sendResponse({status: "error", message: "Aucun champ cible trouvé"});
            }
        }
    });

    function insertTextAtCursor(target, text) {
        // Cas 1: Textarea / Input
        if (target.tagName === 'TEXTAREA' || (target.tagName === 'INPUT' && target.type === 'text')) {
            const start = target.selectionStart || 0;
            const end = target.selectionEnd || 0;
            const val = target.value;
            
            target.value = val.substring(0, start) + text + val.substring(end);
            
            // Replacer le curseur après l'insertion
            target.selectionStart = target.selectionEnd = start + text.length;
            
            triggerInputEvent(target);
        }
        // Cas 2: ContentEditable (Div riche)
        else if (target.isContentEditable) {
            target.focus(); // S'assurer qu'il a le focus
            
            // Méthode 1: execCommand (Standard pour les éditeurs riches simples)
            let success = false;
            try {
                success = document.execCommand('insertText', false, text);
            } catch (e) {
                console.warn("execCommand failed", e);
            }
            
            // Méthode 2: Manipulation de Range (Fallback)
            if (!success) {
                console.log("Utilisation du fallback Range pour l'insertion");
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    range.deleteContents();
                    
                    // Création d'un noeud texte (gère mal les sauts de ligne en HTML pur, mais ok pour texte brut)
                    // Pour Jira, il vaut mieux parfois insérer des <p> ou <br> si le texte contient des \n
                    // Mais restons simple pour l'instant.
                    const textNode = document.createTextNode(text);
                    range.insertNode(textNode);
                    
                    // Déplacer le curseur
                    range.setStartAfter(textNode);
                    range.setEndAfter(textNode);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    
                    triggerInputEvent(target);
                } else {
                    // Vraiment aucun contexte, on append
                    target.innerText += text;
                    triggerInputEvent(target);
                }
            }
        }
    }

    // Utilisation d'un MutationObserver pour gérer les chargements dynamiques
    const observer = new MutationObserver((mutations) => {
        let shouldCheck = false;
        for (const mutation of mutations) {
            if (mutation.addedNodes.length > 0) {
                shouldCheck = true;
                break;
            }
        }
        
        if (shouldCheck && templates.length > 0) {
            injectTemplate(templates[0].content);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
} // Fin du check window.hasJiraInjector