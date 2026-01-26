let originalTitle = document.title;
let observer = null;
let isCustomTitle = false;

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'renameTab') {
    // Store original title if this is first override
    if (!isCustomTitle) {
      originalTitle = document.title;
      isCustomTitle = true;
    }
    
    // Force update the title
    document.title = message.name;
    startObserving();
    
    // Some websites aggressively reset the title, so we'll reapply after short delays
    setTimeout(() => document.title = message.name, 50);
    setTimeout(() => document.title = message.name, 250);
    setTimeout(() => document.title = message.name, 1000);
    
    sendResponse({ success: true });
  } else if (message.action === 'getOriginalTitle') {
    sendResponse({ title: originalTitle });
  } else if (message.action === 'resetTitle') {
    document.title = originalTitle;
    isCustomTitle = false;
    stopObserving();
    sendResponse({ success: true });
  } else if (message.action === 'promptRename') {
    const currentTitle = isCustomTitle ? document.title : originalTitle;
    const promptText = message.persist 
      ? 'Enter new tab name (will be saved for this site):' 
      : 'Enter new tab name:';
    const newName = prompt(promptText, currentTitle);
    if (newName !== null && newName.trim() !== '') {
      const trimmedName = newName.trim();
      if (!isCustomTitle) {
        originalTitle = document.title;
        isCustomTitle = true;
      }
      document.title = trimmedName;
      startObserving();
      setTimeout(() => { document.title = trimmedName; }, 50);
      setTimeout(() => { document.title = trimmedName; }, 250);
      chrome.runtime.sendMessage({ 
        action: 'setTabName', 
        tabId: null,
        name: trimmedName 
      }).catch(() => {});
      
      if (message.persist) {
        const hostname = new URL(window.location.href).hostname;
        chrome.storage.local.get(['savedUrls'], (data) => {
          const savedUrls = data.savedUrls || {};
          savedUrls[hostname] = trimmedName;
          chrome.storage.local.set({ savedUrls });
        });
      }
    }
    sendResponse({ success: true });
  }
  return true;
});

// Start observing title changes
function startObserving() {
  if (observer) {
    observer.disconnect();
  }
  
  observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      // If the page is trying to update the title and we have a custom title set
      if ((mutation.type === 'childList' || mutation.type === 'characterData') && 
          isCustomTitle && document.title !== originalTitle) {
        // Don't update if it's our own change
        const currentTitle = document.querySelector('title')?.textContent;
        if (currentTitle && currentTitle !== document.title) {
          originalTitle = currentTitle;
        }
      }
    }
  });
  
  // Observe title element changes
  const titleElement = document.querySelector('title');
  if (titleElement) {
    observer.observe(titleElement, { 
      characterData: true,
      childList: true,
      subtree: true,
      characterDataOldValue: true
    });
    
    // Also observe head for title replacements
    const headElement = document.querySelector('head');
    if (headElement) {
      observer.observe(headElement, {
        childList: true
      });
    }
  }
}

// Stop observing title changes
function stopObserving() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

// Check if this URL has a saved name
chrome.runtime.sendMessage({ action: 'checkSavedUrl', url: window.location.href });

// Add a listener for page visibility changes to reapply custom title when tab is focused
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && isCustomTitle) {
    chrome.runtime.sendMessage({ action: 'getTabName' }, (response) => {
      if (chrome.runtime.lastError) return;
      if (response && response.name) {
        document.title = response.name;
      }
    });
  }
});