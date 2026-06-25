import React from "react";
import { getLocaleLabels } from "egov-ui-framework/ui-utils/commons";
import { searchApiCall } from "./billSearchPropertyFunction";
import store from "egov-ui-framework/ui-redux/store";

export const billSearchpropertyResult = {
  uiFramework: "custom-molecules",
  componentPath: "Table",
  visible: false,
  props: {
    columns: [
      {
        labelName: "Property ID",
        labelKey: "ABG_PROPERTY_ID",
        options: {
          customBodyRender: (value, tableMeta) => {
            const propertyId = tableMeta.rowData[0]; // ABG_PROPERTY_ID
            const tenantId = tableMeta.rowData[1]; // ABG_TENANT_ID (hidden column)
            const targetUrl = `/employee/property-tax/property/${propertyId}/${tenantId}`;
            return (
              <a
                href={targetUrl}
                style={{ color: "#2947a3", cursor: "pointer", textDecoration: "underline" }}
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = `${window.location.origin}${targetUrl}`;
                }}
              >
                {value}
              </a>
            );
          }
        }
      },
      {
        labelName: "Tenant ID",
        labelKey: "ABG_TENANT_ID",
        options: {
          display: false,
          viewColumns: false,
          filter: false
        }
      },
      {
        labelName: "Vasika No",
        labelKey: "ABG_VASIKA_NO"
      },
      {
        labelName: "Vasika Date",
        labelKey: "ABG_VASIKA_DATE"
      },
      {
        labelName: "Allotment No",
        labelKey: "ABG_ALLOTMENT_NO"
      },
      {
        labelName: "Allotment Date",
        labelKey: "ABG_ALLOTMENT_DATE",
        options: {
          display: false,
          viewColumns: false,
          filter: false
        }
      },
      {
        labelName: "Obpass Applicant Name",
        labelKey: "ABG_OBPASS_APPLICANT_NAME"
      },
      {
        labelName: "Obpass File No",
        labelKey: "ABG_OBPASS_FILE_NO"
      },
      {
        labelName: "Action",
        labelKey: "ABG_ACTION",
        options: {
          customBodyRender: (value, tableMeta) => {
            return (
              <button
                style={{
                  color: "#fff",
                  backgroundColor: "#2947a3",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                  fontSize: "14px"
                }}
                onClick={() => {
                  window.open("https://jamabandi.punjab.gov.in/RegistryDeed.aspx?itemPID=21", "_blank");
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = "#E86942";
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "#2947a3";
                }}
              >
                View Details
              </button>
            );
          }
        }
      }
    ],
    title: {
      labelName: "Property Search Results",
      labelKey: "ABG_PROPERTY_SEARCH_RESULTS_TABLE_HEADING"
    },
    data: [],
    rows: 0,
    options: {
      filter: false,
      download: true,
      print: false,
      responsive: "stacked",
      selectableRows: false,
      hover: true,
      rowsPerPageOptions: [10, 15, 20],
      serverSide: true,
      count: 0,
      page: 0,
      rowsPerPage: 10,
      onTableChange: (action, tableState) => {
        
        if (action === "changePage" || action === "changeRowsPerPage") {
          const state = store.getState();
          const dispatch = store.dispatch;
          const limit = tableState.rowsPerPage;
          const offset = tableState.page * tableState.rowsPerPage;
          
          // Call search API with new pagination parameters
          searchApiCall(state, dispatch, limit, offset);
        }
      }
    }
  }
};
