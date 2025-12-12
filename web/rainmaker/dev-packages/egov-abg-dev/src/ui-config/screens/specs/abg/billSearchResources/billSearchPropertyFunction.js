import { handleScreenConfigurationFieldChange as handleField, prepareFinalObject, toggleSnackbar } from "egov-ui-framework/ui-redux/screen-configuration/actions";
import { getTenantId } from "egov-ui-kit/utils/localStorageUtils";
import get from "lodash/get";
import { httpRequest } from "../../../../../ui-utils";
import { validateFields } from "../../utils";
import { convertEpochToDate } from "../../utils/index";

// Helper function to build RequestInfo
// const getRequestInfo = (state) => {
//   const authToken = get(state, "auth.userInfo.access_token", "");
//   return {
//     apiId: "Rainmaker",
//     ver: ".01",
//     action: "",
//     did: "1",
//     key: "",
//     msgId: "20170310130900|en_IN",
//     requesterId: "",
//     authToken: authToken
//   };
// };

// API call functions
const getPercentageCount = async (state, searchCriteria) => {
  const requestBody = {
    // RequestInfo: getRequestInfo(state),
    searchCriteria: {
      ...searchCriteria,
      url: "/egov-searcher/saski-property-search/saskitotalpercentagecount/_get"
    }
  };
  
  return await httpRequest(
    "post",
    "/egov-searcher/saski-property-search/saskitotalpercentagecount/_get",
    "",
    [],
    requestBody
  );
};

const getPropertySearch = async (state, searchCriteria) => {
  const requestBody = {
    // RequestInfo: getRequestInfo(state),
    searchCriteria: {
      ...searchCriteria,
      limit: 10,
      offset: 0,
      url: "/egov-searcher/saski-property-search/saskipropertysearch/_get"
    }
  };
  
  return await httpRequest(
    "post",
    "/egov-searcher/saski-property-search/saskipropertysearch/_get",
    "",
    [],
    requestBody
  );
};

const getPropertyCount = async (state, searchCriteria) => {
  const requestBody = {
    // RequestInfo: getRequestInfo(state),
    searchCriteria: {
      ...searchCriteria,
      limit: 1,
      offset: 0,
      url: "/egov-searcher/saski-property-search/saskipropertycount/_get"
    }
  };
  
  return await httpRequest(
    "post",
    "/egov-searcher/saski-property-search/saskipropertycount/_get",
    "",
    [],
    requestBody
  );
};


export const searchApiCall = async (state, dispatch) => {
  showHideTable(false, dispatch);
  
  let searchScreenObject = get(
    state.screenConfiguration.preparedFinalObject,
    "searchScreen",
    {}
  );

  // Validation
  const isSearchBoxFirstRowValid = validateFields(
    "components.div.children.billSearchCardProperty.children.cardContent.children.searchContainer.children",
    state,
    dispatch,
    "billSearch"
  );
  const isSearchBoxSecondRowValid = validateFields(
    "components.div.children.billSearchCardProperty.children.cardContent.children.searchContainer.children",
    state,
    dispatch,
    "billSearch"
  );
  if (!isSearchBoxFirstRowValid || !isSearchBoxSecondRowValid) {
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
    return;
  }
  
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
    return;
  }

  try {
    // Build search criteria
    const searchCriteria = {
      businesService: "PT",
      tenantId: searchScreenObject.tenantId || getTenantId()
    };

    // Add optional fields if they exist
    if (searchScreenObject.vasikaCode) {
      searchCriteria.vasikaNo = searchScreenObject.vasikaCode;
    }
    if (searchScreenObject.consumerCode) {
      searchCriteria.propertyId = searchScreenObject.consumerCode;
    }
    if (searchScreenObject.billNo) {
      searchCriteria.allotmentNo = searchScreenObject.billNo;
    }
    if (searchScreenObject.mobileNumber) {
      searchCriteria.mobileNumber = searchScreenObject.mobileNumber;
    }

    // Call all three APIs in parallel
    const [percentageResponse, propertyResponse, countResponse] = await Promise.all([
      getPercentageCount(state, searchCriteria),
      getPropertySearch(state, searchCriteria),
      getPropertyCount(state, searchCriteria)
    ]);

    // Extract data from responses
    const percentage = get(percentageResponse, "Property", "0");
    const properties = get(propertyResponse, "Property", []);
    const totalCount = get(countResponse, "Property", "0");

    // Store raw responses in Redux
    dispatch(prepareFinalObject("searchScreenMdmsData.percentageCount", percentage));
    dispatch(prepareFinalObject("searchScreenMdmsData.propertySearchResponse", properties));
    dispatch(prepareFinalObject("searchScreenMdmsData.totalCount", totalCount));

    // Transform data for table display
    const propertyTableData = properties.map(item => ({
      propertyId: get(item, "propertyId", "-"),
      tenantId: get(item, "tenantId", "-"),
      vasikaNo: get(item, "vasikaNo", "-"),
      vasikaDate: get(item, "vasikaDate") ? convertEpochToDate(new Date(get(item, "vasikaDate")).getTime()) : "-",
      allotmentNo: get(item, "allotmentNo", "-"),
      allotmentDate: get(item, "allotmentDate") ? convertEpochToDate(new Date(get(item, "allotmentDate")).getTime()) : "-",
      createdTime: get(item, "createdTime") ? convertEpochToDate(get(item, "createdTime")) : "-"
    }));

    // Prepare data for UI table
    let data = propertyTableData.map(item => ({
      ABG_PROPERTY_ID: item.propertyId,
      ABG_TENANT_ID: item.tenantId,
      ABG_VASIKA_NO: item.vasikaNo,
      ABG_VASIKA_DATE: item.vasikaDate,
      ABG_ALLOTMENT_NO: item.allotmentNo,
      ABG_ALLOTMENT_DATE: item.allotmentDate,
      ABG_CREATED_TIME: item.createdTime
    }));

    // Update table data
    dispatch(
      handleField(
        "billSearch",
        "components.div.children.searchResults",
        "props.data",
        data
      )
    );
    
    dispatch(
      handleField(
        "billSearch",
        "components.div.children.searchResults",
        "props.tableData",
        propertyTableData
      )
    );
    
    dispatch(
      handleField(
        "billSearch",
        "components.div.children.searchResults",
        "props.rows",
        propertyTableData.length
      )
    );

    // Show success message with statistics
    dispatch(
      toggleSnackbar(
        true,
        {
          labelName: `Found ${totalCount} properties. Percentage: ${percentage}%`,
          labelKey: "ABG_SEARCH_SUCCESS"
        },
        "success"
      )
    );

    showHideTable(true, dispatch);
    
  } catch (error) {
    dispatch(
      toggleSnackbar(
        true,
        {
          labelName: error.message || "Error fetching property data",
          labelKey: "ABG_SEARCH_ERROR"
        },
        "error"
      )
    );
    console.error("Search API Error:", error);
  }
};

const showHideTable = (booleanHideOrShow, dispatch) => {
  dispatch(
    handleField(
      "billSearch",
      "components.div.children.searchResults",
      "visible",
      booleanHideOrShow
    )
  );
};

const getActionItem = (status) => {
  switch (status) {
    case "ACTIVE": return "PAY";
    case "CANCELLED":
    case "EXPIRED": return "GENERATE NEW BILL";
    case "PAID": return "DOWNLOAD RECEIPT";
    case "PARTIALLY_PAID": return "PARTIALLY PAID";
    default: return "-";
  }
};
