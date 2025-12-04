// AWS SSO Tab Grouper - Background Script
// Monitors AWS SSO logins and manages tab grouping by role

console.log('AWS SSO Tab Grouper: Background script loaded');

// Storage for role-to-group mappings
let roleGroupMappings = {}; // { "env-role": groupId }
let groupColorMap = {}; // { "env-role": color }
let tabRoleMap = {}; // { tabId: { environment, roleName } } - store pending role info
let tabsProcessed = {}; // { tabId: true } - track which tabs we've already grouped

// Color palette for different roles
const COLORS = [
  'blue', 'red', 'yellow', 'green', 
  'pink', 'purple', 'cyan', 'orange', 'grey'
];
let colorIndex = 0;

// Initialize extension
browser.runtime.onInstalled.addListener(() => {
  console.log('AWS SSO Tab Grouper installed');
  loadStoredMappings();
});

// Load stored mappings from storage
async function loadStoredMappings() {
  try {
    const result = await browser.storage.local.get(['roleGroupMappings', 'groupColorMap']);
    roleGroupMappings = result.roleGroupMappings || {};
    groupColorMap = result.groupColorMap || {};
    console.log('Loaded mappings:', roleGroupMappings);
  } catch (error) {
    console.error('Error loading mappings:', error);
  }
}

// Save mappings to storage
async function saveMappings() {
  try {
    await browser.storage.local.set({
      roleGroupMappings,
      groupColorMap
    });
  } catch (error) {
    console.error('Error saving mappings:', error);
  }
}

// Get or create tab group for role
async function getOrCreateTabGroup(environment, roleName, tabId) {
  try {
    const groupKey = environment ? `${environment} - ${roleName}` : roleName;
    
    // Check if we already have a group for this env-role combination
    if (roleGroupMappings[groupKey]) {
      const groupId = roleGroupMappings[groupKey];
      
      // Verify the group still exists by querying tabs in it
      try {
        const tabsInGroup = await browser.tabs.query({ groupId: groupId });
        if (tabsInGroup.length > 0) {
          console.log(`Using existing group ${groupId} for ${groupKey}`);
          return groupId;
        } else {
          // Group is empty/doesn't exist anymore
          console.log(`Group ${groupId} no longer exists, creating new one`);
          delete roleGroupMappings[groupKey];
        }
      } catch (error) {
        // Group doesn't exist anymore
        console.log(`Group ${groupId} error, creating new one:`, error.message);
        delete roleGroupMappings[groupKey];
      }
    }
    
    // Create new tab group by grouping the tab
    // This will create a new group and return its ID
    const groupId = await browser.tabs.group({
      tabIds: [tabId]
    });
    
    console.log(`Created new tab group ${groupId} for ${groupKey}`);
    
    // Update the group properties (title and color)
    const color = groupColorMap[groupKey] || COLORS[colorIndex % COLORS.length];
    if (!groupColorMap[groupKey]) {
      groupColorMap[groupKey] = color;
      colorIndex++;
    }
    
    await browser.tabGroups.update(groupId, {
      title: groupKey,
      color: color
    });
    
    roleGroupMappings[groupKey] = groupId;
    await saveMappings();
    
    console.log(`Tab group ${groupId} configured for ${groupKey}`);
    return groupId;
    
  } catch (error) {
    console.error('Error managing tab group:', error);
    return null;
  }
}

// Move tab to role group
async function moveTabToRoleGroup(tabId, environment, roleName) {
  try {
    const groupKey = environment ? `${environment} - ${roleName}` : roleName;
    console.log(`Moving tab ${tabId} to group: ${groupKey}`);
    
    const tab = await browser.tabs.get(tabId);
    
    // If tab is already in ANY group, skip (don't move it)
    if (tab.groupId && tab.groupId !== -1) {
      console.log(`Tab ${tabId} already in a group (${tab.groupId}), skipping`);
      return;
    }
    
    const groupId = await getOrCreateTabGroup(environment, roleName, tabId);
    
    if (!groupId) {
      console.error('Could not get/create tab group');
      return;
    }
    
    // Move the tab to the group
    await browser.tabs.group({
      tabIds: [tabId],
      groupId: groupId
    });
    console.log(`Tab ${tabId} moved to group ${groupId} for ${groupKey}`);
    
  } catch (error) {
    console.error('Error moving tab to group:', error);
  }
}

// Listen for messages from content scripts
browser.runtime.onMessage.addListener(async (message, sender) => {
  console.log('Received message:', message);
  
  if (message.type === 'AWS_SSO_LOGIN_DETECTED') {
    const roleName = message.roleName;
    const environment = message.environment;
    const tabId = sender.tab.id;
    
    console.log(`AWS SSO login detected: Env=${environment}, Role=${roleName}, TabID=${tabId}`);
    
    // Store the role info for this tab
    tabRoleMap[tabId] = { environment, roleName };
    
    // If the tab is already on AWS Console, group it immediately
    if (sender.tab.url && sender.tab.url.includes('console.aws.amazon.com')) {
      await moveTabToRoleGroup(tabId, environment, roleName);
      
      // Also move any other open AWS console tabs to this group
      const tabs = await browser.tabs.query({ 
        url: [
          '*://console.aws.amazon.com/*',
          '*://*.console.aws.amazon.com/*'
        ]
      });
      
      for (const tab of tabs) {
        if (tab.id !== tabId) {
          // Check if this tab is already in a group
          if (!tab.groupId || tab.groupId === -1) {
            await moveTabToRoleGroup(tab.id, environment, roleName);
          }
        }
      }
    }
    // Otherwise, wait for the tab to navigate to console (handled by onUpdated)
  }
});

// Monitor URL changes in existing tabs
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only process when URL changes or page completes loading
  if (changeInfo.url || changeInfo.status === 'complete') {
    if (tab.url && (tab.url.includes('console.aws.amazon.com') || tab.url.includes('.console.aws.amazon.com'))) {
      
      // Skip if we've already processed this tab
      if (tabsProcessed[tabId]) {
        return;
      }
      
      console.log('AWS Console page loaded/updated:', tab.url);
      
      // Check if we have stored role info for this tab
      if (tabRoleMap[tabId]) {
        const { environment, roleName } = tabRoleMap[tabId];
        console.log(`Using stored role info for tab ${tabId}: env=${environment}, role=${roleName}`);
        
        // Group the tab immediately
        await moveTabToRoleGroup(tabId, environment, roleName);
        
        // Mark as processed so we don't try to group it again
        tabsProcessed[tabId] = true;
      }
      // Don't try to extract from console page - only use stored info from SSO portal
    }
  }
});

// Clean up when tabs are closed
browser.tabs.onRemoved.addListener((tabId) => {
  delete tabRoleMap[tabId];
  delete tabsProcessed[tabId];
});

console.log('AWS SSO Tab Grouper: Background script initialized');
