// Création des menus au démarrage ou à l'installation
chrome.runtime.onInstalled.addListener(setupMenus);
chrome.runtime.onStartup.addListener(setupMenus);

function setupMenus() {
  chrome.contextMenus.removeAll(() => {
    // Menu parent
    chrome.contextMenus.create({
      id: "jira-templates-root",
      title: "Insérer un modèle Jira",
      contexts: ["editable"]
    });

    // Chargement des templates
    fetch(chrome.runtime.getURL('templates/templates.json'))
      .then(res => res.json())
      .then(templates => {
        templates.forEach((tmpl, index) => {
          chrome.contextMenus.create({
            id: "tmpl-" + index,
            parentId: "jira-templates-root",
            title: tmpl.name,
            contexts: ["editable"]
          });
        });
      })
      .catch(err => console.error("Erreur chargement templates background:", err));
  });
}

// Gestion du clic sur le menu contextuel
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId.startsWith("tmpl-")) {
    const index = parseInt(info.menuItemId.split("-")[1]);
    
    fetch(chrome.runtime.getURL('templates/templates.json'))
      .then(res => res.json())
      .then(templates => {
        if (templates[index]) {
          const content = templates[index].content;
          const targetFrameId = info.frameId || 0;
          
          // Fonction d'envoi avec retry et injection dynamique
          const sendMessageWithRetry = () => {
            chrome.tabs.sendMessage(tab.id, {
              action: "INJECT_TEMPLATE",
              content: content
            }, { frameId: targetFrameId }, (response) => {
              // Si erreur de communication (script absent)
              if (chrome.runtime.lastError) {
                console.log("Jira Template Injector: Script absent, tentative d'injection...", chrome.runtime.lastError.message);
                
                // Injection dynamique du script
                chrome.scripting.executeScript({
                  target: { tabId: tab.id, frameIds: [targetFrameId] },
                  files: ['content.js']
                }, () => {
                  if (chrome.runtime.lastError) {
                    console.error("Jira Template Injector: Echec injection dynamique", chrome.runtime.lastError.message);
                  } else {
                    // Retry après injection (petit délai pour l'init)
                    setTimeout(() => {
                      chrome.tabs.sendMessage(tab.id, {
                        action: "INJECT_TEMPLATE",
                        content: content
                      }, { frameId: targetFrameId });
                    }, 200);
                  }
                });
              } else {
                console.log("Jira Template Injector: Message envoyé avec succès");
              }
            });
          };

          sendMessageWithRetry();
        }
      });
  }
});