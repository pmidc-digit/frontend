import {
  getCommonCard,
  getCommonTitle,
  getSelectField,
  getCommonContainer,
  getLabel
} from "egov-ui-framework/ui-config/screens/specs/utils";
import { getUserInfo, getTenantIdCommon } from "egov-ui-kit/utils/localStorageUtils";
import { handleScreenConfigurationFieldChange as handleField, toggleSnackbar, prepareFinalObject } from "egov-ui-framework/ui-redux/screen-configuration/actions";
import { generateBillApiCall, searchBillApiCall } from "../generateBillResource/functions"
import "./index.css";
import { httpRequest } from "../../../../../ui-utils";
let localityhide = false;
let batchhide = false;
export const createBill = getCommonCard({

  subHeader: getCommonTitle({
    label: "Generate Bill"
  },
    {
      style: {
        marginBottom: 8
      }
    }
  ),
  wnsGenerateBill: getCommonContainer({


    //  ---------------------------------------------------------------------------------------
    //             Connection Type drop down
    //-----------------------------------------------------------------------------------------
    applicationtype: {
      uiFramework: "custom-containers-local",
      moduleName: "egov-wns",
      componentPath: "AutosuggestContainer",
      jsonPath: "generateBillScreen.transactionType",
      props: {
        label: {
          labelName: "Connection Type",
          labelKey: "WS_GENERATE_BILL_CONNECTION_TYPE_LABEL"
        },
        labelPrefix: {
          moduleName: "TENANT",
          masterName: "TENANTS"
        },
        optionLabel: "name",
        placeholder: {
          labelName: "Connection Type",
          labelKey: "WS_GENERATE_BILL_CONNECTION_TYPE_PLACEHOLDER"
        },
        required: true,
        labelsFromLocalisation: true,
        data: [
          {
            code: "Water",
            value: "WS",
          },
          {
            code: "Sewerage",
            value: "SW",
          }

        ],

        className: "autocomplete-dropdown",
        jsonPath: "generateBillScreen.transactionType",

      },
      required: true,

      gridDefination: {
        xs: 12,
        sm: 3
      }
    },
    batchtype: {
      uiFramework: "custom-containers-local",
      moduleName: "egov-wns",
      componentPath: "AutosuggestContainer",
      jsonPath: "generateBillScreen.batchtype",
      props: {
        label: {
          labelName: "select Batch or Locality",
          labelKey: "select Batch or Locality"
        },
        labelPrefix: {
          moduleName: "TENANT",
          masterName: "TENANTS"
        },
        optionLabel: "name",
        placeholder: {
          labelName: "Select Batch or Locality",
          labelKey: "Select Batch or Locality"
        },
        required: true,
        labelsFromLocalisation: true,
        data: [
          {
            code: "Batch",
            value: "Batch",
          },
          {
            code: "Locality",
            value: "Locality",
          }

        ],

        className: "autocomplete-dropdown",
        jsonPath: "generateBillScreen.batchtype",

      },
      beforeFieldChange: async (action, state, dispatch) => {


        try {
          let payload = await httpRequest(
            "post",
            "/egov-location/location/v11/boundarys/_search?hierarchyTypeCode=REVENUE&boundaryType=Block",
            "_search",
            [{ key: "tenantId", value: getTenantIdCommon() }],
            {}
          );
          let batchar = [];
          const batches =
            payload &&
            payload.TenantBoundary[0] &&
            payload.TenantBoundary[0].boundary &&
            payload.TenantBoundary[0].boundary.filter((item) => {
              batchar.push({ item });
              return batchar;
            }, []);
          dispatch(
            prepareFinalObject(
              "applyScreenMdmsData.tenant.batchs",
              batches
            )
          );
          dispatch(
            handleField(
              "apply",
              "components.div.children.formwizardSecondStep.children.propertyLocationDetails.children.cardContent.children.propertyDetailsConatiner.children.propertybatches",
              "props.suggestions",
              batches
            )
          );

        } catch (e) {
          console.log(e);
        }
      },
      required: false,

      gridDefination: {
        xs: 12,
        sm: 3
      }
    },
    //---------------------------------------------------------------------------------------
    //             locality drop down
    //-----------------------------------------------------------------------------------------
    locality: {
      uiFramework: "custom-containers-local",
      moduleName: "egov-wns",
      componentPath: "AutosuggestContainer",
      jsonPath: "generateBillScreen.mohallaData",
      props: {
        label: { labelName: "Locality", labelKey: "Locality" },
        placeholder: { labelName: "Select maholla", labelKey: "WS_GENERATE_BILL_LOCALITY_PLACEHOLDER" },
        optionLabel: "name",
        required: false,
        labelsFromLocalisation: true,
        className: "autocomplete-dropdown",
        sourceJsonPath: "mohallaData",
        jsonPath: "generateBillScreen.mohallaData",

      },
      required: false,
      gridDefination: {
        xs: 12,
        sm: 3
      }
    },
    batch: {
      uiFramework: "custom-containers-local",
      moduleName: "egov-wns",
      componentPath: "AutosuggestContainer",
      sourceJsonPath: "applyScreenMdmsData.tenant.batchs",
      jsonPath: "generateBillScreen.batch",
      props: {
        label: { labelName: "Batch", labelKey: "Batch" },
        placeholder: { labelName: "Select Batch", labelKey: "Select Batch" },
        optionLabel: "name",
        required: false,
        labelsFromLocalisation: true,
        className: "autocomplete-dropdown",
        sourceJsonPath: "applyScreenMdmsData.tenant.batchs",
        jsonPath: "generateBillScreen.batch",

      },
      required: false,
      gridDefination: {
        xs: 12,
        sm: 3
      }
    },

  }),
  //---------------------------------------------------------------------------------------
  //             Reset Button and Submit Button
  //-----------------------------------------------------------------------------------------
  button: getCommonContainer({
    buttonContainer: getCommonContainer({
      resetButton: {
        componentPath: "Button",
        gridDefination: { xs: 12, sm: 3 },
        props: {
          variant: "outlined",
          style: {
            color: "rgba(0, 0, 0, 0.6000000238418579)",
            borderColor: "rgba(0, 0, 0, 0.6000000238418579)",
            width: "220px",
            height: "48px",
            margin: "28px",
            float: "right"
          }
        },
        children: { buttonLabel: getLabel({ labelKey: "WS_SEARCH_CONNECTION_SEARCH_BUTTON" }) },
        onClickDefination: {
          action: "condition",
          callBack: searchBillApiCall
        }
      },

      //---------------------------------------------------------------------------------------
      //             Generate Bill  Button
      //-----------------------------------------------------------------------------------------
      searchButton: {
        componentPath: "Button",
        gridDefination: { xs: 12, sm: 4 },
        props: {
          variant: "contained",
          style: {
            color: "white",
            margin: "28px",
            backgroundColor: "rgba(0, 0, 0, 0.6000000238418579)",
            borderRadius: "2px",
            width: "220px",
            height: "48px",
            float: "left"
          }
        },
        children: { buttonLabel: getLabel({ labelKey: "WS_GENERATE_BILL_GENERATE_BUTTON" }) },
        onClickDefination: {

          action: "condition",
          callBack: generateBillApiCall
        }
      },
    })


  }),


});



