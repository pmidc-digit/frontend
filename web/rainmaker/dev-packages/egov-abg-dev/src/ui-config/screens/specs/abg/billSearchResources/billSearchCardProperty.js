import { getCommonCard, getCommonContainer, getCommonHeader, getCommonSubHeader, getLabel, getPattern, getTextField } from "egov-ui-framework/ui-config/screens/specs/utils";
import { handleScreenConfigurationFieldChange as handleField, prepareFinalObject } from "egov-ui-framework/ui-redux/screen-configuration/actions";
import { getTenantId, getUserInfo } from "egov-ui-kit/utils/localStorageUtils";
import { searchApiCall } from "./billSearchPropertyFunction";

// const tenantId = process.env.REACT_APP_NAME === "Employee" ?  getTenantId() : JSON.parse(getUserInfo()).permanentCity;
// console.log("tenantId--- ", tenantId);
const resetFields = (state, dispatch) => {
  const tenantId = process.env.REACT_APP_NAME === "Employee" ? getTenantId() : JSON.parse(getUserInfo()).permanentCity;
  dispatch(
    handleField(
      "billSearchproperty",
      "components.div.children.billSearchCardProperty.children.cardContent.children.searchContainer.children.ulb",
      "props.value",
      tenantId
    )
  );
  dispatch(
    handleField(
      "billSearchproperty",
      "components.div.children.billSearchCardProperty.children.cardContent.children.searchContainer.children.consumerCode",
      "props.value",
      ""
    )
  );
  dispatch(
    handleField(
      "billSearchproperty",
      "components.div.children.billSearchCardProperty.children.cardContent.children.searchContainer.children.VasikaCode",
      "props.value",
      ""
    )
  );
  dispatch(
    handleField(
      "billSearchproperty",
      "components.div.children.billSearchCardProperty.children.cardContent.children.searchContainer.children.mobileNo",
      "props.value",
      ""
    )
  );
  dispatch(
    handleField(
      "billSearchproperty",
      "components.div.children.billSearchCardProperty.children.cardContent.children.searchContainer.children.serviceCategory",
      "props.value",
      ""
    )
  );
  dispatch(
    handleField(
      "billSearchproperty",
      "components.div.children.billSearchCardProperty.children.cardContent.children.searchContainer.children.serviceCategory",
      "props.error",
      false
    )
  );
  dispatch(
    handleField(
      "billSearchproperty",
      "components.div.children.billSearchCardProperty.children.cardContent.children.searchContainer.children.serviceCategory",
      "props.helperText",
      ""
    )
  );
  // Hide statistics and table on reset
  dispatch(
    handleField(
      "billSearchproperty",
      "components.div.children.searchStatistics",
      "visible",
      false
    )
  );
  
  // Clear table data before hiding
  dispatch(
    handleField(
      "billSearchproperty",
      "components.div.children.billSearchpropertyResult",
      "props.data",
      []
    )
  );
  
  // Reset pagination state
  dispatch(
    handleField(
      "billSearchproperty",
      "components.div.children.billSearchpropertyResult",
      "props.options.page",
      0
    )
  );
  
  dispatch(
    handleField(
      "billSearchproperty",
      "components.div.children.billSearchpropertyResult",
      "props.options.count",
      0
    )
  );
  
  dispatch(
    handleField(
      "billSearchproperty",
      "components.div.children.billSearchpropertyResult",
      "visible",
      false
    )
  );
  dispatch(prepareFinalObject("searchScreen", { tenantId: tenantId ,businesService:"PT"}));
};

