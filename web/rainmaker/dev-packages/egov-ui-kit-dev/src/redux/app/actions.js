import * as actionTypes from "./actionTypes";
import { LOCALATION, ACTIONMENU, MDMS, EVENTSCOUNT, NOTIFICATIONS } from "egov-ui-kit/utils/endPoints";
import { httpRequest } from "egov-ui-kit/utils/api";
import { getCurrentAddress, getTransformedNotifications } from "egov-ui-kit/utils/commons";
import commonConfig from "config/common";
import { debug } from "util";
import { setLocale, localStorageSet, localStorageGet, getLocale, isValidLocale, getLocalizationManifest, updateLocalizationManifest } from "egov-ui-kit/utils/localStorageUtils";
// import { getModuleName } from "../../utils/commons";
import { getLocalization, getLocalizationLabels, getModule, getStoredModulesList, setStoredModulesList, setLocalizationLabelsAsync, getLocalizationLabelsAsync } from "../../utils/localStorageUtils";

const CACHE_TTL = 24 * 60 * 60 * 1000; // 1 Day

// Helper function to deduplicate localization messages by 'code' field
const deduplicateLocalizationMessages = (messages) => {
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return [];
  }

  // Use Map to keep only the last occurrence of each code (newer data overwrites older)
  const messageMap = new Map();
  messages.forEach(message => {
    if (message && message.code) {
      messageMap.set(message.code, message);
    }
  });

  const deduplicatedArray = Array.from(messageMap.values());
  const duplicatesRemoved = messages.length - deduplicatedArray.length;

  if (duplicatesRemoved > 0) {
    console.log(`[Localization] Deduplication: Removed ${duplicatesRemoved} duplicate entries out of ${messages.length} total messages`);
  }

  return deduplicatedArray;
};

// Request tracking to prevent race conditions
// Track per-module to allow parallel fetches for different modules
let localizationRequestsInProgress = new Set();

export const updateActiveRoute = (routePath, menuName) => {
  localStorageSet("menuPath", routePath);
  localStorageSet("menuName", menuName);
  return { type: actionTypes.UPDATE_ACTIVE_ROUTE_PATH, routePath };
};

export const setRoute = (route) => {
  return { type: actionTypes.SET_ROUTE, route };
};

export const setPreviousRoute = (route) => {
  return { type: actionTypes.SET_PREVIOUS_ROUTE, route };
};

export const setBottomNavigationIndex = (bottomNavigationIndex) => {
  return { type: actionTypes.CHANGE_BOTTOM_NAVIGATION_INDEX, bottomNavigationIndex };
};

