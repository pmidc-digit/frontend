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
import MApptedpopupsd from "./mapptedpopupsd";

const popdata = () => {

}


export const searchResults = {


  uiFramework: "custom-molecules",
  componentPath: "Table",
  visible: false,
  props: {
    data: [],
    columns: [
      {
        labelName: "Property ID",
        labelKey: "Property ID",
        options: {
          filter: true,
          customBodyRender: (value, tableMeta) => {
            const PropertyIDCell = () => {
              const [open, setOpen] = React.useState(false);
              const row = tableMeta.rowData || [];
              const propertiesId = row[0] || "";
              const ownerName = row[1] || "";
              const ownerMobile = row[2] || "";
              const landArea = row[3] || "";
              const districtName = row[4] || "";
              const tehsilName = row[5] || "";
              const villageName = row[6] || "";
              const propertyType = row[7] || "";
              const usageCategory = row[8] || "";
              const noOfFloors = row[9] || "";
              const locality = row[10] || "";
              const address = row[11] || "";
              const rowdatacomplete = row[12] || {};

              const handleOpen = () => setOpen(true);
              const handleClose = () => setOpen(false);

              return (
                <React.Fragment>
                  <span
                    style={{
                      color: "#2947a3",
                      cursor: "pointer",
                      textDecoration: "underline",
                      fontWeight: 600
                    }}
                    onClick={handleOpen}
                  >
                    {value || "-"}
                  </span>

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
                    <MApptedpopupsd
                      propertiesId={propertiesId}
                      ownerName={ownerName}
                      ownerMobile={ownerMobile}
                      landArea={landArea}
                      usageCategory={usageCategory}
                      noOfFloors={noOfFloors}
                      locality={locality}
                      address={address}
                      rowdatacomplete={rowdatacomplete}
                      onClose={handleClose}
                    />
                  </Dialog>
                </React.Fragment>
              );
            };

            return <PropertyIDCell />;
          }
        }
      },

      { labelName: "Owner Name", labelKey: "Owner Name" },

      { labelName: "Owner Mobile", labelKey: "Owner Mobile" },
      { labelName: "Land Area", labelKey: "Land Area" },
      { labelName: "District Name", labelKey: "District Name" },
      { labelName: "Tehsil Name", labelKey: "Tehsil Name" },
      { labelName: "Village Name", labelKey: "Village Name" },

      { labelName: "Property Type", labelKey: "Property Type" },
      {
        labelName: "Usage Category",
        labelKey: "Usage Category",
        options: {
          display: false,
          viewColumns: false,
          filter: false
        }
      },

      { labelName: "No of Floors", labelKey: "No of Floors" },
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
              const [open, setOpen] = React.useState(false);
              const row = tableMeta.rowData || [];
              const propertiesId = row[0] || "";
              const ownerName = row[1] || "";
              const ownerMobile = row[2] || "";
              const landArea = row[3] || "";
              const districtName = row[4] || "";
              const tehsilName = row[5] || "";
              const villageName = row[6] || "";
              const propertyType = row[7] || "";
              const usageCategory = row[8] || "";
              const noOfFloors = row[9] || "";
              const locality = row[10] || "";
              const address = row[11] || "";
              const rowdatacomplete = row[12] || {};
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
                        "landArea": rowdatacomplete.landarea,
                        "segmentId": rowdatacomplete.segmentid,
                        "subSegmentId": rowdatacomplete.subsegmentid,
                        "tehsil_name": rowdatacomplete.tehsil_name,
                        "tehsilid": rowdatacomplete.tehsilid,
                        "village_id": rowdatacomplete.village_id,
                        "village_name": rowdatacomplete.village_name,
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

                  alert("Property rate mapping submitted successfully!");


                } catch (error) {
                  console.error("Error submitting property rate:", error);
                  alert("Failed to submit property rate: " + (error.message || "Unknown error"));

                }

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

                        padding: "4px 10px",
                        background: "#2947a3",
                        border: "none",
                        color: "#fff",
                        borderRadius: "10px",
                        cursor: "pointer"
                      }}
                      title="Verify property details"
                      onClick={handleOpen}
                    >
                      Verify
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
                    <MApptedpopupsd
                      propertiesId={propertiesId}
                      ownerName={ownerName}
                      ownerMobile={ownerMobile}
                      landArea={landArea}
                      usageCategory={usageCategory}
                      noOfFloors={noOfFloors}
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

