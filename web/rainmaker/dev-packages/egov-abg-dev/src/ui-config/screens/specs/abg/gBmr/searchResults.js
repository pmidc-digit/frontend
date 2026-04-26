import React from "react";
import get from "lodash/get";
import { sortByEpoch, getEpochForDate } from "../../utils";
import { generateSingleBill } from "../../utils/receiptPdf";
import { httpRequest } from "egov-ui-framework/ui-utils/api";
import { localStorageGet } from "egov-ui-kit/utils/localStorageUtils";
import { download, downloadBill } from "egov-common/ui-utils/commons";
import { toggleSpinner, toggleSnackbar } from "egov-ui-framework/ui-redux/screen-configuration/actions";
import { updatesingleReading } from "./functions";


export const searchResults = {
  uiFramework: "custom-molecules",
  componentPath: "Table",
  visible: false,
  props: {
    columns: [
      { labelName: "Consumer ID", labelKey: "Consumer ID" },
      { labelName: "Usage Category", labelKey: "Usage Category" },
      { labelName: "Last Reading", labelKey: "Last Reading" },
      { labelName: "Current Reading Date", labelKey: "Current Reading Date" },
      {
        labelName: "New Reading(in KL)",
        labelKey: "New Reading(in KL)",
        options: {
          filter: false,
          customBodyRender: (value, tableMeta, updateValue) => {
            // Last Reading is at index 2, Status is at index 7
            const lastReading = tableMeta.rowData && tableMeta.rowData[2];
            const status = tableMeta.rowData && tableMeta.rowData[7];
            const isEditable = ["Working", "Breakdown", "Locked"].includes(status);
            return (
              <input
                type="number"
                min={lastReading || 0}
                className="bulk-new-reading"
                style={{ width: "120px", padding: "6px", boxSizing: "border-box" }}
                disabled={!isEditable}
                // defaultValue={value || ""}
                onInput={e => {
                  e.target.value = e.target.value.replace(/[^0-9]/g, "");
                }}
                onBlur={e => {
                  if (!isEditable) return;
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
        labelName: "New Reading Date",
        labelKey: "New Reading Date",
        options: {
          filter: false,
          customBodyRender: (value, tableMeta, updateValue) => {
            // Disable dates earlier than Current Reading Date for that row
            const currentReadingDateDisplay =
              tableMeta.rowData && tableMeta.rowData[3]; // Current Reading Date at index 3
            const status = tableMeta.rowData && tableMeta.rowData[7];
            const isEditable = ["Working", "Breakdown", "Locked"].includes(status);

            let minDate = "";
            if (
              currentReadingDateDisplay &&
              currentReadingDateDisplay !== "-" &&
              currentReadingDateDisplay.indexOf("/") > -1
            ) {
              const [dd, mm, yyyy] = currentReadingDateDisplay.split("/");
              if (dd && mm && yyyy) {
                minDate = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
              }
            }
            return (
              <input
                type="date"
                min={minDate || undefined}
                className="bulk-new-reading-date"
                style={{ width: "160px", padding: "6px", boxSizing: "border-box" }}
                disabled={!isEditable}
                // defaultValue={value || today}
                onChange={e => {
                  if (!isEditable) return;
                  updateValue(e.target.value);
                }}
              />
            );
          }
        }
      },

      { labelName: "Billing Period", labelKey: "Billing Period" },
      {
        labelName: "Status",
        labelKey: "Status",
        options: {
          filter: false,
          customBodyRender: (value, tableMeta, updateValue) => {
            const statusOptions = [
              "Working",
              "Locked",
              "No-meter",
              "Breakdown",
              "No_Meter",
              "Reset",
              "NULL",
              "Replacement"
            ];
            const currentStatus = value || "";
            return (
              <select
                className="bulk-status-select"
                style={{ width: "140px", padding: "6px", boxSizing: "border-box" }}
                value={currentStatus}
                onChange={e => {
                  updateValue(e.target.value);
                }}
              >
                <option value="">Select status</option>
                {statusOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            );
          }
        }
      },
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
            let readingDatenew = tableMeta.rowData && tableMeta.rowData[5] ? tableMeta.rowData[5] : null;
            readingDatenew = readingDatenew ? readingDatenew.split("-").reverse().join("/") : null;
            const handleUpdate = async () => {
              debugger;
              const consumerId = tableMeta.rowData && tableMeta.rowData[0];
              const lastReading = Number(tableMeta.rowData && tableMeta.rowData[2]) || 0;
              const currentReadingDate = tableMeta.rowData && tableMeta.rowData[3] ? getEpochForDate(tableMeta.rowData[3]) : null;
              const lastReadingDate = currentReadingDate;
              const currentReadingRaw = Number(tableMeta.rowData && tableMeta.rowData[4]) || 0;
              const currentReading = Number(currentReadingRaw) || 0;
              const billingPeriod = readingDatenew ? `${tableMeta.rowData[3]} - ${readingDatenew}` : "";
              const readingDate = readingDatenew ? getEpochForDate(readingDatenew) : null;
              const statusSelects = document.querySelectorAll("select.bulk-status-select");
              const statusFromSelect = statusSelects[tableMeta.rowIndex] && statusSelects[tableMeta.rowIndex].value;
              const status = statusFromSelect || (tableMeta.rowData && tableMeta.rowData[7]) || "";
              const tenantId = tableMeta.rowData && tableMeta.rowData[8];
              if (!currentReadingRaw || !Number.isFinite(currentReading)) {
                alert("Please enter a numeric Current Reading greater than or equal to Last Reading before updating");
                return;
              }

              if (currentReading < lastReading) {
                alert("Please enter a numeric Current Reading greater than or equal to Last Reading before updating");
                return;
              }

              // New Reading Date must not be earlier than Current Reading Date
              if (readingDate && currentReadingDate && readingDate < currentReadingDate) {
                alert("New Reading Date cannot be earlier than Current Reading Date");
                return;
              }

              try {
                const resp = await updatesingleReading(consumerId, lastReading, currentReadingRaw, currentReading, billingPeriod, status, readingDate, lastReadingDate, tenantId);
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
      pagination: false,
      selectableRows: false,
      hover: true,
      rowsPerPageOptions: [10, 15, 20],
    },
    customSortColumn: {
      column: "Date Created",
      sortingFn: (data, i, sortDateOrder) => {
        const epochDates = data.reduce((acc, curr) => {
          acc.push([...curr, getEpochForDate(curr[3], "dayend")]);
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
export const updateAllReadings = async (state, dispatch) => {
  debugger;
  let allarray = [];

  // get table data from screen config
  const rows = get(
    state,
    "screenConfiguration.screenConfig.bulkmeterreading.components.div.children.searchResults.props.data",
    []
  );

  // read the live values typed in the table inputs
  const readingInputs = document.querySelectorAll("input.bulk-new-reading");
  const dateInputs = document.querySelectorAll("input.bulk-new-reading-date");
  const statusSelects = document.querySelectorAll("select.bulk-status-select");

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Support both object-style rows and array-style rows
    const isArrayRow = Array.isArray(row);

    const consumerId = isArrayRow ? row[0] : row["Consumer ID"];
    const usageCategory = isArrayRow ? row[1] : row["Usage Category"];
    const lastReading = Number(isArrayRow ? row[2] : row["Last Reading"]) || 0;
    const currentReadingDateDisplay = isArrayRow ? row[3] : row["Current Reading Date"];
    const lastReadingDate = getEpochForDate(currentReadingDateDisplay);

    // New reading / date: always take what user typed in the row inputs
    const currentReadingRawEl = readingInputs[i];
    const newReadingDateEl = dateInputs[i];
    const currentReadingRaw = currentReadingRawEl ? currentReadingRawEl.value : "";
    const newReadingDate = newReadingDateEl ? newReadingDateEl.value : "";

    const statusFromRow = isArrayRow ? row[7] : row["Status"];
    const status = statusSelects[i] && statusSelects[i].value ? statusSelects[i].value : statusFromRow;
    const tenantId = isArrayRow ? row[8] : row["TENANT_ID"];

    // only allow bulk update for selected meter statuses
    const isEditableStatus = ["Working", "Breakdown", "Locked"].includes(status);
    if (!isEditableStatus) {
      continue;
    }

    // only take complete rows (both value and date filled)
    if (!currentReadingRaw || !newReadingDate) {
      continue;
    }

    const currentReading = Number(currentReadingRaw) || 0;

    // skip invalid readings
    if (!Number.isFinite(currentReading) || currentReading < lastReading) {
      continue;
    }

    const readingDatenew = newReadingDate
      ? newReadingDate.split("-").reverse().join("/")
      : null;
    const billingPeriod =
      readingDatenew && currentReadingDateDisplay
        ? `${currentReadingDateDisplay} - ${readingDatenew}`
        : "";
    const readingDate = readingDatenew ? getEpochForDate(readingDatenew) : null;

    // New Reading Date must not be earlier than Current Reading Date
    const currentReadingDateEpoch = currentReadingDateDisplay
      ? getEpochForDate(currentReadingDateDisplay)
      : null;
    if (readingDate && currentReadingDateEpoch && readingDate < currentReadingDateEpoch) {
      // skip this row if date is invalid
      continue;
    }

    // push only complete row into array
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
          generateDemand: true
        }
      ]
    };
    allarray.push(payload.meterReadingslist[0]);
    //let meterReadingslist = allarray;
    console.log("Prepared data for bulk update:", allarray);

  }

  try {
    dispatch(toggleSpinner(true));
    const url = "/ws-calculator/meterConnection/_createmultiple";


    const response = await httpRequest("post", url, "_update", [], { meterReadingslist: allarray });

    dispatch(toggleSpinner(false));
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
    return response;
  } catch (e) {
    dispatch(toggleSpinner(false));
    console.error("API error:", e);
    throw e;
  }
  console.log("Prepared data for bulk update:", allarray);
  // return allarray;
}