import API from "./api";
import { showError } from "../../utils/toast";
import { statetenantId } from "./constant";

export const searchGISByMobileAndTenant = async ({ mobileNo, tenantId }) => {
  try {
    const query = new URLSearchParams({
      tenantId: tenantId || statetenantId,
      mobileNumber: mobileNo,
    }).toString();

    const response = await API.post(
      `/gis-services/gis/_search?${query}`
    );

    return response?.data;
  } catch (error) {
    const errorMsg = "GIS Search API Error";
    console.error(errorMsg, error?.response?.data || error.message);
    showError(errorMsg);
    throw error;
  }
};

export const getAddressArray = (addressObj) => {
  if (!addressObj) return [];

  const addressParts = [
    addressObj.buildingName,
    addressObj.doorNo !== addressObj.buildingName ? addressObj.doorNo : null,
    addressObj.street,
    addressObj.locality?.name,
    addressObj.city,
    addressObj.district,
    addressObj.state,
    addressObj.country,
    addressObj.pincode,
  ];

  // Remove null, undefined, empty string
  return addressParts.filter(Boolean);
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
    const errorMsg = "Property Search API Error";
    console.error(errorMsg, error?.response?.data || error.message);
    showError(errorMsg);
    throw error;
  }
};

export const createTenantIDfromCity = async (city) => {
  const mdmsBody = {
    MdmsCriteria: {
      tenantId: statetenantId,
      moduleDetails: [
        {
          moduleName: "tenant",
          masterDetails: [
            {
              name: "tenantsMapping",
            }
          ]
        }
      ]
    }
  };

  try {
    const response = await API.post(
      "/egov-mdms-service/v1/_search",
      mdmsBody
    );
    const cityTenantId = response?.data.MdmsRes.tenant.tenantsMapping.find(item => item.gisCityName === city);
    return cityTenantId?.tenantName;
  } catch (error) {
    const errorMsg = "Tenant ID Search API Error";
    console.error(errorMsg, error?.response?.data || error.message);
    showError(errorMsg);
    throw error;
  }
}
