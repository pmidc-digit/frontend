import React from "react";
import { LabelContainer } from "egov-ui-framework/ui-containers";
import {
  getEpochForDate,
  sortByEpoch,
} from "../../utils";
import { setRoute } from "egov-ui-kit/utils/commons";

export const searchPropertyTable = {
  uiFramework: "custom-molecules",
  componentPath: "Table",
  visible: false,
  props: {
    className: "propertyTab",
    columns: [
      { labelName: "Property ID", labelKey: "PT_MUTATION_PID" },
      { labelName: "Owner Name", labelKey: "PT_COMMON_TABLE_COL_OWNER_NAME" },
      { labelName: "Address", labelKey: "PT_COMMON_COL_ADDRESS" },
      {
        labelName: "Property Status",
        labelKey: "PT_COMMON_TABLE_PROPERTY_STATUS",
      },
      { labelName: "Tax paid years", labelKey: "PT_COMMON_PAID_YEARS" },
      { labelName: "Amount Due", labelKey: "PT_AMOUNT_DUE" },
      {
        labelName: "Action",
        labelKey: "PT_COMMON_TABLE_COL_ACTION_LABEL",
        options: {
          filter: false,
          customBodyRender: (value, tableMeta) =>
            (value.totalAmount > 0 && value.status === "ACTIVE") ? getPayButton(tableMeta) : (
              value.totalAmount === 0 && value.status === "ACTIVE" && value.isAdvancePaymentAllowed ? getPayButton(tableMeta) : ""
            ),
        },
      },
      {
        labelName: "Tenant Id",
        labelKey: "TENANT_ID",
        options: {
          display: false,
        },
      },
      {
        labelName: "Advance Payment",
        labelKey: "ADVANCE_PAYMENT",
        options: {
          display: false,
        },
      },
    ],
    title: {
      labelName: "Search Results for Properties",
      labelKey: "PT_HOME_PROPERTY_RESULTS_TABLE_HEADING",
    },
    rows: "",
    options: {
      filter: false,
      download: false,
      responsive: "stacked",
      selectableRows: false,
      hover: false,
      hint: "",
      rowsPerPageOptions: [10, 15, 20],
    },
    customSortColumn: {
      column: "Application Date",
      sortingFn: (data, i, sortDateOrder) => {
        const epochDates = data.reduce((acc, curr) => {
          acc.push([...curr, getEpochForDate(curr[4], "dayend")]);
          return acc;
        }, []);
        const order = sortDateOrder === "asc" ? true : false;
        const finalData = sortByEpoch(epochDates, !order).map((item) => {
          item.pop();
          return item;
        });
        return { data: finalData, currentOrder: !order ? "asc" : "desc" };
      },
    },
  },
};

const payAmount = (tableMeta) => {
    setRoute(`/withoutAuth/egov-common/pay?consumerCode=${tableMeta.rowData[0]}&tenantId=${tableMeta.rowData[6]}&businessService=PT`);
};

const getPayButton = (tableMeta) => {
  return (
    <a href="javascript:void(0)"
      onClick={() => payAmount(tableMeta)}
      style={{ color: "#FE7A51" }}
    >
      <LabelContainer labelKey="PT_TOTALDUES_PAY" labelName="PAY" />
    </a>
  )
}
