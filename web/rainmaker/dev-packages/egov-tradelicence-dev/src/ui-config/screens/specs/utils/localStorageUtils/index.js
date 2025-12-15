const appName = process.env.REACT_APP_NAME;

// Cookie utility functions for session-based authentication
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

const deleteCookie = (name) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

// Session-based authentication - Get session ID from cookie
export const getSessionId = () => {
  return getCookie('SESSION_ID') || getCookie('sessionId') || getCookie('JSESSIONID') || getCookie('session-id');
};

// Deprecated: kept for backward compatibility during migration
// Returns session ID instead of access token (no token storage)
export const getAccessToken = () => {
  return getSessionId();
};

// Check if user has valid session
export const hasValidSession = () => {
  const userInfo = getUserInfo();
  const sessionId = getSessionId();
  return !!(userInfo && sessionId);
};

//GET methods
export const getUserInfo = () => {
  return localStorageGet("user-info");
};
export const getTenantId = () => {
  return localStorageGet("tenant-id");
};
export const getLocalization = (key) => {
  return localStorage.getItem(key);
};
export const getLocale = () => {
  return localStorage.getItem("locale");
};
export const getModule = () => {
  return localStorage.getItem("module");
};
export const getLocalizationLabels = () =>{
  return localStorage.getItem(`localization_${getLocale()}`);
};
export const getStoredModulesList = () =>{
  return localStorage.getItem("storedModulesList");
};

//SET methods
export const setUserInfo = (userInfo) => {
  localStorageSet("user-info", userInfo, null);
};

// Deprecated: No-op functions - tokens are no longer stored
// Session is managed via HttpOnly cookies set by the server
export const setAccessToken = (token) => {
  // No-op: Session is managed via cookies, not localStorage
  console.warn('setAccessToken is deprecated. Session is managed via cookies.');
};
export const setRefreshToken = (refreshToken) => {
  // No-op: Refresh tokens are no longer used with session-based auth
  console.warn('setRefreshToken is deprecated. Session is managed via cookies.');
};

export const setTenantId = (tenantId) => {
  localStorageSet("tenant-id", tenantId, null);
};
export const setLocale = (locale) => {
  localStorageSet("locale", locale);
};
export const setModule = (moduleName) => {
  localStorageSet("module", moduleName);
};
export const setReturnUrl = (url) => {
  localStorageSet("returnUrl", url);
};
export const setStoredModulesList =(storedModuleList) =>{
  localStorage.setItem("storedModulesList", storedModuleList);
};

//Remove Items (LOGOUT)
export const clearUserDetails = () => {
  // Clear localStorage items
  Object.keys(localStorage).forEach((key) => {
      window.localStorage.removeItem(key);
  });
  // Clear session cookies
  deleteCookie('SESSION_ID');
  deleteCookie('sessionId');
  deleteCookie('JSESSIONID');
  deleteCookie('session-id');
};
//Role specific get-set Methods
export const localStorageGet = (key, path) => {
  const appName = process.env.REACT_APP_NAME;
  let value = null;
  if (path) {
    const data = JSON.parse(window.localStorage.getItem(appName + "." + key)) || null;
    value = get(data, path);
  } else {
    value = window.localStorage.getItem(appName + "." + key) || null;
  }
  return value;
};
export const localStorageSet = (key, data, path) => {
  const appName = process.env.REACT_APP_NAME;
  const storedData = window.localStorage.getItem(appName + "." + key);

  if (path) {
    set(storedData, path, data);
    window.localStorage.setItem(appName + "." + key, storedData);
    window.localStorage.setItem(key, storedData);
  } else {
    window.localStorage.setItem(appName + "." + key, data);
    window.localStorage.setItem(key, data);
  }
};
//Remove Item
export const lSRemoveItem = (key) => {
  const appName = process.env.REACT_APP_NAME;
  window.localStorage.removeItem(appName + "." + key);
};


// get tenantId for Employee/Citizen
export const getTenantIdCommon = () => {
    return process.env.REACT_APP_NAME === "Citizen"?JSON.parse(getUserInfo()).permanentCity:getTenantId();
}