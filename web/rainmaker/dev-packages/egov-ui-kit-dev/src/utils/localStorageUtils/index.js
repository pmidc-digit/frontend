import { use } from "react";


const appName = process.env.REACT_APP_NAME;
//Fileter User Object
export const removeFields = (user = {}, fields = []) => {
  if (!user || typeof user !== "object") return user; // safety check

  const updatedUser = { ...user };

  fields.forEach((field) => {
    if (field in updatedUser) {
      delete updatedUser[field];
    }
  });

  return updatedUser;
};
//Encryption and decryption 
export const encryptUserDetails = (user={}) =>
{
  user = JSON.parse(user)
  if (!user) return null
  const mobilenumber = btoa(user.mobileNumber);
  const name = btoa(user.name);
  const emailId = btoa(user.emailId);
  const dob= btoa(user.dob);
  user = {...user, mobileNumber : mobilenumber, emailId : emailId, name : name, dob : dob}
  return JSON.stringify(user);
}
export const decryptUserDetails = (user ={})=>{
  user = JSON.parse(user)
  if(!user) return null
  const mobileNumber = atob(user.mobileNumber);
  const name = atob(user.name);
  const emailId = atob(user.emailId);
  const dob= atob(user.dob)
  user = {...user, mobileNumber : mobileNumber, emailId : emailId, name : name, dob : dob}
  return JSON.stringify(user);
}
//GET methods
export const getAccessToken = () => {
  return localStorageGet(`token`);
};
export const getUserInfo = () => {
  //return decryptUserDetails(localStorageGet("user-info"));
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
  //userInfo = encryptUserDetails(userInfo)
  localStorageSet("user-info", userInfo, null);
};
export const setAccessToken = (token) => {
  localStorageSet("token", token, null);
};
export const setRefreshToken = (refreshToken) => {
  localStorageSet("refresh-token", refreshToken, null);
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
  Object.keys(localStorage).forEach((key) => {
      window.localStorage.removeItem(key);
  });
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