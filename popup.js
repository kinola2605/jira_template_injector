document.addEventListener('DOMContentLoaded', () => {
    const list = document.getElementById('template-list');
    const status = document.getElementById('status');

    // Charger les modèles depuis le fichier JSON
    fetch(chrome.runtime.getURL('templates/templates.json'))
        .then(response => response.json())
        .then(templates => {
            templates.forEach(tmpl => {
                const btn = document.createElement('button');
                btn.textContent = tmpl.name;
                btn.onclick = () => {
                    inject(tmpl.content);
                };
                list.appendChild(btn);
            });
        })
        .catch(err => {
            list.textContent = "Erreur de chargement des modèles.";
            console.error(err);
        });

    function inject(content) {
        // Envoyer un message à l'onglet actif
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "INJECT_TEMPLATE",
                    content: content
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        // Gérer le cas où le content script n'est pas prêt ou pas injecté
                        status.textContent = "Erreur : Impossible d'injecter (page non compatible ?)";
                        status.style.color = "red";
                        status.style.display = "block";
                    } else {
                        status.textContent = "Modèle injecté !";
                        status.style.color = "green";
                        status.style.display = "block";
                        setTimeout(() => window.close(), 1000);
                    }
                });
            }
        });
    }
});