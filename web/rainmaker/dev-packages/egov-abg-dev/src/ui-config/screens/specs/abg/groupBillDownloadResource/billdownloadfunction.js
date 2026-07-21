import { handleScreenConfigurationFieldChange as handleField, prepareFinalObject, toggleSnackbar } from "egov-ui-framework/ui-redux/screen-configuration/actions";
import { getTenantId } from "egov-ui-kit/utils/localStorageUtils";
import get from "lodash/get";
import { httpRequest } from "../../../../../ui-utils";
import { validateFields } from "../../utils";
import { convertEpochToDate } from "../../utils/index";
import { result } from "lodash";
import { getLocaleLabels } from "egov-ui-framework/ui-utils/commons.js";


export var searchApiCall = function (state, dispatch, limit, offset) {
  if (limit === undefined) limit = 10;
  if (offset === undefined) offset = 0;

  var response;

  var searchScreenObject = get(
    state,
    "screenConfiguration.preparedFinalObject.searchScreen",
    {}
  );

  var tenantId = searchScreenObject.tenantId;

  if (!tenantId) {
    dispatch(
      toggleSnackbar(
        true,
        {
          labelName: "Tenant ID Not Found",
          labelKey: "Tenant ID Not Found"
        },
        "error"
      )
    );
    return;
  }

  var params = [{ key: "tenantId", value: tenantId }];

  return httpRequest(
    "post",
    "/pdf-service/v1/_getBulkPdfRecordsDetails",
    "",
    params
  )
    .then(function (res) {
      response = res;

      var billRecords = get(response, "groupBillrecords", []);

      if (!billRecords.length) {
        dispatch(
          toggleSnackbar(
            true,
            {
              labelName: "No Records Found",
              labelKey: "ABG_NO_RECORDS_FOUND"
            },
            "warning"
          )
        );
        return;
      }

      var filteredBillData = billRecords.filter(function (item) {
        return item.status === "DONE";
      });
      //console.table("tableData",filteredBillData);
      //make table data


      const tableData = (filteredBillData || []).map(function (item) {

        var localityNames = "-";

        if (item && item.locality) {

          var localityArray = [];

          // Case 1: {"SC1","SC2"}
          if (item.locality.indexOf("{") !== -1) {
            localityArray = item.locality
              .replace(/[{}"]/g, "")
              .split(",")
              .filter(function (value) {
                return value && value.trim();
              });
          }
          // Case 2: SC1
          else {
            localityArray = [item.locality];
          }

          localityNames = localityArray
            .map(function (code) {
              return generateLocalityKey(state, code.trim());
            })
            .filter(function (name) {
              return name;
            })
            .join(", ");

          if (!localityNames) {
            localityNames = "-";
          }
        } else if (item && item.group) {
          localityNames = item.group;
        } else {
          localityNames = "-";
        }

        return {
          ABG_JOB_ID:
            item && item.jobid
              ? item.jobid
              : "-",

          ABG_TENANT_ID:
            item && item.tenantId
              ? item.tenantId
              : "-",

          ABG_FILESTORE_ID:
            item && item.filestoreid
              ? item.filestoreid
              : "-",

          ABG_TOTAL_RECORDS:
            item && item.totalrecords
              ? item.totalrecords
              : "-",

          ABG_RECORDS_COMPLETED:
            item && item.recordscompleted
              ? item.recordscompleted
              : "-",

          ABG_LOCALITY_NAME:
            localityNames,

          ABG_BUSINESS_SERVICE:
            item && item.bussinessService
              ? item.bussinessService
              : "-",
        };
      });


      dispatch(
        handleField(
          "groupBillDownloads",
          "components.div.children.billSearchResult",
          "props.data",
          tableData
        )
      );

      dispatch(
        handleField(
          "groupBillDownloads",
          "components.div.children.billSearchResult",
          "props.rows",
          tableData.length
        )
      );

      dispatch(
        handleField(
          "groupBillDownloads",
          "components.div.children.billSearchResult",
          "props.options.count",
          tableData.length
        )
      );

      dispatch(
        toggleSnackbar(
          true,
          {
            labelName: "Search completed successfully",
            labelKey: "ABG_SEARCH_SUCCESS"
          },
          "success"
        )
      );

      showHideTable(true, dispatch);
    })
    .catch(function (error) {
      console.error("API Error:", error);

      dispatch(
        toggleSnackbar(
          true,
          {
            labelName: error.message || "API Error",
            labelKey: error.message || "API Error"
          },
          "error"
        )
      );
    });
};
const generateLocalityKey = (state, localityCode) => {
  const localitiesData = get(
    state,
    "screenConfiguration.preparedFinalObject.localitiesData",
    []
  );
  const localityName = Array.isArray(localitiesData)
    ? localitiesData.find((item => item.code === localityCode))
    : null;
  return localityName ? localityName.name : "-";
}
const showHideTable = (booleanHideOrShow, dispatch) => {
  dispatch(
    handleField(
      "groupBillDownloads",
      "components.div.children.billSearchResult",
      "visible",
      booleanHideOrShow
    )
  );
};


