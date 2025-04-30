import React from "react";
import { sortByEpoch, getEpochForDate } from "../../utils";
import './index.css'
import LabelContainer from "egov-ui-framework/ui-containers/LabelContainer";
import { getQueryArg, getStatusKey } from "egov-ui-framework/ui-utils/commons";
import { setRoute } from "egov-ui-framework/ui-redux/app/actions";
import store from "ui-redux/store";
import get from "lodash/get";

export const getQueryRedirectUrl = () => {
  let url = getQueryArg(window.location.href, "redirectUrl");
  url = '/wns/apply?propertyId=PT-1012-2180005&tenantId=pb.testing'
  const isMode = getQueryArg(window.location.href, "mode");
  if (isMode === "MODIFY") {
    const connectionNumber = getQueryArg(window.location.href, "connectionNumber");
    const tenantId = getQueryArg(window.location.href, "tenantId");
    const action = getQueryArg(window.location.href, "action");
    const modeaction = getQueryArg(window.location.href, "modeaction");
    let returnUrl = `${url}&connectionNumber=${connectionNumber}&tenantId=${tenantId}&action=${action}&mode=${isMode}`;
    returnUrl = modeaction ? returnUrl + '&modeaction=' + modeaction : returnUrl;
    return returnUrl;
  } else {
    //url = url.includes('?') ? url : url + '?';

    url = 'apply'
    let applicationNo = getQueryArg(window.location.href, "applicationNumber");
    const connectionNo = getQueryArg(window.location.href, "connectionNumber");
    const actionType = getQueryArg(window.location.href, "action");
    url = applicationNo && !url.includes('applicationNumber') ? url + `&applicationNumber=${applicationNo}` : url;
    url = connectionNo && !url.includes('connectionNumber') ? url + `&connectionNumber=${connectionNo}` : url;
    url = actionType && !url.includes('action') ? url + `&action=${actionType}` : url;
    return url;
  }



};

export const searchResults = {
  uiFramework: "custom-molecules",
  moduleName: "egov-wns",
  componentPath: "Table",
  visible: false,
  props: {
    columns: [
      {
        name: "Service",
        labelKey: "WS_COMMON_TABLE_COL_SERVICE_LABEL",
        options: {
          filter: false,
          customBodyRender: value => (
            <span style={{ color: '#000000' }}>
              {value}
            </span>
          )
        }
      },
      {
        name: "Consumer No",
        labelKey: "WS_COMMON_TABLE_COL_CONSUMER_NO_LABEL",
        options: {
          filter: false,
          customBodyRender: (value, index) => (
            <div className="linkStyle" onClick={() => getConnectionDetails(index)}>
              <a>{value}</a>
            </div>
          )
        }
      },
      { name: "Owner Name", labelKey: "WS_COMMON_TABLE_COL_OWN_NAME_LABEL" },
      { name: "Mobile Number", labelKey: "WS_HOME_SEARCH_RESULTS_OWN_MOB_LABEL" },
      { name: "Status", labelKey: "WS_COMMON_TABLE_COL_STATUS_LABEL" },
      { name: "Due", labelKey: "WS_COMMON_TABLE_COL_DUE_LABEL" },
      { name: "Address", labelKey: "WS_COMMON_TABLE_COL_ADDRESS" },
      { name: "Due Date", labelKey: "WS_COMMON_TABLE_COL_DUE_DATE_LABEL" },
      {
        name: "Action",
        labelKey: "WS_COMMON_TABLE_COL_ACTION_LABEL",
        options: {
          filter: false,
          customBodyRender: (value, data) => {
            debugger;

            if (data.rowData[5] !== undefined && typeof data.rowData[5] === 'number' && data.rowData[5] >= 0) {

              return (
                <div className="linkStyle" onClick={() => getViewBillDetails(data)} style={{ color: '#fe7a51', textTransform: 'uppercase' }}>
                  <LabelContainer
                    labelKey="WS_COMMON_COLLECT_LABEL"
                    style={{
                      color: "#fe7a51",
                      fontSize: 14,
                    }}
                  />
                </div>
              )
            }
            else {
              return ("NA")
            }
          }
        }
      },
      {
        name: "tenantId",
        labelKey: "WS_COMMON_TABLE_COL_TENANTID_LABEL",
        options: {
          display: false
        }
      },
      {
        name: "connectionType",
        labelKey: "WS_COMMON_TABLE_COL_CONNECTIONTYPE_LABEL",
        options: {
          display: false
        }
      },
      {
        name: "isLeagcy",
        labelKey: "WS_COMMON_TABLE_COL_IS_LEGACY",
        options: {
          display: false
        }
      }

    ],
    title: { labelKey: "WS_HOME_SEARCH_RESULTS_TABLE_HEADING", labelName: "Search Results for Water & Sewerage Connections" },
    options: {
      filter: false,
      download: false,
      responsive: "stacked",
      selectableRows: false,
      hover: true,
      rowsPerPageOptions: [10, 15, 20]
    },
    customSortColumn: {
      column: "Application Date",
      sortingFn: (data, i, sortDateOrder) => {
        const epochDates = data.reduce((acc, curr) => {
          acc.push([...curr, getEpochForDate(curr[4], "dayend")]);
          return acc;
        }, []);
        const order = sortDateOrder === "asc" ? true : false;
        const finalData = sortByEpoch(epochDates, !order).map(item => {
          item.pop();
          return item;
        });
        return { data: finalData, currentOrder: !order ? "asc" : "desc" };
      }
    }
  }
};

const getConnectionDetails = data => {
  debugger;
  let legacy
  if (data.rowData[11] === true) {
    legacy = true
  } else {
    legacy = false
  }
  store.dispatch(
    setRoute(`connection-details?connectionNumber=${data.rowData[1]}&tenantId=${data.rowData[9]}&service=${data.rowData[0]}&connectionType=${data.rowData[10]}&due=${data.rowData[5]}&legacy=${legacy}`)
  )
}

const getViewBillDetails = data => {
  store.dispatch(
    setRoute(`viewBill?connectionNumber=${data.rowData[1]}&tenantId=${data.rowData[9]}&service=${data.rowData[0]}&connectionType=${data.rowData[10]}`)
  )
}