export const setLocalizationLabels = (locale, localizationLabels, saveToStorage = true) => {
  // SMART STORAGE STRATEGY TO PREVENT LOCALSTORAGE OVERFLOW:
  // - rainmaker-common → localStorage ONLY (used everywhere, needs instant sync access)
  // - ALL data → IndexedDB (unlimited storage capacity)
  // - NO combined data in localStorage (this was causing quota exceeded errors)

  // FIX: Validate input - only reject if data is actually invalid (not array, null, undefined)
  // Allow empty array [] - it's valid for tenant modules with no custom translations
  if (!localizationLabels || !Array.isArray(localizationLabels)) {
    console.error('[setLocalizationLabels] ERROR: Received invalid localization data (not an array)! Aborting save.');
    console.error('[setLocalizationLabels] Input:', { type: typeof localizationLabels, isArray: Array.isArray(localizationLabels) });
    return { type: actionTypes.ADD_LOCALIZATION, locale, localizationLabels: [] };
  }

  // Log for debugging
  if (localizationLabels.length === 0) {
    console.warn(`[setLocalizationLabels] WARNING: Received empty array. This might be valid (tenant with no translations) or an error.`);
  }

  // If we are just hydrating from cache, SKIP all storage writes to prevent heavy I/O and race conditions
  if (!saveToStorage) {
    setLocale(locale);
    return { type: actionTypes.ADD_LOCALIZATION, locale, localizationLabels };
  }

  // Separate rainmaker-common from other modules
  const rainmakerCommon = localizationLabels.filter(item => item && item.module === 'rainmaker-common');
  const otherModules = localizationLabels.filter(item => item && item.module !== 'rainmaker-common');

  // CRITICAL FIX: Only update rainmaker-common if we have valid data
  // Never overwrite existing common data with empty array!
  if (rainmakerCommon.length > 0) {
    try {
      window.localStorage.setItem(`localization_${locale}_common`, JSON.stringify(rainmakerCommon));
      // Update Manifest for common
      updateLocalizationManifest(locale, 'rainmaker-common');
    } catch (e) {
      console.error(`Log => ** [localStorage] CRITICAL: Failed to save rainmaker-common:`, e);
      // Don't delete existing data on error!
    }
  }

  // FIX: REMOVED combined data write to localStorage to prevent quota exceeded
  // Previously: window.localStorage.setItem(`localization_${locale}`, JSON.stringify(localizationLabels));
  // This was causing overflow after 2-3 modules despite IndexedDB implementation

  // Instead, only write to localStorage if data is small (< 3MB) for backward compatibility
  const dataSize = JSON.stringify(localizationLabels).length;
  const sizeLimit = 3 * 1024 * 1024; // 3MB limit

  if (dataSize < sizeLimit) {
    try {
      window.localStorage.setItem(`localization_${locale}`, JSON.stringify(localizationLabels));
    } catch (e) {
      console.warn(`Log => ** [localStorage] Failed to save combined data (quota exceeded), using IndexedDB only`);
      // Clean up old combined data if it exists
      window.localStorage.removeItem(`localization_${locale}`);
    }
  } else {
    // Remove old combined data to free up space
    window.localStorage.removeItem(`localization_${locale}`);
  }

  setLocale(locale);

  // Identify unique modules in otherModules to update Manifest
  const uniqueModules = new Set(otherModules.map(item => item.module));
  uniqueModules.forEach(mod => {
    if (mod) updateLocalizationManifest(locale, mod);
  });

  // Save other modules to IndexedDB (async, non-blocking)
  if (otherModules.length > 0) {
    setLocalizationLabelsAsync(locale, otherModules, 'other_modules').catch(error => {
      console.warn('Log => ** [IndexedDB] Failed to save other modules (non-critical):', error);
    });
  }

  // CRITICAL: Save complete data to IndexedDB as primary storage
  setLocalizationLabelsAsync(locale, localizationLabels, 'combined').catch(error => {
    console.warn('Log => ** [IndexedDB] Failed to save combined data (CRITICAL - may lose data):', error);
  });

  return { type: actionTypes.ADD_LOCALIZATION, locale, localizationLabels };
};

export const toggleSnackbarAndSetText = (open, message = {}, variant) => {
  return {
    type: actionTypes.SHOW_TOAST,
    open,
    message,
    variant,
  };
};

