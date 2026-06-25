import React from "react";
import { getLocaleLabels } from "egov-ui-framework/ui-utils/commons";
import store from "egov-ui-framework/ui-redux/store";
import {getPDFFile} from "./function"


export const billSearchResult = {
  uiFramework: "custom-molecules",
  componentPath: "Table",
  visible: true,
  props: {
    columns: [
      {
        labelName: "JobID",
        labelKey: "ABG_JOB_ID",
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
        labelName: "Filestore ID",
        labelKey: "ABG_FILESTORE_ID",
        options: {
          display: false,
          viewColumns: false,
          filter: false
        }
      },
      {
        labelName: "Total Records",
        labelKey: "ABG_TOTAL_RECORDS"
      },
      {
        labelName: "Records Completed",
        labelKey: "ABG_RECORDS_COMPLETED"
      },
      {
        labelName: "Locality",
        labelKey: "ABG_LOCALITY_NAME"
      },
      {
        labelName: "Business Service",
        labelKey: "ABG_BUSINESS_SERVICE"
      },
      {
        labelName: "Action",
        labelKey: "ABG_ACTION",
        options: {
          customBodyRender: (value, tableMeta, updateValue)=>{
            var rowData = tableMeta.rowData;
            var tenantId = rowData[1];    // Tenant ID
            var filestoreId = rowData[2];
            return (
              <button
                type="button"
                style={{
                  color: "#fff",
                  backgroundColor: "#2947a3",
                  border: "none",
                  padding: "6px 14px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                  fontSize: "13px"
                }}
                onClick={()=>getPDFFile(tenantId,filestoreId)}
              >
                Download
              </button>
            );
          }
        }

      }
    ],
    title: { labelName: "Search Results for Group Bills", labelKey: "BILL_GENIE_GROUP_SEARCH_HEADER" },
    rows: "",
    options: {
      filter: false,
      download: true,
      print: false,
      responsive: "stacked",
      selectableRows: false,
      hover: true,
      rowsPerPageOptions: [10, 15, 20],
      serverSide: false,   
      count: 0,
      page: 0,
      rowsPerPage: 10,
    }
  }
};



