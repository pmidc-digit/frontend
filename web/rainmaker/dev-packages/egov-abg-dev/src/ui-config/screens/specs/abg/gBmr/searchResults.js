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
      { labelName: "Last Reading Date", labelKey: "Last Reading Date" },
      {
        labelName: "Meter Status",
        labelKey: "Meter Status",
        options: {
          filter: false,
          customBodyRender: (value, tableMeta, updateValue) => {
            const statusOptions = [
              "Working",
              "Locked",
              "Breakdown",
              "No_Meter",
              "Reset",
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
        labelName: "New Reading(in KL)",
        labelKey: "New Reading(in KL)",
        options: {
          filter: false,
          customBodyRender: (value, tableMeta, updateValue) => {
            // Last Reading is at index 2, Status is at index 4
            const lastReading = tableMeta.rowData && tableMeta.rowData[2];
            const status = tableMeta.rowData && tableMeta.rowData[4];
            const isEditable = ["Working", "Reset", "Replacement"].includes(status);
            const isReset = status === "Reset" || status === "Replacement";
            return (
              <input
                type="number"
                min={isReset ? 0 : (lastReading || 0)}
                max={status === "Reset" ? 100000 : 10000}
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
                  if (!Number.isFinite(numeric)) {
                    e.target.value = "";
                    updateValue("");
                    alert("Please enter a valid numeric value");
                    return;
                  }
                  if (numeric > 10000 && status != "Reset") {
                    e.target.value = "";
                    updateValue("");
                    alert("Please enter a numeric value less than or equal to 10000");
                    return;
                  }
                  if (!isReset) {
                    const min = Number(lastReading || 0);
                    if (numeric < min) {
                      e.target.value = "";
                      updateValue("");
                      alert("Please enter a numeric value greater than or equal to Last Reading");
                      return;
                    }
                  }
                  updateValue(v);
                }}
              />
            );
          }
        }
      },
      {
        labelName: "Consumption",
        labelKey: "Consumption",
        options: {
          filter: false,
          customBodyRender: (value, tableMeta) => {
            const lastReading = Number(tableMeta.rowData && tableMeta.rowData[2]) || 0;
            const status = tableMeta.rowData && tableMeta.rowData[4];
            const inputs = (document.querySelectorAll && document.querySelectorAll("input.bulk-new-reading")) || [];
            const inputEl = inputs[tableMeta.rowIndex];
            const newReadingRaw = inputEl ? inputEl.value : (tableMeta.rowData && tableMeta.rowData[5]);

            if (newReadingRaw === undefined || newReadingRaw === null || newReadingRaw === "") return "";
            const newReading = Number(newReadingRaw) || 0;

            if (["Locked", "No_Meter", "Breakdown"].includes(status)) return String(0);

            if (status === "Replacement") {
              return String(newReading - 0);
            }

            if (status === "Reset") {
              return String(10000 + newReading - lastReading);
            }

            return String(newReading - lastReading);
          }
        }
      },
      {
        labelName: "New Reading Date",
        labelKey: "New Reading Date",
        options: {
          filter: false,
          customBodyRender: (value, tableMeta, updateValue) => {
            // Disable dates earlier than Last Reading Date for that row
            const currentReadingDateDisplay =
              tableMeta.rowData && tableMeta.rowData[3]; // Last Reading Date at index 3
            const status = tableMeta.rowData && tableMeta.rowData[4];
            const isEditable = ["Working", "Reset", "Replacement", "Locked", "No_Meter", "Breakdown"].includes(status);

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
                // disabled={!isEditable}
                // defaultValue={value || today}
                onChange={e => {
                  // if (!isEditable) return;
                  updateValue(e.target.value);
                }}
                onBlur={e => {
                  const dateValue = e.target.value;

                  // Validate date is not empty
                  if (!dateValue) {
                    alert("Please enter a New Reading Date");
                    return;
                  }

                  // Validate date is not earlier than Last Reading Date
                  if (minDate && dateValue < minDate) {
                    alert("New Reading Date cannot be earlier than Last Reading Date");
                    e.target.value = "";
                    updateValue("");
                    return;
                  }
                }}
              />
            );
          }
        }
      },
      { labelName: "Billing Period", labelKey: "Billing Period" },
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

            let readingDatenew = tableMeta.rowData[7];
            readingDatenew = readingDatenew ? readingDatenew.split("-").reverse().join("/") : null;
            const handleUpdate = async () => {

              const statusSelects = document.querySelectorAll("select.bulk-status-select");
              const statusFromSelect = statusSelects[tableMeta.rowIndex] && statusSelects[tableMeta.rowIndex].value;

              const consumerId = tableMeta.rowData && tableMeta.rowData[0];
              const status = statusFromSelect || (tableMeta.rowData && tableMeta.rowData[4]) || "";
              const lastReading = status == "Replacement" ? 0 : Number(tableMeta.rowData && tableMeta.rowData[2]) || 0;
              const currentReadingDate = tableMeta.rowData && tableMeta.rowData[3] ? getEpochForDate(tableMeta.rowData[3]) : null;
              const lastReadingDate = currentReadingDate;
              const currentReadingRaw = Number(tableMeta.rowData && tableMeta.rowData[5]) || 0;
              let currentReading = Number(currentReadingRaw) || 0;
              let consumption = currentReading - lastReading;
              const billingPeriod = readingDatenew ? `${tableMeta.rowData[3]} - ${readingDatenew}` : "";
              const readingDate = readingDatenew ? getEpochForDate(readingDatenew) : null;
              let isBulkMeter = currentReading > 10000 ? false : true;
              const tenantId = tableMeta.rowData && tableMeta.rowData[9];

              // If status is Locked, No_Meter, or Breakdown, automatically set currentReading to lastReading
              if (["Locked", "No_Meter", "Breakdown"].includes(status)) {
                currentReading = lastReading;
                try {
                  const resp = await updatesingleReading(consumerId, lastReading, lastReading, currentReading, billingPeriod, status, readingDate, lastReadingDate, tenantId, isBulkMeter);
                  alert("Update successful for Consumer ID: " + (consumerId || ""));
                } catch (err) {
                  console.error(err);
                  alert("Update failed: " + (err && err.message ? err.message : "Unknown error"));
                }
                return;
              }

              if (!currentReadingRaw) {
                alert("Please enter a numeric Current Reading before updating");
                return;
              }

              if (!readingDate || !Number.isFinite(currentReading)) {
                alert("Please enter a numeric Current date before updating");
                return;
              }
              if (currentReading > 10000) {
                alert("Please enter a numeric Current Reading less than or equal to 10000 before updating");
                return;
              }

              if (status !== "Reset" && currentReading < lastReading) {
                alert("Please enter a numeric Current Reading greater than or equal to Last Reading before updating");
                return;
              }

              consumption = status === "Reset" ? (10000 + currentReading - lastReading) : currentReading;

              // New Reading Date must not be earlier than Last Reading Date
              if (readingDate && currentReadingDate && readingDate < currentReadingDate) {
                alert("New Reading Date cannot be earlier than Last Reading Date");
                return;
              }

              try {
                const resp = await updatesingleReading(consumerId, lastReading, currentReadingRaw, currentReading, billingPeriod, status, readingDate, lastReadingDate, tenantId, isBulkMeter);
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
    title: { labelName: "Search Results for Water Connection", labelKey: "BILL_GENIE_GROUP_SEARCH_HEADER_Water-Connection" },
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

  let allarray = [];
  let skippedRows = 0;
  let errorRows = [];

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
    const currentReadingDateDisplay = isArrayRow ? row[3] : row["Last Reading Date"];
    const lastReadingDate = getEpochForDate(currentReadingDateDisplay);

    // New reading / date: always take what user typed in the row inputs
    const currentReadingRawEl = readingInputs[i];
    const newReadingDateEl = dateInputs[i];
    const currentReadingRaw = currentReadingRawEl ? currentReadingRawEl.value : "";
    const newReadingDate = newReadingDateEl ? newReadingDateEl.value : "";

    const statusFromRow = isArrayRow ? row[7] : row["Meter Status"];
    const status = statusSelects[i] && statusSelects[i].value ? statusSelects[i].value : statusFromRow;
    const tenantId = isArrayRow ? row[8] : row["TENANT_ID"];

    // only allow bulk update for selected meter statuses
    const isEditableStatus = ["Working", "Reset", "Replacement", "Locked", "No_Meter", "Breakdown"].includes(status);
    if (!isEditableStatus) {
      continue;
    }

    // For Locked, No_Meter, Breakdown - automatically use lastReading and still require date
    if (["Locked", "No_Meter", "Breakdown"].includes(status)) {
      if (!newReadingDate) {
        errorRows.push(consumerId);
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

      const currentReadingDateEpoch = currentReadingDateDisplay
        ? getEpochForDate(currentReadingDateDisplay)
        : null;
      if (readingDate && currentReadingDateEpoch && readingDate < currentReadingDateEpoch) {
        errorRows.push(consumerId);
        continue;
      }

      const payload = {
        meterReadingslist: [
          {
            currentReadingDate: readingDate,
            currentReading: lastReading,
            billingPeriod: billingPeriod,
            meterStatus: status,
            connectionNo: consumerId,
            lastReading: status === "Replacement" ? 0 : lastReading,
            lastReadingDate: lastReadingDate,
            tenantId: tenantId,
            generateDemand: true,
            isBulkMeter: lastReading > 10000 ? true : false
          }
        ]
      };
      allarray.push(payload.meterReadingslist[0]);
      continue;
    }

    // only take complete rows (both value and date filled) for other statuses
    if (!currentReadingRaw || !newReadingDate) {
      if (!newReadingDate) {
        errorRows.push(consumerId);
      }
      continue;
    }

    let currentReading = Number(currentReadingRaw) || 0;

    // Validate input range
    if (!Number.isFinite(currentReading) || currentReading > 10000) {
      skippedRows++;
      continue;
    }


    if (status !== "Reset" && status !== "Replacement" && currentReading < lastReading) {
      skippedRows++;
      continue;
    }

    // Calculate actual reading for Reset status
    if (status === "Reset") {
      currentReading = currentReading;
      //consumption = 10000 + currentReading - lastReading;
    }

    const readingDatenew = newReadingDate
      ? newReadingDate.split("-").reverse().join("/")
      : null;
    const billingPeriod =
      readingDatenew && currentReadingDateDisplay
        ? `${currentReadingDateDisplay} - ${readingDatenew}`
        : "";
    const readingDate = readingDatenew ? getEpochForDate(readingDatenew) : null;

    // New Reading Date must not be earlier than Last Reading Date
    const currentReadingDateEpoch = currentReadingDateDisplay
      ? getEpochForDate(currentReadingDateDisplay)
      : null;
    if (readingDate && currentReadingDateEpoch && readingDate < currentReadingDateEpoch) {
      errorRows.push(consumerId);
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
          lastReading: status === "Replacement" ? 0 : lastReading,
          lastReadingDate: lastReadingDate,
          tenantId: tenantId,
          generateDemand: true,
          isBulkMeter: lastReading > 10000 ? true : false
        }
      ]
    };
    allarray.push(payload.meterReadingslist[0]);

  }

  // Show validation error summary


  if (allarray.length === 0) {
    alert("No valid rows to update. Please fill in all required fields.");
    return;
  }

  try {
    dispatch(toggleSpinner(true));
    const url = "/ws-calculator/meterConnection/_createmultiple";


    const response = await httpRequest("post", url, "_update", [], { meterReadingslist: allarray });
    if (response && response.meterReadingslist && response.meterReadingslist.length > 0) {
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
    }
    return response;
  } catch (e) {
    dispatch(toggleSpinner(false));
    console.error("API error:", e);
    throw e;
  }
}
