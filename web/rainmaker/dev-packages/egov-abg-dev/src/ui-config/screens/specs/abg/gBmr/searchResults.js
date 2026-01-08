import React from "react";
import get from "lodash/get";
import { sortByEpoch, getEpochForDate } from "../../utils";
import { generateSingleBill } from "../../utils/receiptPdf";
import { httpRequest } from "egov-ui-framework/ui-utils/api.js";
import { localStorageGet } from "egov-ui-kit/utils/localStorageUtils";
import { download, downloadBill } from "egov-common/ui-utils/commons";
import { updatesingleReading } from "./functions";


export const searchResults = {
  uiFramework: "custom-molecules",
  componentPath: "Table",
  visible: false,
  props: {
    columns: [
      { labelName: "Consumer ID", labelKey: "ABG_COMMON_TABLE_COL_CONSUMER_ID" },
      { labelName: "Consumer ID", labelKey: "ABG_COMMON_TABLE_COL_CONSUMER_ID" },
      { labelName: "Last Reading", labelKey: "Last Reading" },
      {
        labelName: "Current Reading(in KL)",
        labelKey: "ABG_COMMON_TABLE_COL_CURRENT_READING",
        options: {
          filter: false,
          customBodyRender: (value, tableMeta, updateValue) => {
            const lastReading = tableMeta.rowData && tableMeta.rowData[2];
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
        labelKey: "ABG_COMMON_TABLE_COL_CURRENT_READING_DATE",
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
      { labelName: "Bill Date", labelKey: "ABG_COMMON_TABLE_COL_BILL_DATE" },
      { labelName: "Status", labelKey: "ABG_COMMON_TABLE_COL_STATUS" },
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
          customBodyRender: (value, tableMeta, updateValue) => {
            const handleUpdate = async () => {
              const consumerId = tableMeta.rowData && tableMeta.rowData[0];
              const lastReading = Number(tableMeta.rowData && tableMeta.rowData[2]) || 0;
              const currentReadingRaw = tableMeta.rowData && tableMeta.rowData[3];
              const currentReading = Number(currentReadingRaw);
              const readingDate = tableMeta.rowData && tableMeta.rowData[4];
              const tenantId = tableMeta.rowData && tableMeta.rowData[7];

              if (!currentReadingRaw || !Number.isFinite(currentReading) || currentReading < lastReading) {
                alert("Please enter a numeric Current Reading greater than or equal to Last Reading before updating");
                return;
              }

              try {
                const resp = await updatesingleReading(consumerId, tenantId, currentReading, readingDate);
                // updatesingleReading may return response or throw on error
                alert("Update successful for Consumer ID: " + (consumerId || ""));
              } catch (err) {
                console.error(err);
                alert("Update failed: " + (err && err.message ? err.message : "Unknown error"));
              }
            };

            return (
              <button
                type="button"
                style={{ padding: "6px 12px", cursor: "pointer" }}
                onClick={handleUpdate}
              >
                Update
              </button>
            );
          }
        }
      },
    ],
    title: { labelName: "Search Results for Group Bills", labelKey: "BILL_GENIE_GROUP_SEARCH_HEADER" },
    rows: "",
    options: {
      filter: false,
      download: false,
      responsive: "stacked",
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