export const fetchLocalizationLabel = (locale = 'en_IN', module, tenantId, isFromModule) => {
  return async (dispatch) => {
    if (!isValidLocale(locale)) {
      console.warn(`[fetchLocalizationLabel] Invalid locale provided: "${locale}", falling back to en_IN`);
      locale = 'en_IN';
    }

    try {
      // 1. Identify what modules code needs
      const moduleName = getModule(); // existing module from localStorage
      const requestedModule = module; // passed arg

      // 2. Normalize module names (handle rainmaker- prefix)
      //    We want to check: requestedName (e.g. pgr), prefixedName (e.g. rainmaker-pgr)
      const currentModule = moduleName;
      const currentModulePrefixed = currentModule && !currentModule.startsWith('rainmaker-') ? `rainmaker-${currentModule}` : currentModule;

      let tenantModule = "";
      let tenantModulePrefixed = "";
      if (requestedModule) {
        tenantModule = `rainmaker-${requestedModule}`;
        if (!tenantModule.startsWith('rainmaker-')) {
          tenantModulePrefixed = `rainmaker-${requestedModule}`;
        } else {
          tenantModulePrefixed = tenantModule;
        }
      }

      // 3. Check Manifest FIRST (The "Simple" Check)
      const manifest = getLocalizationManifest(locale);
      console.log(`Log => [Localization] Checking Cache for Request: locale=${locale}, module=${module}, current=${currentModulePrefixed}`);
      console.log(`Log => [Localization] Manifest State:`, manifest);

      const isCached = (mod) => {
        if (!mod) return true; // Empty module is "cached" (nothing to fetch)
        const m = manifest[mod];
        if (!m) return false;
        if (Date.now() - m.ts > CACHE_TTL) return false;
        return true;
      };

      // We check if "rainmaker-common", "currentModule", and "tenantModule" are cached.
      // We check BOTH bare and prefixed versions. If EITHER is valid, we consider it valid.

      const commonValid = isCached('rainmaker-common');

      const currentModuleValid = !currentModule || isCached(currentModule) || isCached(currentModulePrefixed);

      // If we have a tenant module request (optional), check it too
      const tenantModuleValid = !requestedModule || isCached(tenantModule) || (requestedModule && isCached(requestedModule));

      console.log(`Log => [Localization] Cache Status: Common=${commonValid}, Current=${currentModuleValid} (${currentModulePrefixed}), Tenant=${tenantModuleValid} (${tenantModule})`);

      // 4. Decision: Do we need to fetch?
      const needsFetchCommon = !commonValid;
      const needsFetchCurrent = !currentModuleValid;
      const needsFetchTenant = !tenantModuleValid;

      console.log(`Log => [Localization] Needs Fetch: Common=${needsFetchCommon}, Current=${needsFetchCurrent}, Tenant=${needsFetchTenant}`);

      // If everything is valid, LOAD FROM DB AND RETURN.
      if (!needsFetchCommon && !needsFetchCurrent && !needsFetchTenant) {
        console.log(`Log => [Localization] FAST PATH: All modules valid. Loading from DB (Skip API)...`);
        // FAST PATH: Read DB, Dispatch, Stop.
        try {
          // Load ALL data (common + modules)
          const indexedDBData = await getLocalizationLabelsAsync(locale);
          let prevLocalisationLabels = [];

          // OPTIMIZATION: Check if Array (from IndexedDB) to avoid JSON.parse
          if (Array.isArray(indexedDBData)) {
            prevLocalisationLabels = indexedDBData;
          } else if (indexedDBData) {
            prevLocalisationLabels = JSON.parse(indexedDBData);
          } else {
            // Fallback to LS
            const lsData = getLocalizationLabels();
            if (lsData) prevLocalisationLabels = JSON.parse(lsData);
          }

          // Also load common from LS if missing in IDB (legacy)
          const commonLS = localStorage.getItem(`localization_${locale}_common`);
          if (commonLS) {
            const commonData = JSON.parse(commonLS);
            // Simple merge
            prevLocalisationLabels = [...prevLocalisationLabels, ...commonData];
          }

          const deduplicated = deduplicateLocalizationMessages(prevLocalisationLabels);

          // Dispatch with saveToStorage=false to prevent redundant writes
          dispatch(setLocalizationLabels(locale, deduplicated, false));
          return;
        } catch (e) {
          console.warn('[Localization] Fast path failed, falling back to fetch', e);
        }
      }

      console.log(`Log => [Localization] SLOW PATH: Fetching API...`);

      // 5. SLOW PATH: We need to fetch something.
      //    Load existing data first so we can append to it.
      let prevLocalisationLabels = [];
      let storedModuleList = [];
      try {
        const indexedDBData = await getLocalizationLabelsAsync(locale);

        // OPTIMIZATION: Check for Array
        if (Array.isArray(indexedDBData)) {
          prevLocalisationLabels = indexedDBData;
        } else if (indexedDBData) {
          prevLocalisationLabels = JSON.parse(indexedDBData);
        } else {
          const lsData = getLocalizationLabels();
          if (lsData) prevLocalisationLabels = JSON.parse(lsData);
        }

        // Load common from LS
        const commonLS = localStorage.getItem(`localization_${locale}_common`);
        if (commonLS) {
          const commonData = JSON.parse(commonLS);
          prevLocalisationLabels = [...prevLocalisationLabels, ...commonData];
        }
      } catch (error) {
        console.warn('Error loading storage:', error);
      }

      // Update storedModuleList based on what we just loaded
      const modulesInStorage = new Set(prevLocalisationLabels.map(item => item.module));
      storedModuleList = [...modulesInStorage];

      let resultArray = [];
      let hasNewData = false;

      // Fetch Common + Current Module if needed
      if (needsFetchCommon || needsFetchCurrent) {
        // Construct module string for API
        // We prefer proper prefixed names for API
        let fetchModules = [];
        fetchModules.push('rainmaker-common');
        if (currentModule) fetchModules.push(currentModulePrefixed || currentModule); // Use prefixed if calculated, else raw

        const localeModule = fetchModules.join(',');

        const payload1 = await httpRequest(LOCALATION.GET.URL, LOCALATION.GET.ACTION, [
          { key: "module", value: localeModule },
          { key: "locale", value: locale },
          { key: "tenantId", value: commonConfig.tenantId },
        ]);

        if (payload1.messages && payload1.messages.length > 0) {
          resultArray = [...resultArray, ...payload1.messages];
          hasNewData = true;

          // Update Manifest for fetched modules
          fetchModules.forEach(m => updateLocalizationManifest(locale, m));
        }
      }

      // Fetch Tenant Module if needed
      if (needsFetchTenant && requestedModule) {
        // Use the prefixed tenant module for API
        const moduleToFetch = `rainmaker-${requestedModule}`;

        const payload2 = await httpRequest(LOCALATION.GET.URL, LOCALATION.GET.ACTION, [
          { key: "module", value: moduleToFetch },
          { key: "locale", value: locale },
          { key: "tenantId", value: tenantId ? tenantId : commonConfig.tenantId },
        ]);

        if (payload2.messages && payload2.messages.length > 0) {
          resultArray = [...resultArray, ...payload2.messages];
          hasNewData = true;
          updateLocalizationManifest(locale, moduleToFetch);
        }
      }

      const combinedArray = [...prevLocalisationLabels, ...resultArray];
      const deduplicatedArray = deduplicateLocalizationMessages(combinedArray);

      // Only write if new data fetched or cache was empty
      const shouldSaveToStorage = hasNewData || prevLocalisationLabels.length === 0;

      dispatch(setLocalizationLabels(locale, deduplicatedArray, shouldSaveToStorage));

    } catch (error) {
      console.error('[Localization] Failed to fetch localization labels:', error);
      dispatch(toggleSnackbarAndSetText(true, {
        labelName: "Failed to load translations. Please refresh the page.",
        labelKey: "ERR_LOCALIZATION_FETCH_FAILED"
      }, "error"));
    }
  };
};

