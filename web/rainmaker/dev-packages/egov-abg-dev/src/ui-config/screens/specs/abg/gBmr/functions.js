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
export const updatesingleReading = async (consumerId, lastReading, currentReadingRaw, currentReading, billingPeriod, status, readingDate, lastReadingDate, tenantId, state = null, dispatch = null) => {

  const payload = {
    meterReadingslist: [
      {
        currentReadingDate: readingDate,
        currentReading: currentReading,
        billingPeriod: billingPeriod,
        meterStatus: status,
        connectionNo: consumerId,
        lastReading: lastReading,
        lastReadingDate: lastReadingDate,
        tenantId: tenantId,
        generateDemand: true,
        isBulkMeter: lastReading > 10000 ? true : false
      }
    ]
  };
  try {
    if (dispatch) {
      dispatch(toggleSpinner(true));
    }
    const url = "/ws-calculator/meterConnection/_createmultiple";

    const response = await httpRequest("post", url, "_update", [], payload);

    if (dispatch) {
      dispatch(toggleSpinner(false));
    }
    if (dispatch) {
      dispatch(
        toggleSnackbar(
          true,
          {
            labelName: "Bulk update successful",
            labelKey: "ABG_BULK_UPDATE_SUCCESS"
          },
          "success"
        )
      );
    }
    return response;
  } catch (e) {
    if (dispatch) {
      dispatch(toggleSpinner(false));
    }
    console.error("API error:", e);
    throw e;
  }
};

export const searchApiCall = async (state, dispatch) => {

  showHideTable(false, dispatch);
  //showHideMergeButton(false, dispatch);
  let searchScreenObject = get(
    state.screenConfiguration.preparedFinalObject,
    "searchCriteria",
    {}
  );
  const isSearchBoxFirstRowValid = validateFields(
    "components.div.children.abgSearchCard.children.cardContent.children.searchContainer.children",
    state,
    dispatch,
    "bulkmeterreading"
  );

  const isSearchBoxSecondRowValid = validateFields(
    "components.div.children.abgSearchCard.children.cardContent.children.searchContainer.children",
    state,
    dispatch,
    "bulkmeterreading"
  );

  if (!(isSearchBoxFirstRowValid && isSearchBoxSecondRowValid)) {
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
  }
  else if (
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
  }

  else {
    for (var key in searchScreenObject) {
      if (
        searchScreenObject.hasOwnProperty(key) &&
        searchScreenObject[key] === ""
      ) {
        delete searchScreenObject[key];
      }
    }
    let serviceObject = get(
      state.screenConfiguration.preparedFinalObject,
      "searchScreenMdmsData.BillingService.BusinessService"
    ).filter(item => item.code === searchScreenObject.businesService);

    searchScreenObject.url = serviceObject && serviceObject[0] && serviceObject[0].billGineiURL;
    searchScreenObject.tenantId = process.env.REACT_APP_NAME === "Employee" ? getTenantId() : JSON.parse(getUserInfo()).permanentCity;
    const getGroupBillSearch = async (dispatch, searchScreenObject) => {

      try {
        dispatch(toggleSpinner(true));
        const requestBody = {
          tenantId: getTenantId() || tenantId,
          locality: searchScreenObject.locality || "",
          offset: searchScreenObject.offset !== undefined ? searchScreenObject.offset : 0
        };
        const url = `ws-calculator/meterConnection/_searchV2?tenantId=${encodeURIComponent(requestBody.tenantId)}&locality=${encodeURIComponent(requestBody.locality)}&offset=${encodeURIComponent(requestBody.offset)}`;
        const response = await httpRequest("post", url, "_searchV2", []);
        // dispatch(toggleSpinner(false));
        // return response;

        const bills = (response && response.bulkMeterReadings) || [];
        dispatch(
          prepareFinalObject("searchScreenMdmsData.bulkMeterReadings", bills)
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


    const bills = (responseFromAPI && responseFromAPI.bulkMeterReadings) || [];
    dispatch(
      prepareFinalObject("searchScreenMdmsData.billSearchResponse", bills)
    );
    const response = [];
    for (let i = 0; i < bills.length; i++) {

      response.push({
        connectionNo: get(bills[i], "connectionNo"),

        lastReading: get(bills[i], "currentReading"),
        // currentReading may come from API (per consumer). Use existing field if present.
        currentReading: get(bills[i], "currentReading") || "",
        currentReadingDate: get(bills[i], "currentReadingDate"),
        billingPeriod: get(bills[i], "billingPeriod"),
        meterStatus: get(bills[i], "meterStatus"),
        usageCategory: get(bills[i], "usageCategory") || "",
        tenantId: tenantId
      })

    }
    try {
      let data = response.map(item => ({
        ["Consumer ID"]: item.connectionNo || "-",
        ["Usage Category"]: item.usageCategory || "-",
        // last confirmed reading from system
        ["Last Reading"]: item.currentReading || "-",

        // user will enter these for bulk update; keep empty initially
        ["New Reading(in KL)"]: "",
        ["New Reading Date"]: "",

        // existing reading date from system
        ["Last Reading Date"]:
          convertEpochToDate(item.currentReadingDate) || "-",
        ["Billing Period"]: item.billingPeriod || "-",
        ["Meter Status"]: item.meterStatus || "-",
        ["TENANT_ID"]: item.tenantId
      }));
      dispatch(
        handleField(
          "bulkmeterreading",
          "components.div.children.searchResults",
          "props.data",
          data
        )
      );
      dispatch(
        handleField(
          "bulkmeterreading",
          "components.div.children.searchResults",
          "props.rows",
          data.length
        )
      );
      showHideTable(true, dispatch);
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
      "bulkmeterreading",
      "components.div.children.searchResults",
      "visible",
      booleanHideOrShow
    )
  );
};