export const billSearchCardProperty = getCommonCard({
  header: getCommonHeader({
    labelName: "Search Property Records",
    labelKey: "ABG_SEARCH_PROPERTY_RECORDS_COMMON_HEADER"
  }),
  subheader: getCommonSubHeader({
    labelName: "Provide at least one parameter to search for property records",
    labelKey: "ABG_SEARCH_PROPERTY_RECORDS_COMMON_SUB_HEADER"
  }),
  searchContainer: getCommonContainer({
    ulb: {
      uiFramework: "custom-containers-local",
      moduleName: "egov-abg",
      componentPath: "AutosuggestContainer",
      props: {
        label: {
          labelName: "ULB",
          labelKey: "ABG_ULB_LABEL"
        },
        labelPrefix: {
          moduleName: "TENANT",
          masterName: "TENANTS"
        },
        optionLabel: "name",
        placeholder: {
          labelName: "Select ULB",
          labelKey: "ABG_ULB_PLACEHOLDER"
        },
        required: true,
        labelsFromLocalisation: true,
        // isClearable: true,
        className: "autocomplete-dropdown",
        sourceJsonPath: "searchScreenMdmsData.tenant.tenants",
        jsonPath: "searchScreen.tenantId",
        disabled: process.env.REACT_APP_NAME === "Citizen" ? false : true,
      },
      required: true,
      jsonPath: "searchScreen.tenantId",
      gridDefination: {
        xs: 12,
        sm: 4
      }
    },
    // serviceCategory: {
    //   uiFramework: "custom-containers-local",
    //   moduleName: "egov-abg",
    //   componentPath: "AutosuggestContainer",
    //   props: {
    //     label: {
    //       labelName: "Service Category",
    //       labelKey: "ABG_SERVICE_CATEGORY_LABEL"
    //     },
    //     placeholder: {
    //       labelName: "Select Service Category",
    //       labelKey: "ABG_SERVICE_CATEGORY_PLACEHOLDER"
    //     },
    //     required: true,
    //     labelsFromLocalisation: true,
    //     className: "autocomplete-dropdown",
    //     // isClearable: true,
    //     jsonPath: "searchScreen.businesService",
    //     localePrefix: {
    //       moduleName: "BillingService",
    //       masterName: "BusinessService"
    //     },
    //     sourceJsonPath: "searchScreenMdmsData.BillingService.BusinessService",
    //   },
    //   required: true,
    //   jsonPath: "searchScreen.businesService",
    //   gridDefination: {
    //     xs: 12,
    //     sm: 4
    //   },

    //   beforeFieldChange: (action, state, dispatch) => {
    //     const labelName = {
    //       labelKey: `ABG_${action.value}_CONSUMER_CODE_LABEL`,
    //       labelName: "Consumer Code"
    //     }
    //     const placeHolder = {
    //       labelKey: `ABG_${action.value}_CONSUMER_CODE_PLACEHOLDER`,
    //       labelName: "Enter Consumer Code"
    //     }
    //     dispatch(
    //       handleField(
    //         "billSearch",
    //         "components.div.children.billSearchCard.children.cardContent.children.searchContainer.children.consumerCode",
    //         "props.label",
    //         labelName
    //       )
    //     );
    //     dispatch(
    //       handleField(
    //         "billSearch",
    //         "components.div.children.billSearchCard.children.cardContent.children.searchContainer.children.consumerCode",
    //         "props.placeholders",
    //         placeHolder
    //       )
    //     );
    //   }
    // },
    VasikaCode: getTextField({
      label: {
        labelName: "Vasika No Number",
        labelKey: "ABG_Vasika_CODE_LABEL"
      },
      placeholder: {
        labelName: "Enter Vasika No Number",
        labelKey: "ABG_Vasika_NUMBER_PLACEHOLDER"
      },
      required: false,
      visible: true,
      jsonPath: "searchScreen.vasikaCode",
      gridDefination: {
        xs: 12,
        sm: 4
      }
    }),
    consumerCode: getTextField({
      label: {
        labelName: "Consumer Code",
        labelKey: "ABG_CONSUMER_CODE_LABEL"
      },
      placeholder: {
        labelName: "Enter Consumer Code",
        labelKey: "ABG_CONSUMER_CODE_PLACEHOLDER"
      },
      required: false,
      visible: true,
      jsonPath: "searchScreen.consumerCode",
      gridDefination: {
        xs: 12,
        sm: 4
      }
    }),
    // billNumber: getTextField({
    //   label: {
    //     labelName: "Bill No.",
    //     labelKey: "ABG_BILL_NUMBER_LABEL"
    //   },
    //   placeholder: {
    //     labelName: "Enter Bill No.",
    //     labelKey: "ABG_BILL_NUMBER_PLACEHOLDER"
    //   },
    //   required: false,
    //   visible: true,
    //   jsonPath: "searchScreen.billNo",
    //   gridDefination: {
    //     xs: 12,
    //     sm: 4
    //   }
    // }),
    // mobileNo: getTextField({
    //   label: {
    //     labelName: "Mobile No.",
    //     labelKey: "ABG_MOBILE_NO_LABEL"
    //   },
    //   placeholder: {
    //     labelName: "Enter Mobile No.",
    //     labelKey: "ABG_MOBILE_NO_PLACEHOLDER"
    //   },
    //   gridDefination: {
    //     xs: 12,
    //     sm: 4
    //   },
    //   iconObj: {
    //     label: "+91 |",
    //     position: "start"
    //   },
    //   required: false,
    //   pattern: getPattern("MobileNo"),
    //   errorMessage: "Invalid Mobile No..",
    //   jsonPath: "searchScreen.mobileNumber"
    // })
  }),

  buttonContainer: getCommonContainer({
    firstCont: {
      uiFramework: "custom-atoms",
      componentPath: "Div",
      gridDefination: {
        xs: 12,
        sm: 3
      }
    },
    resetButton: {
      componentPath: "Button",
      gridDefination: {
        xs: 12,
        sm: 3
        // align: "center"
      },
      props: {
        variant: "outlined",
        style: {
          color: "#2947a3",
          // backgroundColor: "#2947a3",
          border: "#2947a3 solid 1px",
          borderRadius: "2px",
          width: window.innerWidth > 480 ? "80%" : "100%",
          height: "48px"
        }
      },
      children: {
        buttonLabel: getLabel({
          labelName: "RESET",
          labelKey: "ABG_RESET_BUTTON"
        })
      },
      onClickDefination: {
        action: "condition",
        callBack: resetFields
      }
    },

    searchButton: {
      componentPath: "Button",
      gridDefination: {
        xs: 12,
        sm: 3
        // align: "center"
      },
      props: {
        variant: "contained",
        style: {
          color: "white",
          backgroundColor: "#696969",
          borderRadius: "2px",
          width: window.innerWidth > 480 ? "80%" : "100%",
          height: "48px"
        }
      },
      children: {
        buttonLabel: getLabel({
          labelName: "SEARCH",
          labelKey: "ABG_SEARCH_BUTTON"
        })
      },
      onClickDefination: {
        action: "condition",
        callBack: (state, dispatch) => {
          searchApiCall(state, dispatch);
        }
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
});
