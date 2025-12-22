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

const getPropertySearch = async (state, searchCriteria, limit = 10, offset = 0) => {
  const requestBody = {
    // RequestInfo: getRequestInfo(state),
    searchCriteria: {
      ...searchCriteria,
      limit: limit,
      offset: offset,
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
const getPropertySearchWithVasika = async (state, searchCriteria) => {
  const requestBody = {
    // RequestInfo: getRequestInfo(state),
    searchCriteria: {
      ...searchCriteria,
      url: "/egov-searcher/saski-property-search/saskipropertyvasikacount/_get"
    }
  };
  
  return await httpRequest(
    "post",
    "/egov-searcher/saski-property-search/saskipropertyvasikacount/_get",
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


export const searchApiCall = async (state, dispatch, limit = 10, offset = 0) => {
  // Hide table and statistics while loading
  showHideTable(false, dispatch);
  showHideStatistics(false, dispatch);
  
  let searchScreenObject = get(
    state.screenConfiguration.preparedFinalObject,
    "searchScreen",
    {}
  );

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
    const [percentageResponse, propertyResponse, countResponse, propertyWithVasikaResponse] = await Promise.all([
      getPercentageCount(state, searchCriteria),
      getPropertySearch(state, searchCriteria, limit, offset),
      getPropertyCount(state, searchCriteria),
      getPropertySearchWithVasika(state, searchCriteria)
    ]);

    // Extract data from responses
    const percentage = get(percentageResponse, "Property", "0");
    const properties = get(propertyResponse, "Property", []);
    const totalCount = get(countResponse, "Property", "0");           
    const totalCountwithVasika = get(propertyWithVasikaResponse, "Property", "0");           

    // Store raw responses in Redux
    dispatch(prepareFinalObject("searchScreenMdmsData.percentageCount", percentage));
    dispatch(prepareFinalObject("searchScreenMdmsData.propertySearchResponse", properties));
    dispatch(prepareFinalObject("searchScreenMdmsData.totalCount", totalCount));
    dispatch(prepareFinalObject("searchScreenMdmsData.totalCountwithVasika", totalCountwithVasika));

    // Get ULB name from tenantId or use a default
    const tenantId = searchCriteria.tenantId || "N/A";
    const ulbName = tenantId.includes('.') 
      ? tenantId.split('.')[1].charAt(0).toUpperCase() + tenantId.split('.')[1].slice(1)
      : tenantId;

    // Update ULB Name
    dispatch(
      handleField(
        "billSearchproperty",
        "components.div.children.searchStatistics.children.ulbNameContainer.children.ulbNameText.props",
        "dangerouslySetInnerHTML",
        { __html: `ULB Name: <strong>${ulbName}</strong>` }
      )
    );

    // Update Box 1 - Total Properties in ULB
    dispatch(
      handleField(
        "billSearchproperty",
        "components.div.children.searchStatistics.children.statisticsBoxes.children.box1.children.box1Value.props",
        "dangerouslySetInnerHTML",
        { __html: totalCount }
      )
    );

    // Update Box 2 - Total Properties Registered with Vasika (for now showing total count)
    dispatch(
      handleField(
        "billSearchproperty",
        "components.div.children.searchStatistics.children.statisticsBoxes.children.box2.children.box2Value.props",
        "dangerouslySetInnerHTML",
        { __html: totalCountwithVasika }
      )
    );

    // Update Box 3 - Total Percentage
    dispatch(
      handleField(
        "billSearchproperty",
        "components.div.children.searchStatistics.children.statisticsBoxes.children.box3.children.box3Value.props",
        "dangerouslySetInnerHTML",
        { __html: `${percentage}%` }
      )
    );

    // Transform data for table display
    const propertyTableData = properties.map(item => ({
      propertyId: get(item, "propertyId", "-"),
      tenantId: get(item, "tenantId", "-"),
      vasikaNo: get(item, "vasikaNo", "-"),
      vasikaDate: get(item, "vasikaDate") ? convertEpochToDate(new Date(get(item, "vasikaDate")).getTime()) : "-",
      allotmentNo: get(item, "allotmentNo", "-"),
      obpassApplicantName: get(item, "obpassApplicantName", "-"),
      obpassFileNo: get(item, "obpassFileNo", "-"),
      allotmentDate: get(item, "allotmentDate") ? convertEpochToDate(new Date(get(item, "allotmentDate")).getTime()) : "-"
    }));

    // Prepare data for UI table - using object format
    let data = propertyTableData.map(item => ({
      [get(state, "screenConfiguration.screenConfig.billSearchproperty.components.div.children.billSearchpropertyResult.props.columns[0].labelKey", "ABG_PROPERTY_ID")]: item.propertyId,
      [get(state, "screenConfiguration.screenConfig.billSearchproperty.components.div.children.billSearchpropertyResult.props.columns[1].labelKey", "ABG_TENANT_ID")]: item.tenantId,
      [get(state, "screenConfiguration.screenConfig.billSearchproperty.components.div.children.billSearchpropertyResult.props.columns[2].labelKey", "ABG_VASIKA_NO")]: item.vasikaNo,
      [get(state, "screenConfiguration.screenConfig.billSearchproperty.components.div.children.billSearchpropertyResult.props.columns[3].labelKey", "ABG_VASIKA_DATE")]: item.vasikaDate,
      [get(state, "screenConfiguration.screenConfig.billSearchproperty.components.div.children.billSearchpropertyResult.props.columns[4].labelKey", "ABG_ALLOTMENT_NO")]: item.allotmentNo,
      [get(state, "screenConfiguration.screenConfig.billSearchproperty.components.div.children.billSearchpropertyResult.props.columns[5].labelKey", "ABG_ALLOTMENT_DATE")]: item.allotmentDate,
      [get(state, "screenConfiguration.screenConfig.billSearchproperty.components.div.children.billSearchpropertyResult.props.columns[6].labelKey", "ABG_OBPASS_APPLICANT_NAME")]: item.obpassApplicantName,
      [get(state, "screenConfiguration.screenConfig.billSearchproperty.components.div.children.billSearchpropertyResult.props.columns[7].labelKey", "ABG_OBPASS_FILE_NO")]: item.obpassFileNo,
      [get(state, "screenConfiguration.screenConfig.billSearchproperty.components.div.children.billSearchpropertyResult.props.columns[8].labelKey", "ABG_ACTION")]: ""
    }));
    // Calculate current page
    const currentPage = Math.floor(offset / limit);

    // Store data in prepareFinalObject first
    dispatch(prepareFinalObject("searchScreenMdmsData.billSearchPropertyTableData", data));

    // Get the original columns configuration
    const originalColumns = get(state, "screenConfiguration.screenConfig.billSearchproperty.components.div.children.billSearchpropertyResult.props.columns", []);

    // Update the entire table component at once with all props
    dispatch(
      handleField(
        "billSearchproperty",
        "components.div.children.billSearchpropertyResult",
        "props",
        {
          data: data,
          columns: originalColumns,
          rows: parseInt(totalCountwithVasika) || 0,
          title: {
            labelName: "Property Search Results",
            labelKey: "ABG_PROPERTY_SEARCH_RESULTS_TABLE_HEADING",
            value: null  // Set to null instead of removing
          },
          options: {
            filter: false,
            download: true,
            print: false,
            responsive: "stacked",
            selectableRows: false,
            hover: true,
            rowsPerPageOptions: [10, 15, 20],
            serverSide: true,
            count: parseInt(totalCountwithVasika) || 0,
            page: currentPage,
            rowsPerPage: limit,
            onTableChange: (action, tableState) => {
              
              if (action === "changePage" || action === "changeRowsPerPage") {
                const newLimit = tableState.rowsPerPage;
                const newOffset = tableState.page * newLimit;
                searchApiCall(state, dispatch, newLimit, newOffset);
              }
            }
          }
        }
      )
    );

    // Show success message
    dispatch(
      toggleSnackbar(
        true,
        {
          labelName: `Found ${totalCountwithVasika} properties. Showing page ${currentPage + 1}`,
          labelKey: "ABG_SEARCH_SUCCESS"
        },
        "success"
      )
    );

    // Show table and statistics
    showHideTable(true, dispatch);
    showHideStatistics(true, dispatch);
    
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
      "billSearchproperty",
      "components.div.children.billSearchpropertyResult",
      "visible",
      booleanHideOrShow
    )
  );
};

const showHideStatistics = (booleanHideOrShow, dispatch) => {
  dispatch(
    handleField(
      "billSearchproperty",
      "components.div.children.searchStatistics",
      "visible",
      booleanHideOrShow
    )
  );
};

// const getActionItem = (status) => {
//   switch (status) {
//     case "ACTIVE": return "PAY";
//     case "CANCELLED":
//     case "EXPIRED": return "GENERATE NEW BILL";
//     case "PAID": return "DOWNLOAD RECEIPT";
//     case "PARTIALLY_PAID": return "PARTIALLY PAID";
//     default: return "-";
//   }
// };
