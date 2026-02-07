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
import PTmapPopup from "./ptmapPopup";

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
      { labelName: "Locality", labelKey: "Locality" },
      { labelName: "Address", labelKey: "Address" },

      {
        labelName: "Action",
        labelKey: "ABG_COMMON_TABLE_COL_ACTION",
        options: {
          filter: false,
          customBodyRender: (value, tableMeta) => {
            const RowAction = () => {
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
                    contentStyle={{ width: "1200px", maxWidth: "95%" }}
                  >
                    <div style={{ padding: "16px 20px 0", fontSize: "18px", fontWeight: 600 }}>
                      Property Revenue Map
                    </div>
                    <PTmapPopup
                      propertiesId={propertiesId}
                      ownerName={ownerName}
                      ownerMobile={ownerMobile}
                      landArea={landArea}
                      usageCategory={usageCategory}
                      locality={locality}
                      address={address}
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

