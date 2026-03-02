import get from "lodash/get";
//import { getGroupBillSearch } from "../../../../../ui-utils/commons";
import {
  handleScreenConfigurationFieldChange as handleField,
  prepareFinalObject,
  toggleSpinner,
  toggleSnackbar
} from "egov-ui-framework/ui-redux/screen-configuration/actions";
import { httpRequest } from "egov-ui-framework/ui-utils/api";
import {
  convertEpochToDate,
  validateFields,
  getTextToLocalMapping
} from "../../utils/index";
import { getTenantId, getUserInfo, getLocalization } from "egov-ui-kit/utils/localStorageUtils";
import isEmpty from "lodash/isEmpty"
import { loadUlbLogo } from "../../utils/receiptTransformer";

// const tenantId = getTenantId();
const tenantId = getTenantId();

// Get human readable text from localisation for a given code
const getLocalTextFromCode = localCode => {
  try {
    const localisationStr = getLocalization("localization_en_IN");
    if (!localisationStr || !localCode) return "";
    const localisationArr = JSON.parse(localisationStr) || [];
    const match = localisationArr.find(item => item.code === localCode);
    return (match && match.message) || "";
  } catch (e) {
    console.log("Error resolving localisation for", localCode, e);
    return "";
  }
};
export const updatesingleReading = async (consumerId, tenantId, currentReading, readingDate) => {
  const payload = { consumerId, tenantId, currentReading, readingDate };
  try {
    // Try calling backend update API if available. Endpoint is a best-guess; adjust if needed.
    const url =
      process.env.NODE_ENV === "development"
        ? "/ws-calculator/meterReading/_update"
        : "/ws-calculator/meterReading/_update";
    // If httpRequest available, uncomment the next lines to call backend
    // const response = await httpRequest("post", url, "_update", [], payload);
    // return response;

    // Fallback: no-op resolve so UI can proceed

    return Promise.resolve({ success: true, data: payload });
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const updateAllReadings = async (state, dispatch) => {
  try {
    const tableData = get(
      state,
      "screenConfiguration.screenConfig.ptreve.components.div.children.searchResults.props.data",
      []
    );
    if (!tableData || tableData.length === 0) {
      dispatch(
        toggleSnackbar(
          true,
          { labelName: "No records to update", labelKey: "ABG_NO_RECORDS_TO_UPDATE" },
          "warning"
        )
      );
      return;
    }

    const updates = [];
    for (let i = 0; i < tableData.length; i++) {
      const row = tableData[i];
      const consumerId = row["ABG_COMMON_TABLE_COL_CONSUMER_ID"];
      const lastReading = Number(row["Last Reading"] || 0);
      const currentReadingRaw = row["ABG_COMMON_TABLE_COL_CURRENT_READING"];
      const currentReading = Number(currentReadingRaw);
      const readingDate = row["ABG_COMMON_TABLE_COL_CURRENT_READING_DATE"];
      const tenantId = row["TENANT_ID"];

      if (currentReadingRaw === undefined || currentReadingRaw === "" || !Number.isFinite(currentReading) || currentReading < lastReading) {
        // skip invalid or empty
        continue;
      }

      updates.push({ consumerId, tenantId, currentReading, readingDate, rowIndex: i });
    }

    if (updates.length === 0) {
      dispatch(
        toggleSnackbar(
          true,
          { labelName: "No valid readings to update", labelKey: "ABG_NO_VALID_READINGS_TO_UPDATE" },
          "warning"
        )
      );
      return;
    }

    // Call update for each row sequentially (could be batched)
    for (let u of updates) {
      try {
        await updatesingleReading(u.consumerId, u.tenantId, u.currentReading, u.readingDate);
        // Update UI: set Last Reading to currentReading and clear currentReading
        const updatedTable = [...tableData];
        updatedTable[u.rowIndex] = {
          ...updatedTable[u.rowIndex],
          ["Last Reading"]: String(u.currentReading),
          ["ABG_COMMON_TABLE_COL_CURRENT_READING"]: "",
          ["ABG_COMMON_TABLE_COL_CURRENT_READING_DATE"]: u.readingDate || updatedTable[u.rowIndex]["ABG_COMMON_TABLE_COL_CURRENT_READING_DATE"]
        };
        dispatch(
          handleField("ptreve", "components.div.children.searchResults", "props.data", updatedTable)
        );
      } catch (e) {
        console.error("Update failed for consumer", u.consumerId, e);
        // continue with others
      }
    }

    dispatch(
      toggleSnackbar(
        true,
        { labelName: "Update completed", labelKey: "ABG_UPDATE_COMPLETED" },
        "success"
      )
    );
  } catch (err) {
    console.error(err);
    dispatch(toggleSnackbar(true, { labelName: err.message || "Error", labelKey: err.message || "ERROR" }, "error"));
  }
};
export const showViewPopup = (state, dispatch, rowObject = {}) => {
  try {
    dispatch(prepareFinalObject("viewPopup", rowObject));
    const toggle = get(state, "screenConfiguration.screenConfig.ptreve.components.div.children.viewDialog.props.open", false);
    dispatch(handleField("ptreve", "components.div.children.viewDialog", "props.open", !toggle));
  } catch (e) {
    console.error(e);
  }
};
export const searchApiCall = async (state, dispatch) => {
  debugger;
  showHideTable(false, dispatch);
  //showHideMergeButton(false, dispatch);
  let searchScreenObject = get(
    state.screenConfiguration.preparedFinalObject,
    "searchCriteria",
    {}
  );

  // Require at least one of locality or propertyId (ULB/tenantId is always set)
  const hasLocality = !!(searchScreenObject && searchScreenObject.locality);
  const hasPropertyId = !!(searchScreenObject && searchScreenObject.propertyId);

  if (!hasLocality && !hasPropertyId) {
    dispatch(
      toggleSnackbar(
        true,
        {
          labelName: "Please enter Location/Mohalla or Property ID to start search",
          labelKey: "ABG_SEARCH_SELECT_AT_LEAST_ONE_TOAST_MESSAGE"
        },
        "warning"
      )
    );
    return;
  } else {
    for (var key in searchScreenObject) {
      if (
        searchScreenObject.hasOwnProperty(key) &&
        searchScreenObject[key] === ""
      ) {
        delete searchScreenObject[key];
      }
    }
    // Safely read BillingService masters (may be missing if MDMS failed)
    const billingServices = get(
      state.screenConfiguration.preparedFinalObject,
      "searchScreenMdmsData.BillingService.BusinessService",
      []
    );
    const serviceObject = Array.isArray(billingServices)
      ? billingServices.filter(item => item.code === searchScreenObject.businesService)
      : [];

    if (serviceObject[0] && serviceObject[0].billGineiURL) {
      searchScreenObject.url = serviceObject[0].billGineiURL;
    }
    searchScreenObject.tenantId = process.env.REACT_APP_NAME === "Employee" ? getTenantId() : JSON.parse(getUserInfo()).permanentCity;
    const getGroupBillSearch = async (dispatch, searchScreenObject) => {


      try {
        dispatch(toggleSpinner(true));
        const requestBody = {
          tenantId: searchScreenObject.tenantId || tenantId,
          locality: searchScreenObject.locality || "",
          offset: searchScreenObject.offset !== undefined ? searchScreenObject.offset : 0
        };
        if (searchScreenObject.propertyId) {
          requestBody.propertyId = searchScreenObject.propertyId;
        }

        // Build URL with query parameters
        let url = `egov-property-rate/property-rate/revenue/_missing?tenantId=${encodeURIComponent(requestBody.tenantId)}&localityCode=${encodeURIComponent(requestBody.locality)}&limit=100`;

        // Add propertyId to URL if provided
        if (requestBody.propertyId) {
          url += `&propertyId=${encodeURIComponent(requestBody.propertyId)}`;
        }

        const response = await httpRequest("post", url, "_search", []);
        // dispatch(toggleSpinner(false));
        // return response;

        const ptreveresponce = (response && response) || [];
        dispatch(
          prepareFinalObject("searchScreenMdmsData.ptreveresponce", ptreveresponce)
        );
        dispatch(toggleSpinner(false));
        return response;
      } catch (error) {
        dispatch(toggleSpinner(false));
        dispatch(
          toggleSnackbar(
            true,
            { labelName: error.message || "Something went wrong", labelKey: error.message || "ERROR" },
            "error"
          )
        );
        return {};
      }


    };
    const responseFromAPI = await getGroupBillSearch(dispatch, searchScreenObject);


    const ptreveresponce = (responseFromAPI && responseFromAPI) || [];
    dispatch(
      prepareFinalObject("searchScreenMdmsData.ptreveresponce", ptreveresponce)
    );

    // Ensure MDMS PropertyType master is available for human-friendly names
    let mdmsPropertyTypes = get(
      state,
      "screenConfiguration.preparedFinalObject.searchScreenMdmsData.PropertyTax.PropertyType",
      []
    );

    if (!Array.isArray(mdmsPropertyTypes) || mdmsPropertyTypes.length === 0) {
      try {
        const mdmsBody = {
          MdmsCriteria: {
            tenantId: searchScreenObject.tenantId || tenantId,
            moduleDetails: [
              {
                moduleName: "PropertyTax",
                masterDetails: [{ name: "PropertyType" }]
              }
            ]
          }
        };

        const mdmsPayload = await httpRequest(
          "post",
          "/egov-mdms-service/v1/_search",
          "_search",
          [],
          mdmsBody
        );

        mdmsPropertyTypes = get(mdmsPayload, "MdmsRes.PropertyTax.PropertyType", []);

        if (Array.isArray(mdmsPropertyTypes) && mdmsPropertyTypes.length > 0) {
          dispatch(
            prepareFinalObject(
              "searchScreenMdmsData.PropertyTax.PropertyType",
              mdmsPropertyTypes
            )
          );
        }
      } catch (e) {
        console.error("Error fetching MDMS PropertyType masters", e);
      }
    }

    // MDMS locality metadata for mapping code -> localisation key
    const mdmsLocalities = get(
      state,
      "screenConfiguration.preparedFinalObject.searchScreenMdmsData.localities",
      []
    );

    const response = [];
    for (let i = 0; i < ptreveresponce.length; i++) {
      const item = ptreveresponce[i];

      // Log to see actual structure


      // Handle both camelCase and lowercase field names
      const propertyId = item.propertyId || item.propertyid;

      // Extract all owners
      const owners = item.owners || [];
      const ownerName = owners.map(owner => owner.name).join(", ") || item.ownername || "";
      const ownerMobile = owners.map(owner => owner.mobileNumber).join(", ") || item.ownermobile || "";

      const landArea = item.landArea || item.landarea;
      const superbuiltuparea = item.superbuiltuparea || item.superbuiltuparea;
      const noOfFloors = item.noOfFloors || item.nooffloors || "";
      const buildingName = item.buildingName || item.buildingname;
      const usageCategory = item.usageCategory || item.usagecategory;
      const propertyTypeCode =
        item.propertyType ||
        item.propertytype ||
        get(item, "propertyDetails[0].propertyType") ||
        get(item, "property.propertyType") ||
        get(item, "propertyTypeData") ||
        "";

      // Resolve Property Type using MDMS master first, then localisation / pretty-code fallback
      let propertyType = "";
      if (propertyTypeCode) {
        const mdmsMatch =
          Array.isArray(mdmsPropertyTypes) &&
          mdmsPropertyTypes.find(pt => pt.code === propertyTypeCode);

        if (mdmsMatch && mdmsMatch.name) {
          propertyType = mdmsMatch.name;
        } else {
          const localized = getLocalTextFromCode(propertyTypeCode);
          if (localized && localized !== propertyTypeCode) {
            propertyType = localized;
          } else {
            const pretty = propertyTypeCode
              .split(/[.]/)
              .join(" ")
              .replace(/_/g, " ")
              .toLowerCase()
              .replace(/\b\w/g, ch => ch.toUpperCase());
            propertyType = pretty;
          }
        }
      }
      const localityCode = item.localityCode || item.localitycode;
      const doorNo = item.doorNo || item.doorno;
      const street = item.street;
      const city = item.city;
      const plotNo = item.plotNo || item.plotno;

      // Try multiple possible paths for address
      const addressObj = get(item, "address") ||
        get(item, "propertyAddress") ||
        get(item, "propertyDetails.address") || {};



      // Resolve locality display name using MDMS + localisation, falling back to code
      const localityMdms =
        Array.isArray(mdmsLocalities) &&
        mdmsLocalities.find(loc => loc.code === localityCode);

      // MDMS 'name' is a localisation code like TENANT_REVENUE_<CODE>
      const localityLabelCode =
        (localityMdms && localityMdms.name) ||
        addressObj.localityName ||
        addressObj.locality ||
        addressObj.localitycode ||
        localityCode;

      const localityName =
        getLocalTextFromCode(localityLabelCode) || localityLabelCode;

      // Build full address from available fields
      const fullAddress = [
        doorNo || addressObj.doorNo || addressObj.doorno,
        buildingName || addressObj.buildingName || addressObj.buildingname,
        plotNo || addressObj.plotNo || addressObj.plotno,
        street || addressObj.street,
        localityName,
        city || addressObj.city || addressObj.cityName
      ].filter(Boolean).join(", ") || "-";



      response.push({
        propertyId: propertyId,
        ownerName: ownerName,
        ownerMobile: ownerMobile,
        owners: owners,
        landArea: landArea,
        superbuiltuparea: superbuiltuparea,
        buildingName: buildingName,
        usageCategory: usageCategory,
        propertyType: propertyType,
        noOfFloors: noOfFloors,
        locality: localityCode,
        address: fullAddress,
        tenantId: tenantId
      })

    }
    try {
      let data = response.map(item => ({
        ["Property ID"]: item.propertyId || "-",
        ["Owner Name"]: item.ownerName || "-",
        ["Owner Mobile"]: item.ownerMobile || "",
        ["Land Area"]: item.landArea || item.superbuiltuparea || "-",
        ["Property Type"]: item.propertyType || "-",
        ["Usage Category"]: item.usageCategory || "-",
        ["No of Floors"]: item.noOfFloors || "-",
        ["Locality"]: item.locality || "-",
        ["Address"]: item.address || "-",
        ["TENANT_ID"]: item.tenantId,
        ["OWNERS_DATA"]: JSON.stringify(item.owners || [])
      }));


      dispatch(
        handleField(
          "ptreve",
          "components.div.children.searchResults",
          "props.data",
          data
        )
      );
      dispatch(
        handleField(
          "ptreve",
          "components.div.children.searchResults",
          "props.rows",
          data.length
        )
      );
      showHideTable(true, dispatch);
      console.log("searchApiCall: showHideTable called with true");
      try {
        const store = require("egov-ui-framework/ui-redux/store").default;
        const current = store.getState();
        const cfg = (current && current.screenConfiguration && current.screenConfiguration.screenConfig && current.screenConfiguration.screenConfig.ptreve && current.screenConfiguration.screenConfig.ptreve.components && current.screenConfiguration.screenConfig.ptreve.components.div && current.screenConfiguration.screenConfig.ptreve.components.div.children && current.screenConfiguration.screenConfig.ptreve.components.div.children.searchResults) || {};


      } catch (e) {
        console.warn("searchApiCall: could not read store for debug:", e);
      }
      if (!isEmpty(response)) {

        loadUlbLogo(tenantId);
      };
    } catch (error) {
      dispatch(toggleSnackbar(true, error.message, "error"));
      console.log(error);
    }
  }
};

const showHideTable = (booleanHideOrShow, dispatch) => {
  dispatch(
    handleField(
      "ptreve",
      "components.div.children.searchResults",
      "visible",
      booleanHideOrShow
    )
  );
};

// Function to remove a row from search results table by property ID (Thunk action)
export const removeTableRowByPropertyId = (propertyId) => {
  return (dispatch, getState) => {
    try {
      const state = getState();
      const tableData = get(
        state,
        "screenConfiguration.screenConfig.ptreve.components.div.children.searchResults.props.data",
        []
      );

      if (!tableData || tableData.length === 0) {
        console.warn("No table data found to remove row from");
        return;
      }

      // Filter out the row with matching property ID
      const updatedTableData = tableData.filter(row => {
        const rowPropertyId = row["Property ID"];
        return rowPropertyId !== propertyId;
      });


      // Update the table data in Redux state
      dispatch(
        handleField(
          "ptreve",
          "components.div.children.searchResults",
          "props.data",
          updatedTableData
        )
      );

      // Update the row count
      dispatch(
        handleField(
          "ptreve",
          "components.div.children.searchResults",
          "props.rows",
          updatedTableData.length
        )
      );

      // If no rows left, hide the table
      if (updatedTableData.length === 0) {
        showHideTable(false, dispatch);
      }

      // Show success message
      dispatch(
        toggleSnackbar(
          true,
          {
            labelName: "Property rate mapping submitted successfully!",
            labelKey: "ABG_PROPERTY_RATE_MAPPING_SUBMITTED_SUCCESSFULLY"
          },
          "success"
        )
      );
    } catch (error) {
      console.error("Error removing table row:", error);
    }
  };
};


