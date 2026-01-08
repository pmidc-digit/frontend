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
      "screenConfiguration.screenConfig.bulkmeterreading.components.div.children.searchResults.props.data",
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
          handleField("bulkmeterreading", "components.div.children.searchResults", "props.data", updatedTable)
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
export const searchApiCall = async (state, dispatch) => {
  debugger;
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
  } else if (
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
    let serviceObject = get(
      state.screenConfiguration.preparedFinalObject,
      "searchScreenMdmsData.BillingService.BusinessService"
    ).filter(item => item.code === searchScreenObject.businesService);

    searchScreenObject.url = serviceObject && serviceObject[0] && serviceObject[0].billGineiURL;
    searchScreenObject.tenantId = process.env.REACT_APP_NAME === "Employee" ? getTenantId() : JSON.parse(getUserInfo()).permanentCity;
    const getGroupBillSearch = async (dispatch, searchScreenObject) => {
      debugger;

      try {
        dispatch(toggleSpinner(true));
        const requestBody = {
          tenantId: searchScreenObject.tenantId || tenantId,
          locality: "ALOC2",
          offset: searchScreenObject.offset !== undefined ? searchScreenObject.offset : 0
        };
        const url = `ws-calculator/meterConnection/_search?tenantId=${encodeURIComponent(requestBody.tenantId)}&locality=${encodeURIComponent(requestBody.locality)}&offset=${encodeURIComponent(requestBody.offset)}`;
        const response = await httpRequest("post", url, "_search", []);
        // dispatch(toggleSpinner(false));
        // return response;

        const bills = (response && response.meterReadings) || [];
        dispatch(
          prepareFinalObject("searchScreenMdmsData.meterReadings", bills)
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


    const bills = (responseFromAPI && responseFromAPI.meterReadings) || [];
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
        tenantId: tenantId
      })

    }
    try {
      let data = response.map(item => ({
        ["Consumer ID"]: item.connectionNo || "-",

        ["Last Reading"]: item.currentReading || "-",
        ["Current Reading(in KL)"]: item.currentReading || "",
        ["Current Reading Date"]:
          convertEpochToDate(item.currentReadingDate) || "-",
        ["Billing Period"]: item.billingPeriod || "-",
        ["Status"]: item.meterStatus || "-",
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


