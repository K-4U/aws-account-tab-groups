// AWS SSO Tab Grouper - Content Script
// Runs on AWS SSO and AWS Console pages to detect role information

console.log('AWS SSO Tab Grouper: Content script loaded on', window.location.href);

// Track if we've already notified for this page to avoid duplicates
let hasNotified = false;

// Extract role name and environment from the page
function extractRoleFromPage() {
  let roleName = null;
  let environment = null;
  
  // PRIORITY 1: Check URL hash for SSO portal role selection
  if (window.location.href.includes('awsapps.com')) {
    const hash = window.location.hash;
    const hashParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
    const roleParam = hashParams.get('role_name');
    const accountId = hashParams.get('account_id');
    
    if (roleParam) {
      const decodedRole = decodeURIComponent(roleParam);
      console.log('Found role_name in hash:', decodedRole);
      
      // Parse: RoleName@env or RoleName-%40env (supports both @ and -%40)
      const envMatch = decodedRole.match(/^(.+?)(?:-%40|@)(.+)$/);
      if (envMatch) {
        roleName = envMatch[1];
        environment = envMatch[2];
        console.log(`Parsed from SSO portal: env=${environment}, role=${roleName}`);
        return { roleName, environment };
      }
      
      // Use role name as-is
      roleName = decodedRole.replace(/[@]$/, ''); // Remove trailing @
      console.log('Using role name:', roleName);
      
      // Use account_id as environment if available
      if (accountId) {
        environment = accountId;
        console.log('Using account_id as environment:', environment);
      }
      
      return { roleName, environment };
    }
  }
  
  // PRIORITY 2: Check URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const roleParam = urlParams.get('role_name');
  
  if (roleParam) {
    const decodedRole = decodeURIComponent(roleParam);
    console.log('Found role_name parameter:', decodedRole);
    
    // Parse environment from role name
    const envMatch = decodedRole.match(/^(.+?)(?:-%40|@)(.+)$/);
    if (envMatch) {
      roleName = envMatch[1];
      environment = envMatch[2];
      console.log(`Parsed from URL: env=${environment}, role=${roleName}`);
      return { roleName, environment };
    }
  }
  
  // PRIORITY 3: For AWS Console pages
  if (window.location.href.includes('console.aws.amazon.com')) {
    console.log('AWS Console page detected, attempting to extract role...');
    
    // Try to get role from various console elements FIRST
    // Method 1: Look for role in the user menu dropdown (most reliable)
    const roleSelectors = [
      '[data-testid="awsc-nav-account-menu-button"]',
      '#nav-usernameMenu',
      '[data-testid="awsc-username"]',
      '.awsc-username',
      'button[aria-label*="profile"]'
    ];
    
    for (const selector of roleSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent || element.innerText || element.getAttribute('aria-label') || '';
        console.log('Checking element:', selector, 'Text:', text);
        
        // Pattern: RoleName / AccountName or RoleName @ AccountName
        const roleMatch = text.match(/([A-Za-z0-9_-]+)\s*[/@]\s*([A-Za-z0-9_-]+)/);
        if (roleMatch) {
          roleName = roleMatch[1];
          // Use account name/ID as environment if we don't have one
          if (!environment) {
            environment = roleMatch[2];
          }
          console.log('Found role in user menu:', roleName, 'env:', environment);
          return { roleName, environment };
        }
      }
    }
    
    // Method 2: Check URL hash for role
    if (!roleName) {
      const hashMatch = window.location.hash.match(/role\/([^/]+)/);
      if (hashMatch) {
        roleName = hashMatch[1];
        console.log('Found role in URL hash:', roleName);
      }
    }
    
    // Method 3: Check the top navigation bar
    if (!roleName) {
      const navElements = document.querySelectorAll('nav span, nav div, header span, header div');
      for (const element of navElements) {
        const text = element.textContent || element.innerText;
        if (text.includes('/') || text.includes('@')) {
          const parts = text.split(/[/@]/);
          if (parts.length >= 2 && parts[0].trim().length > 3) {
            roleName = parts[0].trim();
            if (!environment && parts[1].trim().length > 0) {
              environment = parts[1].trim();
            }
            console.log('Found role in navigation:', roleName, 'env:', environment);
            break;
          }
        }
      }
    }
    
    // Method 4: Document title
    if (!roleName) {
      const titleMatch = document.title.match(/([A-Za-z0-9_-]+)\s*[/@]\s*([A-Za-z0-9_-]+)/);
      if (titleMatch) {
        roleName = titleMatch[1];
        if (!environment) {
          environment = titleMatch[2];
        }
        console.log('Found role in document title:', roleName, 'env:', environment);
      }
    }
    
    // Extract from subdomain as LAST resort for environment
    if (!environment) {
      // Pattern: account-env.region.console.aws.amazon.com or accountid.region.console.aws.amazon.com
      const hostnameMatch = window.location.hostname.match(/^(\d+)(?:-([^.]+))?\./);
      if (hostnameMatch) {
        environment = hostnameMatch[2] || hostnameMatch[1]; // Use suffix or account ID
        console.log('Found environment in hostname:', environment);
      }
    }
    
    // Return whatever we found
    if (roleName) {
      return { roleName, environment };
    }
  }
  
  return roleName ? { roleName, environment } : null;
}

