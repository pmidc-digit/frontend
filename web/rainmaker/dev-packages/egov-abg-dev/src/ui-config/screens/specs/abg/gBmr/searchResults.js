import React from "react";
import get from "lodash/get";
import { sortByEpoch, getEpochForDate } from "../../utils";
import { generateSingleBill } from "../../utils/receiptPdf";
import { httpRequest } from "egov-ui-framework/ui-utils/api.js";
import { localStorageGet } from "egov-ui-kit/utils/localStorageUtils";
import { download, downloadBill } from "egov-common/ui-utils/commons";
import { updatesingleReading } from "./functions";
import { actions } from "egov-ui-framework/ui-redux/screen-configuration/actions";
import { store } from "egov-ui-framework/ui-redux/store";
import { Dialog } from "components";
import SurveyIdEditDialog from "./SurveyIdEditDialog";
const popdata = () => {

}


export const searchResults = {


  uiFramework: "custom-molecules",
  componentPath: "Table",
  visible: false,
  props: {
    data: [],
    columns: [
      { labelName: "Consumer ID", labelKey: "Consumer ID" },

      { labelName: "Last Reading", labelKey: "Last Reading" },
      {
        labelName: "Current Reading(in KL)",
        labelKey: "Current Reading(in KL)",
        options: {
          filter: false,
          customBodyRender: (value, tableMeta, updateValue) => {
            const lastReading = tableMeta.rowData && tableMeta.rowData[1];
            return (
              <input
                type="number"
                min={lastReading || 0}
                style={{ width: "120px", padding: "6px", boxSizing: "border-box" }}
                defaultValue={value || ""}
                onInput={e => {
                  e.target.value = e.target.value.replace(/[^0-9]/g, "");
                }}
                onBlur={e => {
                  const v = e.target.value.trim();
                  if (v === "") { updateValue(""); return; }
                  const numeric = Number(v);
                  const min = Number(lastReading || 0);
                  if (!Number.isFinite(numeric) || numeric < min) {
                    // reset and notify user
                    e.target.value = "";
                    updateValue("");
                    alert("Please enter a numeric value greater than or equal to Last Reading");
                  } else {
                    updateValue(v);
                  }
                }}
              />
            );
          }
        }
      },
      {
        labelName: "Current Reading Date",
        labelKey: "Current Reading Date",
        options: {
          filter: false,
          customBodyRender: (value, tableMeta, updateValue) => {
            const today = new Date().toISOString().split("T")[0];
            return (
              <input
                type="date"
                min={today}
                style={{ width: "160px", padding: "6px", boxSizing: "border-box" }}
                defaultValue={value || today}
                onChange={e => updateValue(e.target.value)}
              />
            );
          }
        }
      },
      { labelName: "Billing Period", labelKey: "Billing Period" },
      { labelName: "Status", labelKey: "Status" },
      {
        labelName: "Tenant Id",
        labelKey: "TENANT_ID",
        options: {
          display: false
        }
      },
      {
        labelName: "Action",
        labelKey: "ABG_COMMON_TABLE_COL_ACTION",
        options: {
          filter: false,
          customBodyRender: (value, tableMeta) => {
            const RowAction = () => {
              const [open, setOpen] = React.useState(false);

              const row = tableMeta.rowData || [];
              const propertiesId = row[0] || "";
              const oldSurveyId = row[5] || "";

              const handleOpen = () => setOpen(true);
              const handleClose = () => setOpen(false);

              return (
                <React.Fragment>
                  <button
                    type="button"
                    style={{
                      minWidth: "64px",
                      padding: "4px 12px",
                      background: "#FE7A51",
                      border: "none",
                      color: "#fff",
                      borderRadius: "2px",
                      cursor: "pointer"
                    }}
                    onClick={handleOpen}
                  >
                    View
                  </button>

                  <Dialog
                    open={open}
                    isClose={true}
                    handleClose={handleClose}
                    bodyStyle={{ padding: 0 }}
                    contentStyle={{ width: "420px", maxWidth: "95%" }}
                  >
                    <div style={{ padding: "16px 20px 0", fontSize: "18px", fontWeight: 600 }}>
                      Welcome
                    </div>
                    <SurveyIdEditDialog
                      propertiesId={propertiesId}
                      oldSurveyId={oldSurveyId}
                      onClose={handleClose}
                    />
                  </Dialog>
                </React.Fragment>
              );
            };

            return <RowAction />;
          }
        }
      },
    ],
    title: { labelName: "Search Results for Group Bills", labelKey: "BILL_GENIE_GROUP_SEARCH_HEADER" },
    rows: 0,
    options: {
      filter: false,
      download: false,
      responsive: "stacked",
      pagination: false,
      selectableRows: false,
      hover: true,
      rowsPerPageOptions: [10, 15, 20],
    },
    customSortColumn: {
      column: "Date Created",
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

