import React from "react";
import get from "lodash/get";
import { sortByEpoch, getEpochForDate } from "../../utils";
import { generateSingleBill } from "../../utils/receiptPdf";
import { httpRequest } from "egov-ui-framework/ui-utils/api";
import { localStorageGet } from "egov-ui-kit/utils/localStorageUtils";
import { download, downloadBill } from "egov-common/ui-utils/commons";
import { toggleSpinner, toggleSnackbar } from "egov-ui-framework/ui-redux/screen-configuration/actions";
import { updatesingleReading } from "./functions";

// Global persistent storage for edited readings across pagination changes
const editedReadingsMap = {};


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
              "Reset",
              "Replacement"
            ];
            const currentStatus = value || "";
            const consumerId = tableMeta.rowData && tableMeta.rowData[0];

            // Get value from persistent storage if available
            const storedValue = editedReadingsMap[`${consumerId}-status`];
            const displayValue = storedValue !== undefined ? storedValue : currentStatus;

            return (
              <select
                key={`status-${consumerId}`}
                className="bulk-status-select"
                data-consumer-id={consumerId}
                style={{ width: "140px", padding: "6px", boxSizing: "border-box" }}
                value={displayValue}
                onChange={e => {
                  // Store in persistent map
                  editedReadingsMap[`${consumerId}-status`] = e.target.value;
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
            const consumerId = tableMeta.rowData && tableMeta.rowData[0];
            const isEditable = ["Working", "Reset", "Replacement"].includes(status);
            const isReset = status === "Reset" || status === "Replacement";

            // Get value from persistent storage if available
            const storedValue = editedReadingsMap[`${consumerId}-reading`];
            const displayValue = storedValue !== undefined ? storedValue : (value || "");

            return (
              <input
                key={`reading-${consumerId}`}
                type="number"
                min={isReset ? 0 : (lastReading || 0)}
                max={status === "Reset" ? 100000 : 10000}
                className="bulk-new-reading"
                data-consumer-id={consumerId}
                style={{ width: "120px", padding: "6px", boxSizing: "border-box" }}
                disabled={!isEditable}
                value={displayValue}
                onChange={e => {
                  const cleanedValue = e.target.value.replace(/[^0-9]/g, "");
                  // Store in persistent map
                  editedReadingsMap[`${consumerId}-reading`] = cleanedValue;
                  updateValue(cleanedValue);
                }}
                onInput={e => {
                  e.target.value = e.target.value.replace(/[^0-9]/g, "");
                }}
                onBlur={e => {
                  if (!isEditable) return;
                  const v = e.target.value.trim();
                  if (v === "") return;

                  const numeric = Number(v);
                  if (!Number.isFinite(numeric)) {
                    e.target.value = "";
                    updateValue("");
                    delete editedReadingsMap[`${consumerId}-reading`];
                    alert("Please enter a valid numeric value");
                    return;
                  }
                  if (numeric > 10000 && status != "Reset") {
                    e.target.value = "";
                    updateValue("");
                    delete editedReadingsMap[`${consumerId}-reading`];
                    alert("Please enter a numeric value less than or equal to 10000");
                    return;
                  }
                  if (!isReset) {
                    const min = Number(lastReading || 0);
                    if (numeric < min) {
                      e.target.value = "";
                      updateValue("");
                      delete editedReadingsMap[`${consumerId}-reading`];
                      alert("Please enter a numeric value greater than or equal to Last Reading");
                      return;
                    }
                  }
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
            const consumerId = tableMeta.rowData && tableMeta.rowData[0];
            const inputEl = document.querySelector(`input.bulk-new-reading[data-consumer-id="${consumerId}"]`);
            const newReadingRaw = inputEl ? inputEl.value : (tableMeta.rowData && tableMeta.rowData[5]);

            if (newReadingRaw === undefined || newReadingRaw === null || newReadingRaw === "") return "";
            const newReading = Number(newReadingRaw) || 0;

            if (["Locked", "Breakdown"].includes(status)) return String(0);

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
            const consumerId = tableMeta.rowData && tableMeta.rowData[0];
            const isEditable = ["Working", "Reset", "Replacement", "Locked", "Breakdown"].includes(status);

            // Get value from persistent storage if available
            const storedValue = editedReadingsMap[`${consumerId}-date`];
            const displayValue = storedValue !== undefined ? storedValue : (value || "");

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
                key={`date-${consumerId}`}
                type="date"
                min={minDate || undefined}
                className="bulk-new-reading-date"
                data-consumer-id={consumerId}
                style={{ width: "160px", padding: "6px", boxSizing: "border-box" }}
                value={displayValue}
                onChange={e => {
                  // Store in persistent map
                  editedReadingsMap[`${consumerId}-date`] = e.target.value;
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
                    delete editedReadingsMap[`${consumerId}-date`];
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
            const consumerId = tableMeta.rowData && tableMeta.rowData[0];
            const handleUpdate = async () => {

              // Get elements using Consumer ID attribute
              const statusSelect = document.querySelector(`select.bulk-status-select[data-consumer-id="${consumerId}"]`);
              const statusFromSelect = statusSelect && statusSelect.value;

              const status = statusFromSelect || (tableMeta.rowData && tableMeta.rowData[4]) || "";
              const lastReading = status == "Replacement" ? 0 : Number(tableMeta.rowData && tableMeta.rowData[2]) || 0;
              const currentReadingDate = tableMeta.rowData && tableMeta.rowData[3] ? getEpochForDate(tableMeta.rowData[3]) : null;
              const lastReadingDate = currentReadingDate;

              // Get the input value using Consumer ID
              const readingInput = document.querySelector(`input.bulk-new-reading[data-consumer-id="${consumerId}"]`);
              const currentReadingRaw = readingInput ? Number(readingInput.value) : 0;

              let currentReading = Number(currentReadingRaw) || 0;
              let consumption = currentReading - lastReading;
              const billingPeriod = readingDatenew ? `${tableMeta.rowData[3]} - ${readingDatenew}` : "";

              // Get the date input value using Consumer ID
              const dateInput = document.querySelector(`input.bulk-new-reading-date[data-consumer-id="${consumerId}"]`);
              const dateValue = dateInput ? dateInput.value : "";
              const readingDate = dateValue ? getEpochForDate(dateValue.split("-").reverse().join("/")) : null;

              let isBulkMeter = currentReading > 10000 ? false : true;
              const tenantId = tableMeta.rowData && tableMeta.rowData[9];


              if (["Locked", "Breakdown"].includes(status)) {
                currentReading = lastReading;
                try {
                  const resp = await updatesingleReading(consumerId, lastReading, lastReading, currentReading, billingPeriod, status, readingDate, lastReadingDate, tenantId, isBulkMeter);
                  if (resp.meterReadingslist[0].status == "FAILED") {
                    alert("Update failed for Consumer ID: " + (consumerId || ""));
                  } else {
                    alert("Update successful for Consumer ID: " + (consumerId || ""));
                  }
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
                if (resp.meterReadingslist[0].status == "FAILED") {
                  alert("Update failed for Consumer ID: " + (consumerId || ""));
                } else {
                  alert("Update successful for Consumer ID: " + (consumerId || ""));
                }
              } catch (err) {
                console.error(err);
                alert("Update failed: " + (err && err.message ? err.message : "Unknown error"));
              }
            };

            return (
              <button
                type="button"
                style={{ backgroundColor: "#fe7a51", borderRadius: "5px", borderColor: "#fe7a51", color: "white", padding: "6px 12px", cursor: "pointer" }}
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
      filter: true,
      download: false,
      responsive: "stacked",
      pagination: true,
      rowsPerPage: 10,
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

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const isArrayRow = Array.isArray(row);

    const consumerId = isArrayRow ? row[0] : row["Consumer ID"];
    const usageCategory = isArrayRow ? row[1] : row["Usage Category"];
    const lastReading = Number(isArrayRow ? row[2] : row["Last Reading"]) || 0;
    const currentReadingDateDisplay = isArrayRow ? row[3] : row["Last Reading Date"];
    const lastReadingDate = getEpochForDate(currentReadingDateDisplay);

    // Read from persistent storage first, then fall back to table data
    const currentReadingRaw = editedReadingsMap[`${consumerId}-reading`] || "";
    const newReadingDate = editedReadingsMap[`${consumerId}-date`] || "";
    const statusFromStorage = editedReadingsMap[`${consumerId}-status`];
    const statusFromRow = isArrayRow ? row[4] : row["Meter Status"];
    const status = statusFromStorage || statusFromRow || "";
    const tenantId = isArrayRow ? row[9] : row["TENANT_ID"];

    const isEditableStatus = ["Working", "Reset", "Replacement", "Locked", "Breakdown"].includes(status);
    if (!isEditableStatus) {
      continue;
    }

    if (["Locked", "Breakdown"].includes(status)) {
      // For Locked/Breakdown meters, only generate payload if user explicitly entered something.
      // Otherwise they should be skipped (fixes unwanted extra records).
      const userEnteredReading = editedReadingsMap[`${consumerId}-reading`];
      const userEnteredDate = editedReadingsMap[`${consumerId}-date`];
      if ((userEnteredReading === undefined || userEnteredReading === "") && (!userEnteredDate || userEnteredDate === "")) {
        continue;
      }

      // Auto-fill date with today if missing, but only when user entered reading/date.
      let finalDate = newReadingDate;
      if (!finalDate) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        finalDate = `${yyyy}-${mm}-${dd}`;
      }

      const readingDatenew = finalDate
        ? finalDate.split("-").reverse().join("/")
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

    // For Working, Reset, Replacement - reading is required
    if (!currentReadingRaw) {
      continue;
    }

    // Auto-fill date with today if reading is provided but date is missing
    let finalDate = newReadingDate;
    if (!finalDate) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      finalDate = `${yyyy}-${mm}-${dd}`;
    }

    let currentReading = Number(currentReadingRaw) || 0;

    if (!Number.isFinite(currentReading) || currentReading > 10000) {
      errorRows.push(consumerId);
      continue;
    }

    if (status !== "Reset" && status !== "Replacement" && currentReading < lastReading) {
      errorRows.push(consumerId);
      continue;
    }

    const readingDatenew = finalDate
      ? finalDate.split("-").reverse().join("/")
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

    // push row into array
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

  if (allarray.length === 0) {
    let errorMessage = "No valid records to update.";
    if (errorRows.length > 0) {
      errorMessage += `\n\nRecords with errors (${errorRows.length}): ${errorRows.join(", ")}`;
    }
    alert(errorMessage);
    return;
  }

  try {
    dispatch(toggleSpinner(true));
    const url = "/ws-calculator/meterConnection/_createmultiple";

    const response = await httpRequest("post", url, "_update", [], { meterReadingslist: allarray });
    if (response && response.meterReadingslist && response.meterReadingslist.length > 0) {
      dispatch(toggleSpinner(false));
      let successMessage = `Bulk update successful! ${allarray.length} record(s) updated.`;
      if (errorRows.length > 0) {
        successMessage += `\n\n${errorRows.length} record(s) had errors and were skipped: ${errorRows.join(", ")}`;
      }
      dispatch(
        toggleSnackbar(
          true,
          {
            labelName: successMessage,
            labelKey: "ABG_BULK_UPDATE_SUCCESS"
          },
          "success"
        )
      );
      // Clear persistent storage after successful update
      Object.keys(editedReadingsMap).forEach(key => delete editedReadingsMap[key]);
    }
    return response;
  } catch (e) {
    dispatch(toggleSpinner(false));
    console.error("API error:", e);
    throw e;
  }
}
