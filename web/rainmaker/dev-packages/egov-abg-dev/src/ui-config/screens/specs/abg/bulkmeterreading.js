import {
  getBreak, getCommonHeader, getLabel, getCommonCard,
  getCommonContainer,
  getTextField, getSelectField
} from "egov-ui-framework/ui-config/screens/specs/utils";
import { prepareFinalObject } from "egov-ui-framework/ui-redux/screen-configuration/actions";
import { getTenantId } from "egov-ui-kit/utils/localStorageUtils";
import { httpRequest } from "../../../../ui-utils";
import { getBoundaryData } from "../../../../ui-utils/commons";
import {
  abgSearchCard,
  //mergeDownloadButton, 
  resetFields
} from "./gBmr/groupBillSearch";

// import { updateAllReadings } from "./gBmr/functions";
import { searchResults, updateAllReadings } from "./gBmr/searchResults";
import "./index.css";

const tenantId = getTenantId();

const header = getCommonHeader({
  labelName: "Bulk Meter Reading",
  labelKey: "Bulk Meter Reading"
});

const getMDMSData = async (action, state, dispatch) => {
  const tenantId = getTenantId();
  let mdmsBody = {
    MdmsCriteria: {
      tenantId: tenantId,
      moduleDetails: [
        {
          moduleName: "egf-master",
          masterDetails: [
            { name: "FinancialYear", filter: "[?(@.module=='PT')]" } //FY Filter hardcoded for PT
          ]
        },
        {
          moduleName: "BillingService",
          masterDetails: [
            {
              name: "BusinessService"
              // filter: "[?(@.type=='Adhoc')]"
            },
            {
              name: "TaxHeadMaster"
            },
            {
              name: "TaxPeriod"
            }
          ]
        },
        {
          moduleName: "common-masters",
          masterDetails: [
            {
              name: "uiCommonPay"
            }
          ]
        },
        {
          moduleName: "tenant",
          masterDetails: [
            {
              name: "tenants"
            }
          ]
        }
      ]
    }
  };
  try {
    const payload = await httpRequest(
      "post",
      "/egov-mdms-service/v1/_search",
      "_search",
      [],
      mdmsBody
    );
    payload.MdmsRes.BillingService.BusinessService = payload.MdmsRes.BillingService.BusinessService.filter(service => service.billGineiURL);
    dispatch(prepareFinalObject("searchScreenMdmsData", payload.MdmsRes));
  } catch (e) {
    console.log(e);
  }
};

const getData = async (action, state, dispatch) => {
  await getMDMSData(action, state, dispatch);
};

const abgSearchAndResult = {
  uiFramework: "material-ui",
  name: "bulkmeterreading",
  beforeInitScreen: (action, state, dispatch) => {
    resetFields(state, dispatch);
    getData(action, state, dispatch).then(responseAction => {
      const queryObj = [{ key: "tenantId", value: tenantId }];
      getBoundaryData(action, state, dispatch, queryObj, tenantId);
    });
    return action;
  },
  components: {
    div: {
      uiFramework: "custom-atoms",
      componentPath: "Form",
      props: {
        className: "common-div-css",
        id: "bulkmeterreading"
      },
      children: {
        headerDiv: {
          uiFramework: "custom-atoms",
          componentPath: "Container",

          children: {
            header: {
              gridDefination: {
                xs: 12,
                sm: 6
              },
              ...header
            }
          }
        },
        abgSearchCard,
        breakAfterSearch: getBreak(),
        // progressStatus,
        searchResults,
        breakAfterSearchResults: getBreak(),

        button: getCommonContainer({
          buttonContainer: getCommonContainer({
            firstCont: {
              uiFramework: "custom-atoms",
              componentPath: "Div",
              gridDefination: {
                xs: 12,
                sm: 3
              }
            },

            updateAllButton: {
              componentPath: "Button",
              gridDefination: {
                xs: 12,
                sm: 3
              },
              props: {
                variant: "contained",
                style: {
                  color: "white",
                  backgroundColor: "#FE7A51",
                  borderRadius: "2px",
                  width: window.innerWidth > 480 ? "80%" : "100%",
                  height: "48px"
                }
              },
              children: {
                buttonLabel: getLabel({
                  labelName: "Update All Readings",
                  labelKey: "Update All Readings"
                })
              },
              onClickDefination: {
                action: "condition",
                callBack: updateAllReadings
              }
            },
            lastCont: {
              uiFramework: "custom-atoms",
              componentPath: "Div",
              gridDefination: {
                xs: 12,
                sm: 3
              }
            }
          })
        })

      }
    },
    //mergeDownloadButton
  }
};

export default abgSearchAndResult;
