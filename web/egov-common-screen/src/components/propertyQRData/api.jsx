import axios from "axios";
const isDev = import.meta.env.DEV;
const API = axios.create({
  baseURL: isDev ? "" : import.meta.env.VITE_API_HOST,
  headers: {
    "Content-Type": "application/json",
  },
});

// Function to generate RequestInfo
const generateRequestInfo = () => {
  return {
    apiId: "Rainmaker",
    ver: ".01",
    ts: Date.now(),
    action: "token",
    did: "1",
    key: "",
    msgId: `${Date.now()}|en_IN`,
    authToken: localStorage.getItem("authToken") || "",
  };
};

// Request Interceptor
API.interceptors.request.use(
  (config) => {
    // Only attach for POST / PUT / PATCH
    if (
      config.method === "post" ||
      config.method === "put" ||
      config.method === "patch"
    ) {
      config.data = {
        RequestInfo: generateRequestInfo(),
        ...config.data,
      };
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default API;