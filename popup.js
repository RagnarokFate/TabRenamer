document.addEventListener('DOMContentLoaded', async () => {
  // Get DOM elements
  const tabNameInput = document.getElementById('tabName');
  const renameBtn = document.getElementById('renameBtn');
  const persistCheck = document.getElementById('persistCheck');
  const recentList = document.getElementById('recentList');
  const savedList = document.getElementById('savedList');
  
  let currentTab = null;
  let recentNames = [];
  let savedUrls = {};
  
  // Get current tab info
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tabs[0];
  
  // Populate input with current tab title
  tabNameInput.value = currentTab.title;
  tabNameInput.select();
  
  // Load saved data from storage
  const data = await chrome.storage.local.get(['recentNames', 'savedUrls']);
  recentNames = data.recentNames || [];
  savedUrls = data.savedUrls || {};
  
  // Check if current URL has a saved name
  let urlKey = '';
  try {
    urlKey = new URL(currentTab.url).hostname;
  } catch {
    // Invalid URL (e.g., chrome:// pages) - urlKey remains empty
  }
  if (savedUrls[urlKey]) {
    persistCheck.checked = true;
  }
  
  // Update UI
  updateRecentList();
  updateSavedList();
  
  // Event listeners
  renameBtn.addEventListener('click', renameTab);
  tabNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') renameTab();
  });
  
  // Function to rename the tab
  async function renameTab() {
    const newName = tabNameInput.value.trim();
    if (!newName) return;
    
    // Save to recent names (avoid duplicates)
    if (!recentNames.includes(newName)) {
      recentNames.unshift(newName);
      if (recentNames.length > 5) recentNames.pop();
      await chrome.storage.local.set({ recentNames });
      updateRecentList();
    }
    
    // Save to persistent URLs if checked (only if urlKey is valid)
    if (persistCheck.checked && urlKey) {
      savedUrls[urlKey] = newName;
      await chrome.storage.local.set({ savedUrls });
      updateSavedList();
    } else if (urlKey && savedUrls[urlKey]) {
      delete savedUrls[urlKey];
      await chrome.storage.local.set({ savedUrls });
      updateSavedList();
    }
    
    chrome.runtime.sendMessage({ 
      action: 'setTabName', 
      tabId: currentTab.id, 
      name: newName 
    }).catch(() => {});
    
    chrome.tabs.sendMessage(currentTab.id, { 
      action: 'renameTab', 
      name: newName 
    }).catch(() => {});
  }
  
  // Clear all recent names
  async function clearRecentNames() {
    recentNames = [];
    await chrome.storage.local.set({ recentNames });
    updateRecentList();
  }
  
  // Delete a specific recent name by index
  async function deleteRecentName(index) {
    recentNames.splice(index, 1);
    await chrome.storage.local.set({ recentNames });
    updateRecentList();
  }
  
  // Update recent names list
  function updateRecentList() {
    recentList.innerHTML = '';
    
    // Add clear button header if there are items
    if (recentNames.length > 0) {
      const headerDiv = document.createElement('div');
      headerDiv.className = 'list-header';
      
      const headerTitle = document.createElement('span');
      headerTitle.textContent = 'Recent Names';
      headerTitle.className = 'header-title';
      
      const clearBtn = document.createElement('button');
      clearBtn.textContent = 'Clear All';
      clearBtn.className = 'clear-btn';
      clearBtn.addEventListener('click', clearRecentNames);
      
      headerDiv.appendChild(headerTitle);
      headerDiv.appendChild(clearBtn);
      recentList.appendChild(headerDiv);
    }
    
    recentNames.forEach((name, index) => {
      const li = document.createElement('li');
      
      const nameSpan = document.createElement('span');
      nameSpan.textContent = name;
      nameSpan.className = 'item-text';
      nameSpan.addEventListener('click', () => {
        tabNameInput.value = name;
      });
      
      const buttonsDiv = document.createElement('div');
      buttonsDiv.className = 'item-buttons';
      
      const useBtn = document.createElement('button');
      useBtn.textContent = 'Use';
      useBtn.className = 'action-btn';
      useBtn.addEventListener('click', () => {
        tabNameInput.value = name;
        renameTab();
      });
      
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '×';
      deleteBtn.title = 'Delete';
      deleteBtn.className = 'delete-btn';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteRecentName(index);
      });
      
      buttonsDiv.appendChild(useBtn);
      buttonsDiv.appendChild(deleteBtn);
      
      li.appendChild(nameSpan);
      li.appendChild(buttonsDiv);
      recentList.appendChild(li);
    });
    
    if (recentNames.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No recent names';
      li.style.color = '#999';
      recentList.appendChild(li);
    }
  }
  
  // Update saved URLs list
  function updateSavedList() {
    savedList.innerHTML = '';
    
    const urlEntries = Object.entries(savedUrls);
    if (urlEntries.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No saved URLs';
      li.style.color = '#999';
      savedList.appendChild(li);
      return;
    }
    
    urlEntries.forEach(([url, name]) => {
      const li = document.createElement('li');
      
      const urlDiv = document.createElement('div');
      urlDiv.className = 'item-text';
      
      const urlSpan = document.createElement('span');
      urlSpan.textContent = url;
      urlSpan.title = url;
      
      const nameSpan = document.createElement('span');
      nameSpan.textContent = ` → ${name}`;
      nameSpan.style.color = '#666';
      
      urlDiv.appendChild(urlSpan);
      urlDiv.appendChild(nameSpan);
      
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.className = 'action-btn';
      deleteBtn.addEventListener('click', async () => {
        delete savedUrls[url];
        await chrome.storage.local.set({ savedUrls });
        updateSavedList();
        if (url === urlKey) {
          persistCheck.checked = false;
        }
      });
      
      li.appendChild(urlDiv);
      li.appendChild(deleteBtn);
      savedList.appendChild(li);
    });
  }
});