export const fetchLocalizationLabelForOpenScreens = (locale = 'en_IN', module, tenantId, isFromModule) => {
  return async (dispatch) => {
    if (!isValidLocale(locale)) {
      locale = 'en_IN';
    }

    // Simplified Open Screen Logic using Manifest
    try {
      const manifest = getLocalizationManifest(locale);
      const tenantModule = `rainmaker-${module}`;

      const isCached = (mod) => {
        const m = manifest[mod];
        if (!m) return false;
        if (Date.now() - m.ts > CACHE_TTL) return false;
        return true;
      };

      // If cached, do nothing (assuming main fetch handles loading)
      // Check if we need to fetch specifically for this module
      if (module && !isCached(tenantModule)) {
        // Needs fetch
        const payload2 = await httpRequest(LOCALATION.GET.URL, LOCALATION.GET.ACTION, [
          { key: "module", value: tenantModule },
          { key: "locale", value: locale },
          { key: "tenantId", value: tenantId ? tenantId : commonConfig.tenantId },
        ]);

        if (payload2 && payload2.messages && payload2.messages.length > 0) {
          // We need to merge this into existing cache. 
          // This is "slow path" essentially.
          const indexedDBData = await getLocalizationLabelsAsync(locale);

          let prevLocalisationLabels = [];
          if (Array.isArray(indexedDBData)) {
            prevLocalisationLabels = indexedDBData;
          } else if (indexedDBData) {
            prevLocalisationLabels = JSON.parse(indexedDBData);
          }

          const combined = [...prevLocalisationLabels, ...payload2.messages];
          const dedup = deduplicateLocalizationMessages(combined);

          updateLocalizationManifest(locale, tenantModule);
          dispatch(setLocalizationLabels(locale, dedup, true));
        }
      } else {
        // If already cached, just ensure Redux is loaded (idempotent)
        const indexedDBData = await getLocalizationLabelsAsync(locale);
        if (indexedDBData) {
          const prevLocalisationLabels = Array.isArray(indexedDBData) ? indexedDBData : JSON.parse(indexedDBData);
          const dedup = deduplicateLocalizationMessages(prevLocalisationLabels);
          dispatch(setLocalizationLabels(locale, dedup, false));
        }
      }

    } catch (error) {
      console.error('[Localization] Error in fetchLocalizationLabelForOpenScreens:', error);
    }
  };
};

const setActionItems = (payload) => {
  return {
    type: actionTypes.FETCH_ACTIONMENU,
    payload,
  };
};

