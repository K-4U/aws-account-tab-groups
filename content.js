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
      
      // Fallback: just use the whole thing as role name
      roleName = decodedRole.replace(/[@]$/, ''); // Remove trailing @
      console.log('Using full role name:', roleName);
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
    
    // Extract from subdomain if we don't have environment yet
    // Pattern: account-env.region.console.aws.amazon.com
    const hostnameMatch = window.location.hostname.match(/^(\d+)-([^.]+)\./);
    if (hostnameMatch && !environment) {
      environment = hostnameMatch[2];
      console.log('Found environment in hostname:', environment);
    }
    
    // Try to get role from various console elements
    if (!roleName) {
      // Method 1: Check URL hash for role
      const hashMatch = window.location.hash.match(/role\/([^/]+)/);
      if (hashMatch) {
        roleName = hashMatch[1];
        console.log('Found role in URL hash:', roleName);
      }
    }
    
    // Method 2: Look for role in the user menu dropdown
    if (!roleName) {
      const roleSelectors = [
        '[data-testid="awsc-nav-account-menu-button"]',
        '#nav-usernameMenu',
        '[data-testid="awsc-username"]',
        '.awsc-username'
      ];
      
      for (const selector of roleSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.textContent || element.innerText;
          // Pattern: RoleName / Account or RoleName@Account
          const roleMatch = text.match(/([A-Za-z0-9_-]+)\s*[/@]\s*[A-Za-z0-9]/);
          if (roleMatch) {
            roleName = roleMatch[1];
            console.log('Found role in user menu:', roleName);
            break;
          }
        }
      }
    }
    
    // Method 3: Check the top navigation bar
    if (!roleName) {
      const navElements = document.querySelectorAll('nav span, nav div');
      for (const element of navElements) {
        const text = element.textContent || element.innerText;
        if (text.includes('/')) {
          const parts = text.split('/');
          if (parts.length >= 2 && parts[0].trim().length > 0) {
            roleName = parts[0].trim();
            console.log('Found role in navigation:', roleName);
            break;
          }
        }
      }
    }
    
    // Method 4: Document title
    if (!roleName) {
      const titleMatch = document.title.match(/([A-Za-z0-9_-]+)\s*\/\s*AWS/);
      if (titleMatch) {
        roleName = titleMatch[1];
        console.log('Found role in document title:', roleName);
      }
    }
    
    if (roleName && environment) {
      return { roleName, environment };
    }
  }
  
  return roleName && environment ? { roleName, environment } : null;
}

// Detect AWS SSO login completion
function detectAWSLogin() {
  // ONLY process AWS SSO portal, NOT console
  if (window.location.href.includes('awsapps.com')) {
    console.log('AWS SSO portal page detected, attempting to extract role and environment...');
    
    const result = extractRoleFromPage();
    
    if (result && result.roleName && result.environment) {
      console.log('AWS role and environment found:', result);
      notifyBackgroundScript(result.roleName, result.environment);
      return;
    } else {
      console.log('Role/environment not yet available in SSO portal, will retry...');
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
      if (result && result.roleName && result.environment) {
        console.log('Found role and environment:', result);
        notifyBackgroundScript(result.roleName, result.environment);
      } else {
        console.log('No role/environment found yet in SSO portal');
      }
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
      if (result && result.roleName && result.environment) {
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
