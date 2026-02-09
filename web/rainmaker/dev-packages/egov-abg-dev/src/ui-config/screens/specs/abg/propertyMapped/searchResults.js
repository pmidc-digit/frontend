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
import PTmapPopup from "./ptmapedPopup";

const popdata = () => {

}


export const searchResults = {


  uiFramework: "custom-molecules",
  componentPath: "Table",
  visible: false,
  props: {
    data: [],
    columns: [
      { labelName: "Property ID", labelKey: "Property ID" },

      { labelName: "Owner Name", labelKey: "Owner Name" },

      { labelName: "Owner Mobile", labelKey: "Owner Mobile" },
      { labelName: "Land Area", labelKey: "Land Area" },

      { labelName: "Usage Category", labelKey: "Usage Category" },
      {
        labelName: "Locality",
        labelKey: "Locality",
        options: {
          display: false,
          viewColumns: false,
          filter: false
        }
      },
      { labelName: "Address", labelKey: "Address" },

      {
        labelName: "Row Data Complete",
        labelKey: "Row Data Complete",
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
              debugger;
              const [open, setOpen] = React.useState(false);
              debugger;
              const row = tableMeta.rowData || [];
              const propertiesId = row[0] || "";
              const ownerName = row[1] || "";
              const ownerMobile = row[2] || "";
              const landArea = row[3] || "";

              const usageCategory = row[4] || "";
              const locality = row[5] || "";
              const address = row[6] || "";
              const rowdatacomplete = row[7] || {};
              const handleOpen = () => setOpen(true);
              const handleClose = () => setOpen(false);

              const handleMarkCorrect = async () => {
                try {
                  const requestBody = {
                    "PropertyRates": [
                      {
                        id: rowdatacomplete.integration_id,
                        "propertyId": rowdatacomplete.propertyid,
                        "tenantId": rowdatacomplete.tenantid,
                        "districtId": rowdatacomplete.districtid,
                        "tehsilId": rowdatacomplete.tehsilid,
                        "villageId": rowdatacomplete.village_id,


                        "locality": rowdatacomplete.locality || "",


                      }
                    ]
                  };

                  console.log("Submit request body:", JSON.stringify(requestBody));

                  const url = "/egov-property-rate/property-rate/_update";

                  const response = await httpRequest(
                    "post",
                    url,
                    "",
                    [],
                    requestBody
                  );

                  console.log("Submit response:", response);

                  alert("Property rate mapping submitted successfully!");


                } catch (error) {
                  console.error("Error submitting property rate:", error);
                  alert("Failed to submit property rate: " + (error.message || "Unknown error"));

                }
                console.log("Marked as correct:", {
                  propertiesId,
                  ownerName,
                  ownerMobile,
                  landArea,
                  usageCategory,
                  locality,
                  address,
                  rowdatacomplete
                });
              };

              return (
                <React.Fragment>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center"
                    }}
                  >
                    <button
                      type="button"
                      style={{
                        minWidth: "40px",
                        marginLeft: "8px",
                        padding: "4px 10px",
                        background: "#4CAF50",
                        border: "none",
                        color: "#fff",
                        borderRadius: "2px",
                        cursor: "pointer"
                      }}
                      title="Mark as correct"
                      onClick={handleMarkCorrect}
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      style={{
                        minWidth: "40px",
                        marginLeft: "8px",
                        padding: "4px 10px",
                        background: "#c51414",
                        border: "none",
                        color: "#fff",
                        borderRadius: "2px",
                        cursor: "pointer"
                      }}
                      title="Mark as INcorrect"
                      onClick={handleOpen}
                    >
                      ✗
                    </button>


                  </div>

                  <Dialog
                    open={open}
                    isClose={true}
                    handleClose={handleClose}
                    bodyStyle={{ padding: 0, maxHeight: "90vh", overflowY: "auto" }}
                    contentStyle={{ width: "1200px", maxWidth: "95%", maxHeight: "90vh" }}
                  >
                    <div style={{ padding: "16px 20px 0", fontSize: "18px", fontWeight: 600 }}>
                      Property Revenue Mapped Details
                    </div>
                    <PTmapPopup
                      propertiesId={propertiesId}
                      ownerName={ownerName}
                      ownerMobile={ownerMobile}
                      landArea={landArea}
                      usageCategory={usageCategory}
                      locality={locality}
                      address={address}
                      rowdatacomplete={rowdatacomplete}
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
      pagination: true,
      selectableRows: false,
      hover: true,
      rowsPerPageOptions: [10, 15, 20],
      rowsPerPage: 10
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

