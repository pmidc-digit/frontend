import {
  getCommonCard,
  getCommonContainer,
  getLabel, getTextField, getSelectField
} from "egov-ui-framework/ui-config/screens/specs/utils";
import { handleScreenConfigurationFieldChange as handleField, prepareFinalObject, toggleSnackbar } from "egov-ui-framework/ui-redux/screen-configuration/actions";
import { getTenantId, getUserInfo } from "egov-ui-kit/utils/localStorageUtils";
import { generateMultipleBill } from "../../utils/receiptPdf";
import { searchApiCall, updatesingleReading } from "./functions";
import { httpRequest } from "../../../../../ui-utils";
import get from 'lodash/get';
import { groupBy } from "lodash";
let localityhide = false;
let batchhide = false;
let arr = [
  {
    code: "Batch",
    value: "Batch",
  },
  { code: "Group", value: "Group" },
  {
    code: "Locality",
    value: "Locality",
  },
  {
    code: "Zone",
    value: "Zone",
  }

];

const tenantId = process.env.REACT_APP_NAME === "Employee" ? getTenantId() : JSON.parse(getUserInfo()).permanentCity;
export const resetFields = (state, dispatch) => {

  dispatch(
    handleField(
      "bulkmeterreading",
      "components.div.children.abgSearchCard.children.cardContent.children.searchContainer.children.ulb",
      "props.value",
      tenantId
    )
  );
  dispatch(
    handleField(
      "bulkmeterreading",
      "components.div.children.abgSearchCard.children.cardContent.children.searchContainer.children.batchtype",
      "props.value",
      ""
    )
  );
  dispatch(
    handleField(
      "bulkmeterreading",
      "components.div.children.abgSearchCard.children.cardContent.children.searchContainer.children.Zone",
      "props.value",
      ""
    )
  );
  dispatch(
    handleField(
      "bulkmeterreading",
      "components.div.children.abgSearchCard.children.cardContent.children.searchContainer.children.locality",
      "props.value",
      ""
    )
  );
  dispatch(
    handleField(
      "bulkmeterreading",
      "components.div.children.abgSearchCard.children.cardContent.children.searchContainer.children.batch",
      "props.value",
      ""
    )
  );
  dispatch(
    handleField(
      "bulkmeterreading",
      "components.div.children.abgSearchCard.children.cardContent.children.searchContainer.children.groUp",
      "props.value",
      ""
    )
  );
  dispatch(
    handleField(
      "bulkmeterreading",
      "components.div.children.abgSearchCard.children.cardContent.children.searchContainer.children.locMohalla",
      "props.value",
      ""
    )
  );
  dispatch(
    handleField(
      "bulkmeterreading",
      "components.div.children.abgSearchCard.children.cardContent.children.searchContainer.children.locMohalla",
      "props.value",
      ""
    )
  );
  dispatch(
    handleField(
      "bulkmeterreading",
      "components.div.children.abgSearchCard.children.cardContent.children.searchContainer.children.locMohalla",
      "props.error",
      false
    )
  );
  dispatch(
    handleField(
      "bulkmeterreading",
      "components.div.children.abgSearchCard.children.cardContent.children.searchContainer.children.locMohalla",
      "props.helperText",
      ""
    )
  );
  dispatch(
    handleField(
      "bulkmeterreading",
      "components.div.children.abgSearchCard.children.cardContent.children.searchContainer.children.serviceCategory",
      "props.value",
      ""
    )
  );
  dispatch(
    handleField(
      "bulkmeterreading",
      "components.div.children.abgSearchCard.children.cardContent.children.searchContainer.children.serviceCategory",
      "props.error",
      false
    )
  );
  dispatch(
    handleField(
      "bulkmeterreading",
      "components.div.children.abgSearchCard.children.cardContent.children.searchContainer.children.serviceCategory",
      "props.helperText",
      ""
    )
  );
  //"applyScreenMdmsData.tenant.batchs", zonecode.children || []));
  dispatch(prepareFinalObject("applyScreenMdmsData.tenant.batchs", ""));
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
          required: false,
          value: tenantId,
          isDisabled: getTenantId() === "pb.punjab" ? false : true,
          readOnly: getTenantId() === "pb.punjab" ? false : true,
          isClearable: false,
          labelsFromLocalisation: getTenantId() === "pb.punjab" ? false : true,
          className: "autocomplete-dropdown",
          jsonPath: "searchCriteria.tenantId",
          sourceJsonPath: "searchScreenMdmsData.tenant.tenants",

        },
        afterFieldChange: async (action, state, dispatch) => {
          let selecttetentid = await get(state, "screenConfiguration.preparedFinalObject.searchCriteria.tenantId");

          if (true) {
            try {
              let response = await httpRequest(
                "post",
                "/egov-location/location/v11/boundarys/_search?hierarchyTypeCode=REVENUE&boundaryType=Locality",
                "_search",
                [{ key: "tenantId", value: selecttetentid }],
                {}
              );
              let mohallaDataArray = [];
              let localitysar = [];
              let mohallaDataRow = null;
              let name, code;
              response.TenantBoundary[0].boundary.map((element, index) => {

                mohallaDataRow = { "code": element.code, "name": element.name };
                mohallaDataArray.push(mohallaDataRow);

              });

              dispatch(prepareFinalObject("searchScreenMdmsData.localities", mohallaDataArray));

            } catch (e) {
              console.log(e);
            }
          }


        },
        required: false,
        jsonPath: "searchCriteria.tenantId",
        disabled: true,
        gridDefination: {
          xs: 12,
          sm: 3
        }
      },
      batchtype: {
        uiFramework: "custom-containers-local",
        moduleName: "egov-abg",
        componentPath: "AutosuggestContainer",
        jsonPath: "searchCriteria.batchtype",
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
          data: arr,

          className: "autocomplete-dropdown",
          jsonPath: "searchCriteria.batchtype",

        },
        afterFieldChange: async (action, state, dispatch) => {


          let ConectionCategory = await get(state, "screenConfiguration.preparedFinalObject.searchCriteria.batchtype");
          if (ConectionCategory == "Batch") {
            try {
              let payload = await httpRequest(
                "post",
                "/egov-location/location/v11/boundarys/_search?hierarchyTypeCode=REVENUE&boundaryType=Block",
                "_search",
                [{ key: "tenantId", value: getTenantId() }],
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
              dispatch(prepareFinalObject("applyScreenMdmsData.tenant.mohaladata", ""));
              dispatch(prepareFinalObject("applyScreenMdmsData.tenant.groups", ""));
              dispatch(prepareFinalObject("applyScreenMdmsData.tenant.zone", ""));
            } catch (e) {
              console.log(e);
            }
          }
          else if (ConectionCategory == "Group") {
            let mdmsBody = {
              MdmsCriteria: {
                tenantId: getTenantId(),
                moduleDetails: [
                  {
                    moduleName: "ws-services-masters",
                    masterDetails: [{ name: "groups" }]
                  }
                ]
              }
            };
            try {
              let payload = await httpRequest(
                "post",
                "/egov-mdms-service/v1/_search",
                "_search",
                [],
                mdmsBody

              );
              payload = payload.MdmsRes['ws-services-masters'];
              let groupsar = [];
              const batches =
                payload &&
                payload.groups.filter((item) => {
                  groupsar.push({ item });
                  return groupsar;
                }, []);
              dispatch(
                prepareFinalObject(
                  "applyScreenMdmsData.tenant.groups",
                  batches
                )
              );
              dispatch(prepareFinalObject("applyScreenMdmsData.tenant.mohaladata", ""));
              dispatch(prepareFinalObject("applyScreenMdmsData.tenant.batchs", ""));
              dispatch(prepareFinalObject("applyScreenMdmsData.tenant.zone", ""));
            } catch (e) {
              console.log(e);
            }
          }
          else if (ConectionCategory == "Zone") {
            try {
              let payload = await httpRequest(
                "post",
                "/egov-location/location/v11/boundarys/_search?hierarchyTypeCode=REVENUE&boundaryType=Zone",
                "_search",
                [{ key: "tenantId", value: getTenantId() }],
                {}
              );
              let batchar = [];
              const Zones =
                payload &&
                payload.TenantBoundary[0] &&
                payload.TenantBoundary[0].boundary &&
                payload.TenantBoundary[0].boundary.filter((item) => {
                  batchar.push({ item });
                  return batchar;
                }, []);
              dispatch(prepareFinalObject("applyScreenMdmsData.tenant.zone", Zones));
              dispatch(prepareFinalObject("applyScreenMdmsData.tenant.mohaladata", ""));
              dispatch(prepareFinalObject("applyScreenMdmsData.tenant.groups", ""));
              dispatch(prepareFinalObject("applyScreenMdmsData.tenant.batchs", ""));

            } catch (e) {
              console.log(e);
            }
          }
          else {
            //locality

            let response = await httpRequest(
              "post",
              "/egov-location/location/v11/boundarys/_search?hierarchyTypeCode=REVENUE&boundaryType=Locality",
              "_search",
              [{ key: "tenantId", value: getTenantId() }],
              {}
            );
            let mohallaDataArray = [];
            let mohallaDataRow = null;
            let name, code;
            response.TenantBoundary[0].boundary.map((element, index) => {
              name = element.name + "( " + element.code + " )";
              code = element.code;
              mohallaDataRow = {
                "code": code,
                "name": name
              };
              mohallaDataArray.push(mohallaDataRow);

            });

            dispatch(prepareFinalObject("applyScreenMdmsData.tenant.mohaladata", mohallaDataArray));
            dispatch(
              prepareFinalObject(
                "applyScreenMdmsData.tenant.batchs",
                ""
              )

            );
            dispatch(
              prepareFinalObject(
                "applyScreenMdmsData.tenant.groups",
                ""
              )
            );
            dispatch(prepareFinalObject("applyScreenMdmsData.tenant.zone", ""));
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
      Zone: {
        uiFramework: "custom-containers-local",
        moduleName: "egov-abg",
        componentPath: "AutosuggestContainer",
        jsonPath: "searchCriteria.zone",
        props: {
          label: { labelName: "Zone", labelKey: "Zone" },
          placeholder: { labelName: "Select Zone", labelKey: "Select Zone" },
          optionLabel: "name",
          required: false,
          labelsFromLocalisation: false,
          className: "autocomplete-dropdown",
          sourceJsonPath: "applyScreenMdmsData.tenant.zone",
          jsonPath: "searchCriteria.zone",

        },
        required: false,

        afterFieldChange: async (action, state, dispatch) => {
          const allzons =
            get(
              state,
              "screenConfiguration.preparedFinalObject.applyScreenMdmsData.tenant.zone",
              []
            ) || [];

          const selectzone = get(
            state,
            "screenConfiguration.preparedFinalObject.searchCriteria.zone"
          );

          let zonecode = allzons.find(
            item => item.code === selectzone


          );
          zonecode = zonecode ? zonecode.children : [];
          dispatch(
            prepareFinalObject(
              "applyScreenMdmsData.tenant.batchs",
              zonecode || []
            )
          );

        },
        gridDefination: {
          xs: 12,
          sm: 3
        }
      },
      batch: {
        uiFramework: "custom-containers-local",
        moduleName: "egov-abg",
        componentPath: "AutosuggestContainer",
        sourceJsonPath: "applyScreenMdmsData.tenant.batchs",
        jsonPath: "searchCriteria.batch",
        props: {
          label: { labelName: "Batch", labelKey: "Batch" },
          placeholder: { labelName: "Select Batch", labelKey: "Select Batch" },
          optionLabel: "name",
          required: false,
          labelsFromLocalisation: false,
          className: "autocomplete-dropdown",
          sourceJsonPath: "applyScreenMdmsData.tenant.batchs",
          jsonPath: "searchCriteria.batch",

        },
        required: false,
        afterFieldChange: async (action, state, dispatch) => {

          let allbatches = await get(state, "screenConfiguration.preparedFinalObject.applyScreenMdmsData.tenant.batchs");
          let selectbatch = await get(state, "screenConfiguration.preparedFinalObject.searchCriteria.batch");
          let localitycode = allbatches.filter(item => {
            if (item.code === selectbatch) {
              return item.children;
            }
          });
          localitycode =
            localitycode.length > 0
              ? localitycode[0].children || []
              : [];
          dispatch(prepareFinalObject("applyScreenMdmsData.tenant.mohaladata", localitycode || []));
        },
        gridDefination: {
          xs: 12,
          sm: 3
        }
      },
      locality: {
        uiFramework: "custom-containers-local",
        moduleName: "egov-abg",
        componentPath: "AutosuggestContainer",
        jsonPath: "searchCriteria.locality",
        props: {
          label: { labelName: "Locality", labelKey: "Locality" },
          placeholder: { labelName: "Select maholla", labelKey: "WS_GENERATE_BILL_LOCALITY_PLACEHOLDER" },
          optionLabel: "name",
          required: false,
          labelsFromLocalisation: false,
          className: "autocomplete-dropdown",
          sourceJsonPath: "applyScreenMdmsData.tenant.mohaladata",
          jsonPath: "searchCriteria.locality",

        },
        required: false,
        gridDefination: {
          xs: 12,
          sm: 3
        }
      },

      groUp: {
        uiFramework: "custom-containers-local",
        moduleName: "egov-abg",
        componentPath: "AutosuggestContainer",
        sourceJsonPath: "applyScreenMdmsData.tenant.groups",
        jsonPath: "searchCriteria.group",
        props: {
          label: { labelName: "Group", labelKey: "Group" },
          placeholder: { labelName: "Select Group", labelKey: "Select Group" },
          optionLabel: "name",
          required: false,
          labelsFromLocalisation: false,
          className: "autocomplete-dropdown",
          sourceJsonPath: "applyScreenMdmsData.tenant.groups",
          jsonPath: "searchCriteria.group",

        },
        required: false,
        gridDefination: {
          xs: 12,
          sm: 3
        }
      },


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