const setCurrentLocation = (currentLocation) => {
  return {
    type: actionTypes.SET_USER_CURRENT_LOCATION,
    currentLocation,
  };
};

export const addBreadCrumbs = (url) => {
  return { type: actionTypes.ADD_BREADCRUMB_ITEM, url };
};

export const fetchCurrentLocation = () => {
  return async (dispatch) => {
    const currAddress = await getCurrentAddress();
    dispatch(setCurrentLocation(currAddress));
  };
};
export const fetchActionItems = (role, ts) => {
  return async (dispatch, getState) => {
    try {
      const payload = await httpRequest(ACTIONMENU.GET.URL, ACTIONMENU.GET.ACTION, [], role, [], ts);

      dispatch(setActionItems(payload.actions));
    } catch (error) {
      // dispatch(complaintFetchError(error.message));
    }
  };
};

export const setUiCommonConfig = (payload) => {
  return {
    type: actionTypes.FETCH_UI_COMMON_CONFIG,
    payload,
  };
};

export const setUiCommonConstants = (payload) => {
  return {
    type: actionTypes.FETCH_UI_COMMON_CONSTANTS,
    payload,
  };
};

export const fetchUiCommonConfig = () => {
  debug;
  return async (dispatch) => {
    const requestBody = {
      MdmsCriteria: {
        tenantId: commonConfig.tenantId,
        moduleDetails: [
          {
            moduleName: "common-masters",
            masterDetails: [
              {
                name: "uiCommonConfig",
              },
            ],
          },
        ],
      },
    };
    try {
      const payload = await httpRequest(MDMS.GET.URL, MDMS.GET.ACTION, [], requestBody);
      const { MdmsRes } = payload;
      const commonMasters = MdmsRes["common-masters"];
      const UiCommonConfig = commonMasters["uiCommonConfig"];
      dispatch(setUiCommonConfig(UiCommonConfig[0]));
    } catch (error) {
      console.log('Log => ** [MDMS:UiCommonConfig]', error);
    }
  };
};

export const fetchUiCommonConstants = () => {
  debug;
  return async (dispatch) => {
    const requestBody = {
      MdmsCriteria: {
        tenantId: commonConfig.tenantId,
        moduleDetails: [
          {
            moduleName: "common-masters",
            masterDetails: [
              {
                name: "uiCommonConstants",
              },
            ],
          },
        ],
      },
    };
    try {
      const payload = await httpRequest(MDMS.GET.URL, MDMS.GET.ACTION, [], requestBody);
      const { MdmsRes } = payload;
      const commonMasters = MdmsRes["common-masters"];
      const UiCommonConstants = commonMasters["uiCommonConstants"];
      dispatch(setUiCommonConstants(UiCommonConstants[0]));
    } catch (error) {
      console.log('Log => ** [MDMS:UiCommonConstants]', error);
    }
  };
};

export const setNotificationCount = (count) => {
  return {
    type: actionTypes.GET_NOTIFICATION_COUNT,
    count,
  };
};

export const getNotificationCount = (queryObject, requestBody) => {
  return async (dispatch, getState) => {
    try {
      const payload = await httpRequest(EVENTSCOUNT.GET.URL, EVENTSCOUNT.GET.ACTION, queryObject, requestBody);
      dispatch(setNotificationCount(payload.unreadCount));
    } catch (error) {
      console.log('Log => ** [Notifications:Count]', error);
    }
  };
};

export const setNotificationsComplete = (payload) => {
  return {
    type: actionTypes.GET_NOTIFICATIONS_COMPLETE,
    payload,
  };
};

const setNotificationsPending = () => {
  return {
    type: actionTypes.GET_NOTIFICATIONS_PENDING,
  };
};

const setNotificationsError = () => {
  return {
    type: actionTypes.GET_NOTIFICATIONS_ERROR,
  };
};

export const getNotifications = (queryObject, requestBody) => {
  return async (dispatch, getState) => {
    dispatch(setNotificationsPending());
    try {
      const payload = await httpRequest(NOTIFICATIONS.GET.URL, NOTIFICATIONS.GET.ACTION, queryObject, requestBody);
      const transformedEvents = await getTransformedNotifications(payload.events);
      dispatch(setNotificationsComplete(transformedEvents));
    } catch (error) {
      dispatch(setNotificationsError(error.message));
    }
  };
};
const withTimeout = (promise, ms = 8000, timeoutMessage = "Request timed out") => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};
