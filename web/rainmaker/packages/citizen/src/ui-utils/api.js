import axios from "axios";
import { fetchFromLocalStorage, addQueryArg, getDateInEpoch } from "egov-ui-framework/ui-utils/commons";
import { getSessionId, getTenantId, getLocale } from "egov-ui-kit/utils/localStorageUtils";

// Get session-based headers for API requests
const getSessionHeaders = () => {
  const sessionId = getSessionId();
  const headers = {
    "Content-Type": "application/json",
  };
  if (sessionId) {
    headers['Session-Id'] = sessionId;
  }
  return headers;
};

const instance = axios.create({
  baseURL: window.location.origin,
  headers: getSessionHeaders(),
  withCredentials: true, // Enable cookies to be sent with requests
});

// Update headers before each request to include latest session ID
instance.interceptors.request.use((config) => {
  const sessionId = getSessionId();
  if (sessionId) {
    config.headers['Session-Id'] = sessionId;
  }
  return config;
});

const wrapRequestBody = (requestBody, action) => {
  // Session ID is now passed in headers, not in request body
  let RequestInfo = {
    apiId: "Rainmaker",
    ver: ".01",
    // ts: getDateInEpoch(),
    action: action,
    did: "1",
    key: "",
    msgId: `20170310130900|${getLocale()}`,
    requesterId: "",
    // authToken removed - session is managed via cookies/headers
  };
  return Object.assign(
    {},
    {
      RequestInfo,
    },
    requestBody
  );
};

export const httpRequest = async (method = "get", endPoint, action, queryObject = [], requestBody = {}, headers = []) => {
  let apiError = "Api Error";
  headers = {
    'X-Frame-Options': 'sameorigin',
    'Cache-Control': "no-cache, no-store, no-transform, must-revalidate, max-age=0",
  }

  if (headers)
    instance.defaults = Object.assign(instance.defaults, {
      headers,
    });

  endPoint = addQueryArg(endPoint, queryObject);
  var response;
  try {
    switch (method) {
      case "post":
        response = await instance.post(endPoint, wrapRequestBody(requestBody, action));
        break;
      default:
        response = await instance.get(endPoint);
    }
    const responseStatus = parseInt(response.status, 10);
    if (responseStatus === 200 || responseStatus === 201) {
      return response.data;
    }
  } catch (error) {
    const { data, status } = error.response;
    if (status === 400 && data === "") {
      apiError = "INVALID_TOKEN";
    } else {
      apiError =
        (data.hasOwnProperty("Errors") && data.Errors && data.Errors.length && data.Errors[0].message) ||
        (data.hasOwnProperty("error") && data.error.fields && data.error.fields.length && data.error.fields[0].message) ||
        (data.hasOwnProperty("error_description") && data.error_description) ||
        apiError;
    }
  }
  // unhandled error
  throw new Error(apiError);
};

export const loginRequest = async (username = null, password = null) => {
  let apiError = "Api Error";
  headers = {
    'X-Frame-Options': 'sameorigin',
    'Cache-Control': "no-cache, no-store, no-transform, must-revalidate, max-age=0",
  }
  try {
    // api call for login
    alert("Logged in");
    return;
  } catch (e) {
    apiError = e.message;
    // alert(e.message);
  }

  throw new Error(apiError);
};

export const logoutRequest = async () => {
  let apiError = "Api Error";
  headers = {
    'X-Frame-Options': 'sameorigin',
    'Cache-Control': "no-cache, no-store, no-transform, must-revalidate, max-age=0",
  }
  try {
    alert("Logged out");
    return;
  } catch (e) {
    apiError = e.message;
    // alert(e.message);
  }

  throw new Error(apiError);
};

export const prepareForm = (params) => {
  let formData = new FormData();
  for (var k in params) {
    formData.append(k, params[k]);
  }
  return formData;
};

export const uploadFile = async (endPoint, module, file, ulbLevel) => {
  // Bad idea to fetch from local storage, change as feasible
  const tenantId = getTenantId() ? (ulbLevel ? getTenantId().split(".")[0] : getTenantId().split(".")[0]) : "";
  const uploadInstance = axios.create({
    baseURL: window.location.origin,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  const requestParams = {
    tenantId,
    module,
    file,
  };
  const requestBody = prepareForm(requestParams);

  try {
    const response = await uploadInstance.post(endPoint, requestBody);
    const responseStatus = parseInt(response.status, 10);
    let fileStoreIds = [];

    if (responseStatus === 201) {
      const responseData = response.data;
      const files = responseData.files || [];
      fileStoreIds = files.map((f) => f.fileStoreId);
      return fileStoreIds[0];
    }
  } catch (error) {
    throw new Error(error);
  }
};
