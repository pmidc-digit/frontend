import get from "lodash/get";
import { getGroupBillSearch } from "../../../../../ui-utils/commons";
import {
  handleScreenConfigurationFieldChange as handleField,
  prepareFinalObject
} from "egov-ui-framework/ui-redux/screen-configuration/actions";
import {
  convertEpochToDate,
  validateFields,
  getTextToLocalMapping
} from "../../utils/index";
import { toggleSnackbar } from "egov-ui-framework/ui-redux/screen-configuration/actions";
import { getTenantId, getUserInfo } from "egov-ui-kit/utils/localStorageUtils";
import isEmpty from "lodash/isEmpty"
import { loadUlbLogo } from "../../utils/receiptTransformer";

// const tenantId = getTenantId();
const tenantId = getTenantId();
export const searchApiCall = async (state, dispatch) => {
  let bills;
  showHideTable(false, dispatch);
  showHideMergeButton(false, dispatch);
  let searchScreenObject = get(
    state.screenConfiguration.preparedFinalObject,
    "searchCriteria",
    {}
  );
  let batchtype = get(
    state.screenConfiguration.preparedFinalObject.generateBillScreen,
    "batchtype",
    {}
  );

  const isSearchBoxFirstRowValid = validateFields(
    "components.div.children.abgSearchCard.children.cardContent.children.searchContainer.children",
    state,
    dispatch,
    "groupBills"
  );

  const isSearchBoxSecondRowValid = validateFields(
    "components.div.children.abgSearchCard.children.cardContent.children.searchContainer.children",
    state,
    dispatch,
    "groupBills"
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
    let batchlocality = get(
      state.screenConfiguration.preparedFinalObject,
      "applyScreenMdmsData.tenant.batchs");
    let batchvalue = get(
      state.screenConfiguration.preparedFinalObject,
      "searchCriteria.locality");
    if (batchtype == 'Batch') {
      debugger;
      batchlocality = (batchlocality || []).find(item => item.code === batchvalue);
      const codes = batchlocality.children.map(item => item.code);
      searchScreenObject.locality = codes;
      if (searchScreenObject.businesService == 'WS') {
        searchScreenObject.url = "/egov-searcher/bill-genie/wsbatchbilling_summary/_get";
      } else {
        searchScreenObject.url = "/egov-searcher/bill-genie/swbatchbilling_summary/_get";
      }
    }
    else if (batchtype == 'Group') {
      searchScreenObject.url = searchScreenObject.businesService === 'SW' ? "/egov-searcher/bill-genie/groupbillssw_summary/_get" : "/egov-searcher/bill-genie/groupbills_summary/_get"
      //searchScreenObject.url = "/egov-searcher/bill-genie/groupbillssw/_get";
      //searchScreenObject.url = "/egov-searcher/bill-genie/groupbills_summary/_get";
    }else if(batchtype == 'Locality' ){
      searchScreenObject.url = searchScreenObject.businesService === 'WS' ? "/egov-searcher/bill-genie/waterbills_summary/_get" : "/egov-searcher/bill-genie/seweragebills_summary/_get"
    }else if (batchtype == 'Integrated Bill') {
      searchScreenObject.url = "/egov-searcher/bill-genie/integratedbills/_get";  //added Url for integratedbills
    }else {
      searchScreenObject.url = serviceObject && serviceObject[0] && serviceObject[0].billGineiURL;
    }

    //console.log("serviceObject",serviceObject)
    searchScreenObject.tenantId = process.env.REACT_APP_NAME === "Employee" ? getTenantId() : JSON.parse(getUserInfo()).permanentCity;
    const responseFromAPI = await getGroupBillSearch(dispatch, searchScreenObject);
    //integratedbills 
    let response = [];
    const uiConfigs = get(state.screenConfiguration.preparedFinalObject, "searchScreenMdmsData.common-masters.uiCommonPay");
    const configObject = uiConfigs.filter(item => item.code === searchScreenObject.businesService);
    if (batchtype == 'Integrated Bill') {
      bills = (responseFromAPI && responseFromAPI.Bills) || [];
      dispatch(
        prepareFinalObject("searchScreenMdmsData.billSearchResponse", bills)
      );
      for (let i = 0; i < bills.length; i++) {
        if (get(bills[i], "connection.propertyTotalAmount") > 0) {
          response.push({
            propertyID: get(bills[i], "propertyId"),
            waterconsumerId: get(bills[i], "connection.waterDetails[0].consumerCode"),
            waterbillDate: get(bills[i], "connection.waterDetails[0].billDate"),
            waterbillNo: get(bills[i], "connection.waterDetails[0].billNumber"),
            sewerageconsumerId: get(bills[i], "connection.sewerageDetails[0].consumerCode"),
            seweragebillNo: get(bills[i], "connection.sewerageDetails[0].billNumber"),
            totalAmount: get(bills[i], "connection.propertyTotalAmount"),
            tenantId: tenantId,
            mobileno: get(bills[i], "mobileNo")
          })
        }
      }
      try {
        let data = response.map(item => ({
          ["ABG_COMMON_TABLE_COL_PROPERTYID"]: item.propertyID || "-",
          ["ABG_COMMON_TABLE_COL_WATER_CONSUMER_ID"]: item.waterconsumerId || "-",
          ["ABG_COMMON_TABLE_COL_WATER_BILLNO"]: item.waterbillNo || "-",
          ["ABG_COMMON_TABLE_COL_SEWERAGE_CONSUMER_ID"]: item.sewerageconsumerId || "-",
          ["ABG_COMMON_TABLE_COL_SEWERAGE_BILLNO"]: item.seweragebillNo || "-",
          ["ABG_COMMON_TABLE_COL_TOTAL_AMOUNT"]: item.totalAmount || "-",
          ["TENANT_ID"]: item.tenantId,
          ["ABG_COMMON_TABLE_COL_BILL_DATE"]: convertEpochToDate(item.billDate) || "-",
          ["BUSINESS_SERVICE"]: item.businesService,
          ["BILL_SEARCH_URL"]: "",
          ["BILL_DATE"]: item.waterbillDate,
          ["BILL_KEY"]: "wsn-integrated",
        }));
        dispatch(
          handleField(
            "groupBills",
            "components.div.children.searchResultsIntergrated",
            "props.data",
            data
          )
        );
        dispatch(
          handleField(
            "groupBills",
            "components.div.children.searchResultsIntergrated",
            "props.rows",
            data.length
          )
        );
        //console.log("Hello Response Data",data)
        showHideIntegratedTable(true, dispatch);
         showHideTable(false, dispatch);
        if (!isEmpty(response)) {
          showHideMergeButton(true, dispatch);
          loadUlbLogo(tenantId);
        };
      } catch (error) {
        dispatch(toggleSnackbar(true, error.message, "error"));
        console.log(error);
      }


    } else {
      bills = (responseFromAPI && responseFromAPI.Bills) || [];
      dispatch(
        prepareFinalObject("searchScreenMdmsData.billSearchResponse", bills)
      );
      for (let i = 0; i < bills.length; i++) {
        // if(get(bills[i], "status") === "ACTIVE" &&  get(bills[i], "totalAmount")>0 && get(bills[i].connection,"status").toUpperCase() === "ACTIVE"){
        if (get(bills[i], "status") === "ACTIVE" && get(bills[i], "totalAmount") > 0) {
          response.push({
            consumerId: get(bills[i], "consumerCode"),
            billNo: get(bills[i], "billNumber"),
            ownerName: get(bills[i], "payerName"),
            billDate: get(bills[i], "billDate"),
            status: get(bills[i], "status"),
            tenantId: tenantId,
            businesService: serviceObject[0].code
          })
        }
        // }      
      }
      try {
        //console.log("Hello Response",response);
        let data = response.map(item => ({
          ["ABG_COMMON_TABLE_COL_BILL_NO"]: item.billNo || "-",
          ["ABG_COMMON_TABLE_COL_CONSUMER_ID"]: item.consumerId || "-",
          ["ABG_COMMON_TABLE_COL_OWN_NAME"]: item.ownerName || "-",
          ["ABG_COMMON_TABLE_COL_BILL_DATE"]:
            convertEpochToDate(item.billDate) || "-",
          ["ABG_COMMON_TABLE_COL_STATUS"]: item.status && getTextToLocalMapping(item.status.toUpperCase()) || "-",
          ["RECEIPT_KEY"]: get(configObject[0], "receiptKey"),
          ["BILL_KEY"]: get(configObject[0], "billKey"),
          ["TENANT_ID"]: item.tenantId,
          ["BUSINESS_SERVICE"]: item.businesService,
          ["BILL_SEARCH_URL"]: serviceObject[0].billGineiURL,
        }));

        dispatch(
          handleField(
            "groupBills",
            "components.div.children.searchResults",
            "props.data",
            data
          )
        );
        dispatch(
          handleField(
            "groupBills",
            "components.div.children.searchResults",
            "props.rows",
            data.length
          )
        );
        //console.log("Hello Response Data",data)
        showHideTable(true, dispatch);
         showHideIntegratedTable(false, dispatch);
        if (!isEmpty(response)) {
          showHideMergeButton(true, dispatch);
          loadUlbLogo(tenantId);
        };
      } catch (error) {
        dispatch(toggleSnackbar(true, error.message, "error"));
        console.log(error);
      }
    }
    //integratedbills


    //console.log("responseTest"+JSON.stringify(bills))

    //console.log("configObject", bills)
    // for (let i = 0; i < bills.length; i++) {
    //   // if(get(bills[i], "status") === "ACTIVE" &&  get(bills[i], "totalAmount")>0 && get(bills[i].connection,"status").toUpperCase() === "ACTIVE"){
    //   if (get(bills[i], "status") === "ACTIVE" && get(bills[i], "totalAmount") > 0) {
    //     response.push({
    //       consumerId: get(bills[i], "consumerCode"),
    //       billNo: get(bills[i], "billNumber"),
    //       ownerName: get(bills[i], "payerName"),
    //       billDate: get(bills[i], "billDate"),
    //       status: get(bills[i], "status"),
    //       tenantId: tenantId,
    //       businesService: serviceObject[0].code
    //     })
    //   }
    //   // }      
    // }
    // try {
    //   //console.log("Hello Response",response);
    //   let data = response.map(item => ({
    //     ["ABG_COMMON_TABLE_COL_BILL_NO"]: item.billNo || "-",
    //     ["ABG_COMMON_TABLE_COL_CONSUMER_ID"]: item.consumerId || "-",
    //     ["ABG_COMMON_TABLE_COL_OWN_NAME"]: item.ownerName || "-",
    //     ["ABG_COMMON_TABLE_COL_BILL_DATE"]:
    //       convertEpochToDate(item.billDate) || "-",
    //     ["ABG_COMMON_TABLE_COL_STATUS"]: item.status && getTextToLocalMapping(item.status.toUpperCase()) || "-",
    //     ["RECEIPT_KEY"]: get(configObject[0], "receiptKey"),
    //     ["BILL_KEY"]: get(configObject[0], "billKey"),
    //     ["TENANT_ID"]: item.tenantId,
    //     ["BUSINESS_SERVICE"]: item.businesService,
    //     ["BILL_SEARCH_URL"]: serviceObject[0].billGineiURL,
    //   }));

    //   dispatch(
    //     handleField(
    //       "groupBills",
    //       "components.div.children.searchResults",
    //       "props.data",
    //       data
    //     )
    //   );
    //   dispatch(
    //     handleField(
    //       "groupBills",
    //       "components.div.children.searchResults",
    //       "props.rows",
    //       data.length
    //     )
    //   );
    //   //console.log("Hello Response Data",data)
    //   showHideTable(true, dispatch);
    //   if (!isEmpty(response)) {
    //     showHideMergeButton(true, dispatch);
    //     loadUlbLogo(tenantId);
    //   };
    // } catch (error) {
    //   dispatch(toggleSnackbar(true, error.message, "error"));
    //   console.log(error);
    // }
  }
};

const showHideTable = (booleanHideOrShow, dispatch) => {
  dispatch(
    handleField(
      "groupBills",
      "components.div.children.searchResults",
      "visible",
      booleanHideOrShow
    )
  );
};
const showHideIntegratedTable = (booleanHideOrShow, dispatch) => {
  dispatch(
    handleField(
      "groupBills",
      "components.div.children.searchResultsIntergrated",
      "visible",
      booleanHideOrShow
    )
  );
};

const showHideMergeButton = (booleanHideOrShow, dispatch) => {
  dispatch(
    handleField(
      "groupBills",
      "components.div.children.mergeDownloadButton.children.mergeButton",
      "visible",
      booleanHideOrShow
    )
  );
};



