// AWS SSO Tab Grouper - Popup Script
// Displays current role information and manages extension settings

document.addEventListener('DOMContentLoaded', async () => {
  await loadRoleInformation();
  
  // Refresh button
  document.getElementById('refresh-btn').addEventListener('click', async () => {
    await loadRoleInformation();
  });
});

async function loadRoleInformation() {
  try {
    // Get current tab
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    
    // Check if current tab is AWS-related
    if (currentTab.url.includes('console.aws.amazon.com') || 
        currentTab.url.includes('awsapps.com')) {
      
      // Check if the tab is in a group
      if (currentTab.groupId && currentTab.groupId !== -1) {
        // Get the group info
        try {
          const group = await browser.tabGroups.get(currentTab.groupId);
          document.getElementById('role-name').textContent = group.title || 'In group';
          document.getElementById('role-name').style.color = '#0066cc';
        } catch (error) {
          document.getElementById('role-name').textContent = 'Not grouped';
          document.getElementById('role-name').style.color = '#999';
        }
      } else {
        document.getElementById('role-name').textContent = 'Not grouped yet';
        document.getElementById('role-name').style.color = '#999';
      }
    } else {
      document.getElementById('role-name').textContent = 'Not on AWS page';
      document.getElementById('role-name').style.color = '#999';
    }
    
    // Load all role groups
    await loadRoleGroups();
    
  } catch (error) {
    console.error('Error loading role information:', error);
    document.getElementById('role-name').textContent = 'Error loading role';
    document.getElementById('role-name').style.color = '#cc0000';
  }
}

async function loadRoleGroups() {
  try {
    // Get stored role-group mappings
    const result = await browser.storage.local.get(['roleGroupMappings']);
    const roleGroupMappings = result.roleGroupMappings || {};
    
    const roleList = document.getElementById('role-list');
    roleList.innerHTML = '';
    
    if (Object.keys(roleGroupMappings).length === 0) {
      const li = document.createElement('li');
      li.className = 'no-roles';
      li.textContent = 'No role groups yet';
      roleList.appendChild(li);
      return;
    }
    
    // Count tabs for each role group
    for (const [groupKey, groupId] of Object.entries(roleGroupMappings)) {
      try {
        // Get the tab group
        const group = await browser.tabGroups.get(groupId);
        
        // Query tabs in this group
        const tabs = await browser.tabs.query({ groupId: groupId });
        
        if (tabs.length > 0) {
          const li = document.createElement('li');
          li.className = 'role-item';
          
          const roleName = document.createElement('span');
          roleName.className = 'role-name';
          roleName.textContent = groupKey;
          
          const tabCount = document.createElement('span');
          tabCount.className = 'tab-count';
          tabCount.textContent = `${tabs.length} tab${tabs.length !== 1 ? 's' : ''}`;
          
          li.appendChild(roleName);
          li.appendChild(tabCount);
          roleList.appendChild(li);
        }
      } catch (error) {
        // Group no longer exists
        console.log(`Group ${groupId} for ${groupKey} no longer exists`);
      }
    }
    
    if (roleList.children.length === 0) {
      const li = document.createElement('li');
      li.className = 'no-roles';
      li.textContent = 'No active role groups';
      roleList.appendChild(li);
    }
    
  } catch (error) {
    console.error('Error loading role groups:', error);
  }
}
