import {
  getBreak, getCommonHeader, getLabel, getCommonCard,
  getCommonContainer,
  getTextField, getSelectField
} from "egov-ui-framework/ui-config/screens/specs/utils";
import { prepareFinalObject, handleScreenConfigurationFieldChange } from "egov-ui-framework/ui-redux/screen-configuration/actions";
import { getTenantId } from "egov-ui-kit/utils/localStorageUtils";
import { httpRequest } from "../../../../ui-utils";
import { getBoundaryData } from "../../../../ui-utils/commons";
import {
  abgSearchCard,
  //mergeDownloadButton, 
  resetFields
} from "./gBmr/groupBillSearch";

import { updateAllReadings } from "./gBmr/functions";
import { searchResults, brmeterReading } from "./gBmr/searchResults";
import viewPopup from "./gBmr/viewPopup";
import welcomePopup from "./gBmr/welcomePopup";
import surveyIdEditPopup from "./gBmr/surveyIdEditPopup";
import "./index.css";

const tenantId = getTenantId();

const header = getCommonHeader({
  labelName: "Property Revenue",
  labelKey: "Property Revenue"
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
    welcomeDialog: {
      uiFramework: "custom-containers",
      componentPath: "DialogContainer",
      props: {
        open: false,
        maxWidth: "sm",
        screenKey: "bulkmeterreading",
        dialogKey: "welcomeDialog"
      },
      children: {
        popup: welcomePopup
      }
    },
    surveyDialog: {
      uiFramework: "custom-containers",
      componentPath: "DialogContainer",
      props: {
        open: false,
        maxWidth: "sm",
        screenKey: "bulkmeterreading",
        dialogKey: "surveyDialog"
      },
      children: {
        popup: surveyIdEditPopup
      }
    }
    //mergeDownloadButton
  }
};

export default abgSearchAndResult;
