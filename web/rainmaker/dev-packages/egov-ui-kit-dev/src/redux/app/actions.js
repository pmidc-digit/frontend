import * as actionTypes from "./actionTypes";
import { LOCALATION, ACTIONMENU, MDMS, EVENTSCOUNT, NOTIFICATIONS } from "egov-ui-kit/utils/endPoints";
import { httpRequest } from "egov-ui-kit/utils/api";
import { getCurrentAddress, getTransformedNotifications } from "egov-ui-kit/utils/commons";
import commonConfig from "config/common";
import { debug } from "util";
import { setLocale, localStorageSet, localStorageGet, getLocale } from "egov-ui-kit/utils/localStorageUtils";
// import { getModuleName } from "../../utils/commons";
import { getLocalization, getLocalizationLabels, getModule, getStoredModulesList, setStoredModulesList, setLocalizationLabelsAsync } from "../../utils/localStorageUtils";

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
let localizationRequestInProgress = false;

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

export const setLocalizationLabels = (locale, localizationLabels) => {
  // SMART STORAGE STRATEGY:
  // - rainmaker-common → localStorage (used everywhere, needs instant access)
  // - Other modules → IndexedDB (page-specific, less frequent access)

  // Separate rainmaker-common from other modules
  const rainmakerCommon = localizationLabels.filter(item => item.module === 'rainmaker-common');
  const otherModules = localizationLabels.filter(item => item.module !== 'rainmaker-common');

  console.log(`Log => ** [Storage Strategy] Total: ${localizationLabels.length}, Common: ${rainmakerCommon.length}, Others: ${otherModules.length}`);

  // ALWAYS keep rainmaker-common in localStorage for instant access
  window.localStorage.setItem(`localization_${locale}_common`, JSON.stringify(rainmakerCommon));
  console.log(`Log => ** [localStorage] Saved rainmaker-common: ${rainmakerCommon.length} entries (instant access)`);

  // For backward compatibility, keep combined data in localStorage
  window.localStorage.setItem(`localization_${locale}`, JSON.stringify(localizationLabels));
  setLocale(locale);

  // Save other modules to IndexedDB (async, non-blocking)
  if (otherModules.length > 0) {
    console.log(`Log => ** [IndexedDB] Saving ${otherModules.length} other module entries...`);
    setLocalizationLabelsAsync(locale, otherModules, 'other_modules').catch(error => {
      console.warn('Log => ** [IndexedDB] Failed to save other modules (non-critical):', error);
    });
  }

  // Also save complete data to IndexedDB as backup
  setLocalizationLabelsAsync(locale, localizationLabels, 'combined').catch(error => {
    console.warn('Log => ** [IndexedDB] Failed to save combined data (non-critical):', error);
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

// export const checkModuleLocalisationPresent=(locale='en_IN')=>{
//   const moduleToLoad=getModuleName();
//   let isPresent=false;
//   let localizationLabels=JSON.parse(getLocalization(`localization_${locale}`))||[];
//   if(localizationLabels.length==0){
//     return true;
//   }else if(!localizationLabels.find(localizationLabel=>localizationLabel.module==moduleToLoad.split(",")[0])){
//     return true;
//   }
//   return isPresent;
// }

export const fetchLocalizationLabel = (locale='en_IN', module, tenantId, isFromModule) => {
  return async (dispatch) => {
    // Race condition prevention: Skip if request already in progress
    if (localizationRequestInProgress) {
      console.log('Log => ** [Localization] Request already in progress, skipping duplicate call');
      return;
    }

    try {
      localizationRequestInProgress = true;
      console.log(`Log => ** [Localization] Fetching for locale=${locale}, module=${module}, isFromModule=${isFromModule}`);

      let storedModuleList=[];
      // const isLocalizationTriggered = localStorageGet("isLocalizationTriggered");
      // if(isLocalizationTriggered === "true") {
      //   return;
      // }
      if(getStoredModulesList()!==null){
          storedModuleList =JSON.parse(getStoredModulesList());
      }
      const moduleName = getModule();
      let localeModule;
      if(moduleName==='rainmaker-common'){
          localeModule='rainmaker-common';
      }
      else if(storedModuleList.includes('rainmaker-common')){
          localeModule=moduleName;
      }
      else{
        localeModule=moduleName?`rainmaker-common,${moduleName}`:`rainmaker-common`;
      }

      let resultArray = [], tenantModule = "", isCommonScreen;
      if(module!=null){
       tenantModule=`rainmaker-${module}`;
      }

      if((window.location.href.includes("/language-selection") || window.location.href.includes("/user/login")|| window.location.href.includes("/withoutAuth"))) {
         if((moduleName && storedModuleList.includes(moduleName) === false) || moduleName == null) isCommonScreen = true;
      }

      if((window.location.href.includes("/inbox"))) {
          if(moduleName && storedModuleList.includes(`rainmaker-common`)) isFromModule = false;
      }


      if((moduleName && storedModuleList.includes(moduleName) === false) || isFromModule || isCommonScreen){
        console.log(`Log => ** [Localization] Fetching module data: ${localeModule} (not in cache: [${storedModuleList.join(', ')}])`);
        // localStorageSet("isLocalizationTriggered", "true");
          const payload1 = await httpRequest(LOCALATION.GET.URL, LOCALATION.GET.ACTION, [
          { key: "module", value: localeModule },
          { key: "locale", value: locale },
          { key: "tenantId", value: commonConfig.tenantId },
        ]);
        resultArray = [...payload1.messages];
        console.log(`Log => ** [Localization] Received ${payload1.messages?.length || 0} messages for ${localeModule}`);

        // Mark module as loaded to prevent re-fetching
        if (moduleName && !storedModuleList.includes(moduleName)) {
          storedModuleList.push(moduleName);
          setStoredModulesList(JSON.stringify(storedModuleList));
        }
      } else {
        console.log(`Log => ** [Localization] Skipping fetch - ${moduleName} already in cache: [${storedModuleList.join(', ')}]`);
      }

      if((module && storedModuleList.includes(tenantModule)===false)){
        console.log(`Log => ** [Localization] Fetching tenant module: ${tenantModule}`);
        storedModuleList.push(tenantModule);
        var newList =JSON.stringify(storedModuleList);
        // setStoredModulesList(newList);
        const payload2 = module
        ? await httpRequest(LOCALATION.GET.URL, LOCALATION.GET.ACTION, [
          { key: "module", value: `rainmaker-${module}` },
          { key: "locale", value: locale },
          { key: "tenantId", value: tenantId ? tenantId : commonConfig.tenantId },
        ])
        : [];
      if (payload2 && payload2.messages) {
        console.log(`Log => ** [Localization] Received ${payload2.messages.length} messages for ${tenantModule}`);
        setStoredModulesList(newList);
        resultArray = [...resultArray, ...payload2.messages];
      }
    } else if (module) {
        console.log(`Log => ** [Localization] Skipping fetch - ${tenantModule} already in cache`);
    }

    // Load previous localization labels
    let prevLocalisationLabels = [];
    if (getLocalizationLabels() != null && !isCommonScreen && storedModuleList.length > 0) {
      prevLocalisationLabels = JSON.parse(getLocalizationLabels());
    }

    // FIX: Deduplicate before saving to prevent duplicate entries
    const combinedArray = [...prevLocalisationLabels, ...resultArray];
    const deduplicatedArray = deduplicateLocalizationMessages(combinedArray);

    console.log(`Log => ** [Localization] Final count: ${deduplicatedArray.length} entries (prev: ${prevLocalisationLabels.length}, new: ${resultArray.length})`);

    localStorage.removeItem(`localization_${getLocale()}`);
    dispatch(setLocalizationLabels(locale, deduplicatedArray));
  } catch (error) {
    // FIX: Add proper error handling instead of silent failure
    console.error('[Localization] Failed to fetch localization labels:', error);
    dispatch(toggleSnackbarAndSetText(true, {
      labelName: "Failed to load translations. Please refresh the page.",
      labelKey: "ERR_LOCALIZATION_FETCH_FAILED"
    }, "error"));
  } finally {
    // Always reset the flag, even if error occurs
    localizationRequestInProgress = false;
  }
};
};

export const fetchLocalizationLabelForOpenScreens= (locale = 'en_IN', module, tenantId, isFromModule) => {
return async (dispatch) => {
  try {
    let storedModuleList = [];
    if (getStoredModulesList() !== null) {
      storedModuleList = JSON.parse(getStoredModulesList());
    }
    const moduleName = getModule();
    let localeModule;
    if (moduleName === 'rainmaker-common') {
      localeModule = 'rainmaker-common';
    }
    else if (storedModuleList.includes('rainmaker-common')) {
      localeModule = moduleName;
    }
    else {
      localeModule = moduleName ? `rainmaker-common,${moduleName}` : `rainmaker-common`;
    }

    let resultArray = [], tenantModule = "", isCommonScreen;
    if (module != null) {
      tenantModule = `rainmaker-${module}`;
    }

    if ((module && storedModuleList.includes(tenantModule) === false)) {
      storedModuleList.push(tenantModule);
      const payload2 = module
          ? await httpRequest(LOCALATION.GET.URL, LOCALATION.GET.ACTION, [
              { key: "module", value: `rainmaker-${module}` },
              { key: "locale", value: locale },
              { key: "tenantId", value: tenantId ? tenantId : commonConfig.tenantId },
            ])
          : [];
          if (payload2 && payload2.messages) {
            resultArray = [...resultArray, ...payload2.messages];
          }
      }

      // Load previous localization labels
      let prevLocalisationLabels=[];
      if(getLocalizationLabels()!=null && !isCommonScreen && storedModuleList.length > 0){
        prevLocalisationLabels=JSON.parse(getLocalizationLabels());
      }

      // FIX: Deduplicate before saving to prevent duplicate entries
      const combinedArray = [...prevLocalisationLabels, ...resultArray];
      const deduplicatedArray = deduplicateLocalizationMessages(combinedArray);

      localStorage.removeItem(`localization_${getLocale()}`);
      // localStorageSet("isLocalizationTriggered", "false");
      dispatch(setLocalizationLabels(locale, deduplicatedArray));
    } catch (error) {
      // FIX: Add proper error handling instead of just logging
      console.error('[Localization] Failed to fetch localization labels for open screens:', error);
      dispatch(toggleSnackbarAndSetText(true, {
        labelName: "Failed to load translations. Please refresh the page.",
        labelKey: "ERR_LOCALIZATION_FETCH_FAILED"
      }, "error"));
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
