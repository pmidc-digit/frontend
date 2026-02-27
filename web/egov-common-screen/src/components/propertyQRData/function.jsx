import API from "./api";
import { statetenantId } from "./constant";
import { showSuccess, showError } from "../../utils/toast";
import { use } from "react";
import axios from "axios";
export const checkMobileNumber = async (number) => {
    const mobileNumberPattern = /^[6-9]\d{9}$/;

    const isMobileValid = mobileNumberPattern.test(number);
    if(isMobileValid){
       const data =  await sendOtp(number);
       console.log("data",data)
    }
}
export const sendOtp = async (mobileNumber) => {
  try {
    const payload = createOtpPayload(mobileNumber,statetenantId);

    const response = await API.post(
      "/user-otp/v1/_send?tenantId=pb",
      payload
    );
    console.log("response",response.data)
     showSuccess("Enter OTP");

  } catch (error) {
     showError(
      error?.response?.data?.Errors?.[0]?.message ||
      "Failed to send OTP"
    );
    // return {
    //   success: false,
    //   message:
    //     error?.response?.data?.Errors?.[0]?.message ||
    //     "Failed to send OTP. Please try again.",
    // };
  }
};

const createOtpPayload = (mobileNumber, tenantId, userType='CITIZEN') => ({
  otp: {
    mobileNumber,
    type: "login",
    tenantId: tenantId,
    userType: userType,
  },
});

export const loginWithOtp = async (mobileNumber, otp, userType='CITIZEN') => {
  try {
    debugger
    // Create form-urlencoded body
    const params = new URLSearchParams();
    params.append("username", mobileNumber);
    params.append("password", otp);
    params.append("grant_type", "password");
    params.append("scope", "read");
    params.append("tenantId", statetenantId);
    params.append("userType", userType);

    const response = await axios.post(
      "/user/oauth/token",
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic ZWdvdi11c2VyLWNsaWVudDplZ292LXVzZXItc2VjcmV0",
        },
      }
    );

    if (response?.status === 200) {
      return {
        success: true,
        message: "Login Successful",
        data: response.data,
      };
    }

    return {
      success: false,
      message: "Unexpected server response",
    };

  } catch (error) {
    showError(error?.response?.data?.error_description ||
          "Invalid OTP or login failed")
  //   return {
  //     success: false,
  //     message:
  //       error?.response?.data?.error_description ||
  //       "Invalid OTP or login failed",
  //   };
  //     
   }
};


export const searchPropertyBySurvey = async ({ tenantId, surveyId }) => {
  try {
    const query = new URLSearchParams({
      tenantId,
      surveyId,
    }).toString();

    const response = await API.post(
      `/property-services/property/_search?${query}`
    );

    return response?.data;
  } catch (error) {
    console.error(
      "Property Search API Error:",
      error?.response?.data || error.message
    );
    throw error;
  }
};

export const getAddressArray = (propertyaddress) => {
  if (!propertyaddress) return [];

  const addressParts = [
    propertyaddress.buildingName,
    propertyaddress.doorNo !== propertyaddress.buildingName ? propertyaddress.doorNo : null,
    propertyaddress.street,
    propertyaddress.locality?.name,
    propertyaddress.city,
    propertyaddress.district,
    propertyaddress.state,
    propertyaddress.country,
    propertyaddress.pincode,
  ];

  // Remove null, undefined, empty string
  return addressParts.filter(Boolean);
};
