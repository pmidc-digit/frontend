import {
  getCommonCard,
  getCommonContainer,
  getLabel, getTextField, getSelectField
} from "egov-ui-framework/ui-config/screens/specs/utils";
import { handleScreenConfigurationFieldChange as handleField } from "egov-ui-framework/ui-redux/screen-configuration/actions";
import { getTenantId, getUserInfo } from "egov-ui-kit/utils/localStorageUtils";
import { generateMultipleBill } from "../../utils/receiptPdf";
import { searchApiCall, updatesingleReading } from "./functions";

// const wsBillinData = [
//   {
//     code: "JAN 2018 - MAR 2018",
//     label: "Jan 2018 - Mar 2018"
//   },
//   {
//     code: "APRIL 2018 - JUL 2018",
//     label: "April 2018 - Jul 2018"
//   },
//   {
//     code: "AUG 2018 - NOV 2018",
//     label: "Aug 2018 - Nov 2018"
//   }
// ]

const tenantId = process.env.REACT_APP_NAME === "Employee" ? getTenantId() : JSON.parse(getUserInfo()).permanentCity;
export const resetFields = (state, dispatch) => {
  // dispatch(
  //   handleField(
  //     "ptreve",
  //     "components.div.children.abgSearchCard.children.cardContent.children.searchContainer.children.billingPeriod",
  //     "props.value",
  //     ""
  //   )
  // );
  dispatch(
    handleField(
      "ptreve",
      "components.div.children.abgSearchCard.children.cardContent.children.searchContainer.children.ulb",
      "props.value",
      tenantId
    )
  );
  dispatch(
    handleField(
      "ptreve",
      "components.div.children.abgSearchCard.children.cardContent.children.searchContainer.children.consumerId",
      "props.value",
      ""
    )
  );
  dispatch(
    handleField(
      "ptreve",
      "components.div.children.abgSearchCard.children.cardContent.children.searchContainer.children.locMohalla",
      "props.value",
      ""
    )
  );
  dispatch(
    handleField(
      "ptreve",
      "components.div.children.abgSearchCard.children.cardContent.children.searchContainer.children.locMohalla",
      "props.error",
      false
    )
  );
  dispatch(
    handleField(
      "ptreve",
      "components.div.children.abgSearchCard.children.cardContent.children.searchContainer.children.locMohalla",
      "props.helperText",
      ""
    )
  );
  dispatch(
    handleField(
      "ptreve",
      "components.div.children.abgSearchCard.children.cardContent.children.searchContainer.children.serviceCategory",
      "props.value",
      ""
    )
  );
  dispatch(
    handleField(
      "ptreve",
      "components.div.children.abgSearchCard.children.cardContent.children.searchContainer.children.serviceCategory",
      "props.error",
      false
    )
  );
  dispatch(
    handleField(
      "ptreve",
      "components.div.children.abgSearchCard.children.cardContent.children.searchContainer.children.serviceCategory",
      "props.helperText",
      ""
    )
  );
  dispatch(
    handleField(
      "ptreve",
      "components.div.children.abgSearchCard.children.cardContent.children.searchContainer.children.propertyId",
      "props.value",
      ""
    )
  );
};

export const abgSearchCard = getCommonCard({
  searchContainer: getCommonContainer(
    {
      ulb: {
        uiFramework: "custom-containers-local",
        moduleName: "egov-abg",
        componentPath: "AutosuggestContainer",
        props: {
          label: {
            labelName: "ULB",
            labelKey: "ABG_ULB_LABEL"
          },
          localePrefix: {
            moduleName: "TENANT",
            masterName: "TENANTS"
          },
          optionLabel: "name",
          placeholder: {
            labelName: "Select ULB",
            labelKey: "ABG_ULB_PLACEHOLDER"
          },
          required: true,
          value: tenantId,
          disabled: true,
          isClearable: true,
          labelsFromLocalisation: true,
          className: "autocomplete-dropdown",
          jsonPath: "searchCriteria.tenantId",
          sourceJsonPath: "searchScreenMdmsData.tenant.tenants",
        },
        required: true,
        jsonPath: "searchCriteria.tenantId",
        disabled: false,
        gridDefination: {
          xs: 12,
          sm: 4
        }
      },

      locMohalla: {
        uiFramework: "custom-containers-local",
        moduleName: "egov-abg",
        componentPath: "AutosuggestContainer",
        gridDefination: {
          xs: 12,
          sm: 4
        },
        jsonPath: "searchCriteria.locality",
        required: false,
        props: {
          className: "autocomplete-dropdown",
          label: {
            labelName: "Location/Mohalla",
            labelKey: "ABG_LOCMOHALLA_LABEL"
          },
          placeholder: {
            labelName: "Select Location/Mohalla",
            labelKey: "ABG_LOCMOHALLA_PLACEHOLDER"
          },
          jsonPath: "searchCriteria.locality",
          sourceJsonPath: "searchScreenMdmsData.localities",
          labelsFromLocalisation: true,
          required: false,
          isClearable: true,
        }
      },
      propertyId: getTextField({
        label: {
          labelName: "Property ID",
          labelKey: "ABG_PROPERTY_ID_LABEL"
        },
        placeholder: {
          labelName: "Enter Property ID",
          labelKey: "ABG_PROPERTY_ID_PLACEHOLDER"
        },
        gridDefination: {
          xs: 12,
          sm: 4
        },
        required: false,
        jsonPath: "searchCriteria.propertyId"
      })

    },
    {
      style: {
        overflow: "visible"
      }
    }
  ),

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
      resetButton: {
        componentPath: "Button",
        gridDefination: {
          xs: 12,
          sm: 3
        },
        props: {
          variant: "outlined",
          style: {
            color: "#FE7A51",
            border: "#FE7A51 solid 1px",
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
            backgroundColor: "#FE7A51",
            borderRadius: "2px",
            width: window.innerWidth > 480 ? "80%" : "100%",
            height: "48px"
          }
        },
        children: {
          buttonLabel: getLabel({
            labelName: "Search",
            labelKey: "ABG_GROUP_BILL_SEARCH_BUTTON"
          })
        },
        onClickDefination: {
          action: "condition",
          callBack: searchApiCall
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
});


