import { getBreak, getCommonHeader, getLabel } from "egov-ui-framework/ui-config/screens/specs/utils";
import { handleScreenConfigurationFieldChange as handleField, prepareFinalObject } from "egov-ui-framework/ui-redux/screen-configuration/actions";
import { getQueryArg } from "egov-ui-framework/ui-utils/commons";
import { getTenantId, getUserInfo } from "egov-ui-kit/utils/localStorageUtils";
import { httpRequest } from "../../../../ui-utils";
import  {downloadbillSearchCard } from "./groupBillDownloadResource/downloadbillSearchCard";
import { billSearchResult } from "./groupBillDownloadResource/billSearchResult";
import "./index.css";
let result = [];
(JSON.parse(localStorage.getItem("user-info"))).roles.filter((item) => { result.push(item.code); });
const values = result.includes("ESEWAEMP");
const header = getCommonHeader({
  labelName: "Bill Download",
  labelKey: "ABG_BILL_DOWNLOAD"
});

const getMDMSData = async (action, state, dispatch) => {
  const tenantId = getTenantId();
  let mdmsBody = {
    MdmsCriteria: {
      tenantId: tenantId,
      moduleDetails: [
        {
          moduleName: "BillingService",
          masterDetails: [
            {
              name: "BusinessService"
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
    if (((JSON.parse(localStorage.getItem("user-info"))).roles[0].code) == "UC_COWCESS_USER" || values == true)
      payload.MdmsRes.BillingService.BusinessService = payload.MdmsRes.BillingService.BusinessService.filter(service => (service.code == "CSS.cow_cess"));

    dispatch(prepareFinalObject("searchScreenMdmsData", payload.MdmsRes));
  } catch (e) {
    console.log(e);
  }
};

const getData = async (action, state, dispatch) => {
  await getMDMSData(action, state, dispatch);
};

const billSearchAndResult = {
  uiFramework: "material-ui",
  name: "groupBillDownloads",
  beforeInitScreen: (action, state, dispatch) => {
    debugger
    getData(action, state, dispatch);
    const tenantId = process.env.REACT_APP_NAME === "Employee" ? getTenantId() : JSON.parse(getUserInfo()).permanentCity;
    if (tenantId) {
      dispatch(prepareFinalObject("searchScreen", { tenantId: tenantId }));
      //const ulbComponentJsonPath = "components.div.children.billSearchCardProperty.children.cardContent.children.searchContainer.children.ulb";
    //   const disableUlb = process.env.REACT_APP_NAME === "Citizen" ? false : true;
    // //   dispatch(
    // //     handleField(
    // //       "groupbillDownloads",
    // //       ulbComponentJsonPath,
    // //       "props.value",
    // //       tenantId
    // //     )
    // //   );
    // //   dispatch(
    // //     handleField(
    // //       "billSearch",
    // //       ulbComponentJsonPath,
    // //       "props.disabled",
    // //       disableUlb
    // //     )
    // //   );
      }

    return action;
  },
  components: {
    div: {
      uiFramework: "custom-atoms",
      componentPath: "Form",
      props: {
        className: "common-div-css",
        id: "groupbillDownload"
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
            },
            // groupBillButton: {
            //   componentPath: "Button",
            //   gridDefination: {
            //     xs: 12,
            //     sm: 6,
            //     align: "right"
            //   },
            //   visible: enableGroupBillButton,
            //   props: {
            //     variant: "contained",
            //     color: "primary",
            //     style: {
            //       color: "white",
            //       borderRadius: "2px",
            //       width: "250px",
            //       height: "48px"
            //     }
            //   },
            //   children: {
            //     ButtonLabel: getLabel({
            //       labelName: "Group Bills",
            //       labelKey: "ABG_COMMON_HEADER"
            //     })
            //   },
            //   onClickDefination: {
            //     action: "page_change",
            //     path:
            //       process.env.REACT_APP_SELF_RUNNING === "true"
            //         ? `/egov-ui-framework/abg/groupBills`
            //         : `/abg/groupBills`
            //   },
            //   visible: (process.env.REACT_APP_NAME === "Citizen" || enableGroupBillButton == false) ? false : true
            // }
          }
        },
        downloadbillSearchCard,
        breakAfterSearch: getBreak(),
        billSearchResult,
      }
    }
  }
};

export default billSearchAndResult;