// Detect AWS SSO login completion
function detectAWSLogin() {
  // ONLY process AWS SSO portal, NOT console
  if (window.location.href.includes('awsapps.com')) {
    console.log('AWS SSO portal page detected, attempting to extract role and environment...');
    
    const result = extractRoleFromPage();
    
    if (result && result.roleName) {
      console.log('AWS role found:', result);
      notifyBackgroundScript(result.roleName, result.environment);
      return;
    } else {
      console.log('Role not yet available in SSO portal, will retry...');
    }
  }
}

// Notify background script of detected role and environment
function notifyBackgroundScript(roleName, environment) {
  // Avoid duplicate notifications
  if (hasNotified) {
    console.log('Already notified for this page, skipping');
    return;
  }
  
  console.log(`Notifying background script - env: ${environment}, role: ${roleName}`);
  hasNotified = true;
  
  browser.runtime.sendMessage({
    type: 'AWS_SSO_LOGIN_DETECTED',
    roleName: roleName,
    environment: environment,
    url: window.location.href
  }).catch(error => {
    console.error('Error sending message to background script:', error);
    hasNotified = false; // Reset on error so we can retry
  });
}

// Monitor role selection on AWS SSO portal - REMOVED (not needed)
// We only care about AWS Console, not the portal

// Listen for messages from background script
browser.runtime.onMessage.addListener((message) => {
  console.log('Content script received message:', message.type);
  
  if (message.type === 'EXTRACT_ROLE_INFO') {
    // ONLY extract from SSO portal, not from console
    if (window.location.href.includes('awsapps.com')) {
      console.log('Extracting role and environment info on request from SSO portal...');
      const result = extractRoleFromPage();
      if (result && result.roleName) {
        console.log('Found role:', result);
        notifyBackgroundScript(result.roleName, result.environment);
      } else {
        console.log('No role found yet in SSO portal');
      }
    }
  }
  
  if (message.type === 'EXTRACT_ROLE_FROM_CONSOLE') {
    // Extract from AWS Console page
    if (window.location.href.includes('console.aws.amazon.com')) {
      console.log('Extracting role from AWS Console page...');
      
      // Wait a bit for the page to fully load
      setTimeout(() => {
        const result = extractRoleFromPage();
        if (result && result.roleName) {
          console.log('Found role in console:', result);
          notifyBackgroundScript(result.roleName, result.environment);
        } else {
          console.log('Could not extract role from console page');
        }
      }, 1000);
    }
  }
});

// Run detection when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', detectAWSLogin);
} else {
  detectAWSLogin();
}

// Listen for hash changes on AWS SSO portal (when user clicks on a role/account)
if (window.location.href.includes('awsapps.com')) {
  window.addEventListener('hashchange', () => {
    console.log('Hash changed on SSO portal:', window.location.hash);
    hasNotified = false; // Reset so we can notify again
    detectAWSLogin();
  });
  
  // Also use MutationObserver to catch dynamic content changes
  const observer = new MutationObserver(() => {
    if (!hasNotified) {
      const result = extractRoleFromPage();
      if (result && result.roleName) {
        console.log('Role detected via mutation observer:', result);
        notifyBackgroundScript(result.roleName, result.environment);
      }
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Add a short retry check in case the hash isn't set immediately
  setTimeout(() => {
    if (!hasNotified) {
      detectAWSLogin();
    }
  }, 500);
}

console.log('AWS SSO Tab Grouper: Content script initialized');
