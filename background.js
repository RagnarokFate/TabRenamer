// Store current custom names for tabs
const customTabNames = new Map();

// Initialize when extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['recentNames', 'savedUrls'], (data) => {
    if (!data.recentNames) {
      chrome.storage.local.set({ recentNames: [] });
    }
    if (!data.savedUrls) {
      chrome.storage.local.set({ savedUrls: {} });
    }
  });

  chrome.contextMenus.create({
    id: 'renameTab',
    title: 'Rename this tab...',
    contexts: ['page']
  });
  
  chrome.contextMenus.create({
    id: 'renameTabAndSave',
    title: 'Rename and save for this site...',
    contexts: ['page']
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;
  
  if (info.menuItemId === 'renameTab') {
    chrome.tabs.sendMessage(tab.id, { action: 'promptRename', persist: false }).catch(() => {});
  } else if (info.menuItemId === 'renameTabAndSave') {
    chrome.tabs.sendMessage(tab.id, { action: 'promptRename', persist: true }).catch(() => {});
  }
});

// Listen for tab URL changes to apply saved names
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    applySavedNameIfExists(tabId, tab.url);
  }
});

// Check if a URL has a saved name
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkSavedUrl' && sender.tab) {
    applySavedNameIfExists(sender.tab.id, message.url);
  } else if (message.action === 'getTabName' && sender.tab) {
    // Return the custom name for the tab if it exists
    const customName = customTabNames.get(sender.tab.id);
    sendResponse({ name: customName });
  }
  return true;
});

// When a tab is renamed, store the custom name
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'setTabName' && message.name) {
    const tabId = message.tabId || sender.tab?.id;
    if (tabId) {
      customTabNames.set(tabId, message.name);
      sendResponse({ success: true });
    }
  }
  return true;
});

// Clean up when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  customTabNames.delete(tabId);
});

// Apply saved name if it exists for this URL
async function applySavedNameIfExists(tabId, url) {
  try {
    const hostname = new URL(url).hostname;
    const data = await chrome.storage.local.get(['savedUrls']);
    const savedUrls = data.savedUrls || {};
    
    if (savedUrls[hostname]) {
      // Store the custom name
      customTabNames.set(tabId, savedUrls[hostname]);
      
      // Wait a moment for the page to fully load
      setTimeout(() => {
        chrome.tabs.sendMessage(tabId, { 
          action: 'renameTab', 
          name: savedUrls[hostname] 
        });
      }, 500);
    }
  } catch (error) {
    console.error('Error applying saved name:', error);
  }
}