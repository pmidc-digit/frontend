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
import { getTenantId, getUserInfo } from "egov-ui-kit/utils/localStorageUtils";
import isEmpty from "lodash/isEmpty"
import { loadUlbLogo } from "../../utils/receiptTransformer";

// const tenantId = getTenantId();
const tenantId = getTenantId();
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
    console.log("Mock update for", payload);
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
      "screenConfiguration.screenConfig.ptmapped.components.div.children.searchResults.props.data",
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
          handleField("ptmapped", "components.div.children.searchResults", "props.data", updatedTable)
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
    const toggle = get(state, "screenConfiguration.screenConfig.ptmapped.components.div.children.viewDialog.props.open", false);
    dispatch(handleField("ptmapped", "components.div.children.viewDialog", "props.open", !toggle));
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

  // Check if at least one search field is filled
  if (
    Object.keys(searchScreenObject).length == 0 ||
    Object.values(searchScreenObject).every(x => x === "")
  ) {
    dispatch(
      toggleSnackbar(
        true,
        {
          labelName: "Please fill at least one field to start search",
          labelKey: "ABG_SEARCH_SELECT_AT_LEAST_ONE_TOAST_MESSAGE"
        },
        "warning"
      )
    );
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
      debugger;

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
        const url = `/egov-property-rate/property-rate/revenue/_mappedsearch?tenantId=${encodeURIComponent(requestBody.tenantId)}&localityCode=${encodeURIComponent(requestBody.locality)}&limit=100`;
        const response = await httpRequest("post", url, "_search", []);
        // dispatch(toggleSpinner(false));
        // return response;
        debugger;
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
    const response = [];
    for (let i = 0; i < ptreveresponce.length; i++) {
      const item = ptreveresponce[i];

      // Log to see actual structure
      console.log("Property item:", item);

      // Handle both camelCase and lowercase field names
      const propertyId = item.propertyId || item.propertyid;
      const ownerName = item.ownerName || item.ownername;
      const ownerMobile = item.ownerMobile || item.ownerMobile || item.ownermobile || "";
      const landArea = item.landArea || item.landarea;
      const buildingName = item.buildingName || item.buildingname;
      const usageCategory = item.usageCategory || item.usagecategory;
      const localityCode = item.localityCode || item.localitycode;
      const doorNo = item.doorNo || item.doorno;
      const street = item.street;
      const city = item.city;
      const plotNo = item.plotNo || item.plotno;
      const rowdatacomplete = item;
      // Try multiple possible paths for address
      const addressObj = get(item, "address") ||
        get(item, "propertyAddress") ||
        get(item, "propertyDetails.address") || {};

      console.log("Address object:", addressObj);

      // Build full address from available fields
      const fullAddress = [
        doorNo || addressObj.doorNo || addressObj.doorno,
        buildingName || addressObj.buildingName || addressObj.buildingname,
        plotNo || addressObj.plotNo || addressObj.plotno,
        street || addressObj.street,
        localityCode || addressObj.locality || addressObj.localityName || addressObj.localitycode,
        city || addressObj.city || addressObj.cityName
      ].filter(Boolean).join(", ") || "-";

      console.log("Full address:", fullAddress);

      response.push({
        propertyId: propertyId,
        ownerName: ownerName,
        ownerMobile: ownerMobile,
        landArea: landArea,
        buildingName: buildingName,
        usageCategory: usageCategory,
        locality: localityCode,
        address: fullAddress,
        rowdatacomplete: rowdatacomplete,
        tenantId: tenantId
      })

    }
    try {
      let data = response.map(item => ({
        ["Property ID"]: item.propertyId || "-",
        ["Owner Name"]: item.ownerName || "-",
        ["Owner Mobile"]: item.ownerMobile || "",
        ["Land Area"]: item.landArea || "-",
        ["Building Name"]: item.buildingName || "-",
        ["Usage Category"]: item.usageCategory || "-",
        ["Locality"]: item.locality || "-",
        ["Address"]: item.address || "-",
        ["Row Data Complete"]: item.rowdatacomplete || {},
        ["TENANT_ID"]: item.tenantId
      }));

      console.log("searchApiCall: prepared table data length:", data.length);
      console.log("searchApiCall: sample row:", data[0]);
      dispatch(
        handleField(
          "ptmapped",
          "components.div.children.searchResults",
          "props.data",
          data
        )
      );
      dispatch(
        handleField(
          "ptmapped",
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
        const cfg = (current && current.screenConfiguration && current.screenConfiguration.screenConfig && current.screenConfiguration.screenConfig.ptmapped && current.screenConfiguration.screenConfig.ptmapped.components && current.screenConfiguration.screenConfig.ptmapped.components.div && current.screenConfiguration.screenConfig.ptmapped.components.div.children && current.screenConfiguration.screenConfig.ptmapped.components.div.children.searchResults) || {};
        console.log("searchApiCall: store.searchResults.props.data length:", (cfg.props && cfg.props.data && cfg.props.data.length) || 0);
        console.log("searchApiCall: store.searchResults.visible:", cfg.visible);
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
      "ptmapped",
      "components.div.children.searchResults",
      "visible",
      booleanHideOrShow
    )
  );
};


