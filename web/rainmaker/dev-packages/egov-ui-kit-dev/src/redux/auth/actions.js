import * as authType from "./actionTypes";
import { toggleSnackbarAndSetText } from "egov-ui-kit/redux/app/actions";
import { httpRequest, loginRequest } from "egov-ui-kit/utils/api";
import { AUTH, USER, OTP } from "egov-ui-kit/utils/endPoints";
import { prepareFormData } from "egov-ui-kit/utils/commons";
import get from "lodash/get";
import {
  setTenantId,
  getSessionId,
  setUserInfo,
  localStorageSet,
  localStorageGet,
  clearUserDetails,
  removeFields
} from "../../utils/localStorageUtils";

// temp fix
const fixUserDob = (user = {}) => {
  const dob = user.dob;
  let transformeddob = null;
  if (dob && dob !== null) {
    let date = new Date(dob);
    transformeddob = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
    user = { ...user, dob: transformeddob };
  }
  return user;
};

export const userProfileUpdated = (payload = {}) => {
  const user = fixUserDob(payload.user[0]);
  setUserInfo(JSON.stringify(user));
  return { type: authType.USER_PROFILE_UPDATED, user };
};

export const userProfileUpdateError = (error) => {
  return { type: authType.USER_PROFILE_UPDATE_ERROR, error };
};

//user search success/failure
export const searchUserSuccess = (user = {}) => {
  user = fixUserDob(user.user[0]);
  user = removeFields(user, [aadhaarNumber, pan, bloodGroup, identificationMark])
  // delete user.aadhaarNumber;
  // delete user.pan;
  // delete user.bloodGroup;
  // delete user.identificationMark;
  //temporary fix for dat of birth format issue in prfile update
  setUserInfo(JSON.stringify(user));
  return { type: authType.USER_SEARCH_SUCCESS, user };
};

export const searchUserError = (error) => {
  return { type: authType.USER_SEARCH_ERROR, error };
};

export const authenticating = () => {
  return { type: authType.AUTHENTICATING };
};

// Session-based authentication - tokens are no longer stored client-side
// Session is managed via HttpOnly cookies set by the server
export const authenticated = (payload = {}) => {
  const userInfo = fixUserDob(payload["UserRequest"]);
  const lastLoginTime = new Date().getTime();

  // Store user info (not tokens - session managed via cookies)
  setUserInfo(JSON.stringify(userInfo));
  setTenantId(userInfo.tenantId);
  localStorageSet("last-login-time", lastLoginTime);
  localStorageSet("CITIZEN.CITY", userInfo.permanentCity);

  // Note: access_token and refresh_token are no longer stored
  // Session is managed via HttpOnly cookies set by the server
  return { type: authType.AUTHENTICATED, userInfo, authenticated: true };
};

export const authenticationFailed = () => {
  return { type: authType.AUTHENTICATION_FAILED };
};

// sending otp
export const sendOtpStarted = () => {
  return { type: authType.SEND_OTP_STARTED };
};

export const sendOtpCompleted = () => {
  return { type: authType.SEND_OTP_COMPLETED };
};

export const searchUser = () => {
  return async (dispatch, getState) => {
    const state = getState();
    const { userName, tenantId } = state.auth.userInfo || {};
    try {
      const user = await httpRequest(USER.SEARCH.URL, USER.SEARCH.ACTION, [], { userName, tenantId });
      delete user.responseInfo;
      dispatch(searchUserSuccess(user));
    } catch (error) {
      dispatch(searchUserError(error.message));
    }
  };
};

// Deprecated: Session refresh is now handled by the server via cookies
// This function is kept for backward compatibility but will trigger logout on session expiry
export const refreshTokenRequest = () => {
  return async (dispatch) => {
    // With session-based auth, session refresh is handled by the server
    // If session expires, user must re-authenticate
    console.warn('refreshTokenRequest is deprecated. Session is managed via server cookies.');
    dispatch(logout());
  };
};

// in future if you want to keep a track the number of times otp is sent
export const sendOTP = (intent) => {
  return async (dispatch, getState) => {
    const state = getState();
    const form = state.form[intent];
    const formData = prepareFormData(form);
    dispatch(sendOtpStarted());
    try {
      const formResponse = await httpRequest(OTP.RESEND.URL, OTP.RESEND.ACTION, [], formData);
    } catch (error) {}
    dispatch(sendOtpCompleted());
    dispatch(toggleSnackbarAndSetText(true, { labelName: "OTP has been Resent", labelKey: "ERR_OTP_RESENT" },"success"));
  };
};

// Session-based logout - clears local data and calls server logout endpoint
export const logout = () => {
  return async () => {
    try {
      const sessionId = getSessionId();
      if (sessionId) {
        // Call server logout endpoint to invalidate session
        // Server will clear the session cookie
        await httpRequest(AUTH.LOGOUT.URL, AUTH.LOGOUT.ACTION, []);
      }
    } catch (error) {
      console.log('Logout request error:', error);
      // Continue with local cleanup even if server request fails
    }

    // Clear all local user data and cookies
    clearUserDetails();

    // Redirect to appropriate login page
    const redirectUrl = process.env.REACT_APP_NAME === "Citizen"
      ? `${window.basename}/user/register`
      : `${window.basename}/user/login`;
    window.location.replace(redirectUrl);
  };
};
