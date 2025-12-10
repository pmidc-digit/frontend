import get from "lodash/get";
import { handleScreenConfigurationFieldChange as handleField, prepareFinalObject } from "egov-ui-framework/ui-redux/screen-configuration/actions";
import { toggleSnackbar } from "egov-ui-framework/ui-redux/screen-configuration/actions";
import { getPropertyResults, isActiveProperty, showHideFieldsFirstStep } from "../../../../../ui-utils/commons";
import { getUserInfo, getTenantIdCommon } from "egov-ui-kit/utils/localStorageUtils";
import { httpRequest } from "../../../../../ui-utils/api";
import store from "ui-redux/store";
import set from 'lodash/set';

import { getQueryArg, validateFields } from "egov-ui-framework/ui-utils/commons";
import { getQueryRedirectUrl } from "../searchResource/searchResults";
import { setRoute } from "egov-ui-framework/ui-redux/app/actions";

export const propertySearchApiCall = async (state, dispatch) => {
  debugger;
  showHideFields(dispatch, false);
  let tenantId = getTenantIdCommon();
  let queryObject = [{ key: "tenantId", value: tenantId }];
  let searchScreenObject = get(state.screenConfiguration.preparedFinalObject, "searchScreen", {});

  dispatch(
    handleField(
      "apply",
      "components.div.children.formwizardFirstStep.children.ownerDetails.children.cardContent.children.ownerDetail.children.cardContent.children.headerDiv",
      "props.items",
      []
    )
  );
  dispatch(
    handleField(
      "apply",
      "components.div.children.formwizardFirstStep.children.connectionHolderDetails.children.cardContent.children.holderDetails.children.headerDiv",
      "props.items",
      []
    )
  );
  dispatch(
    prepareFinalObject(
      "applyScreen.property",
      {}
    )
  );
  const propertyNo = (get(searchScreenObject, "propertyIds", "") || "").trim();
  propertyNo = propertyNo.split("-");
  if (tenantId != "pb.ludhiana") {

    if (
      Object.keys(searchScreenObject).length == 0 ||
      Object.values(searchScreenObject).every(x => x === "")
    ) {
      dispatch(toggleSnackbar(true, { labelKey: "WS_FILL_REQUIRED_FIELDS", labelName: "Please fill required details" }, "warning"));


    }
    else {
      for (var key in searchScreenObject) {
        if (searchScreenObject.hasOwnProperty(key) && searchScreenObject[key].trim() !== "") {
          queryObject.push({ key: key, value: searchScreenObject[key].trim() });
        }
      }
      try {
        let allowCitizenToSearchOtherProperties = get(
          state
            .screenConfiguration
            .preparedFinalObject
            .applyScreenMdmsData["ws-services-masters"],
          "PropertySearch", []
        )
          .map(a => a.code === "allowCitizenToUseAnyProperty")[0];
        if (
          process.env.REACT_APP_NAME === "Citizen" &&
          !allowCitizenToSearchOtherProperties
        ) {
          queryObject.push({ key: "mobileNumber", value: JSON.parse(getUserInfo()).mobileNumber })
        }
        let response = await getPropertyResults(queryObject, dispatch);
        if (response && response.Properties.length > 0) {
          let propertyData = response.Properties[0];
          if (!isActiveProperty(propertyData)) {
            dispatch(toggleSnackbar(true, { labelKey: `ERR_WS_PROP_STATUS_${propertyData.status}`, labelName: `Property Status is ${propertyData.status}` }, "warning"));
            showHideFieldsFirstStep(dispatch, propertyData.propertyId, false);
            dispatch(prepareFinalObject("applyScreen.property", propertyData))
          } else {
            let contractedCorAddress = "";

            if (propertyData.address.doorNo !== null && propertyData.address.doorNo !== "") {
              contractedCorAddress += propertyData.address.doorNo + ", ";
            }
            if (propertyData.address.buildingName !== null && propertyData.address.buildingName !== "") {
              contractedCorAddress += propertyData.address.buildingName + ", ";
            }
            contractedCorAddress += propertyData.address.locality.name + ", " + propertyData.address.city;

            for (var i = 0; i < propertyData.owners.length; i++) {
              if (propertyData.owners[i].correspondenceAddress == 'NA' || propertyData.owners[i].correspondenceAddress == null || propertyData.owners[i].correspondenceAddress == "") {
                if (propertyData.owners[i].permanentAddress == 'NA' || propertyData.owners[i].permanentAddress == null || propertyData.owners[i].permanentAddress == "") {
                  propertyData.owners[i].correspondenceAddress = contractedCorAddress;
                } else {
                  propertyData.owners[i].correspondenceAddress = propertyData.owners[i].permanentAddress;
                }
              }
              if (propertyData && propertyData.owners && propertyData.owners.length > 0) {
                propertyData.owners = propertyData.owners.filter(owner => owner.status == "ACTIVE");
              }
            }
            if (propertyData.units == "NA" && propertyData.additionalDetails && propertyData.additionalDetails.subUsageCategory) {
              propertyData.units = [];
              propertyData.units.push({ usageCategory: propertyData.additionalDetails.subUsageCategory })
            }
            dispatch(prepareFinalObject("applyScreen.property", propertyData))
            showHideFields(dispatch, true);
          }
        } else {
          showHideFields(dispatch, false);
          dispatch(toggleSnackbar(true, { labelKey: "ERR_WS_PROP_NOT_FOUND", labelName: "No Property records found" }, "warning"));
        }
      } catch (err) {
        showHideFields(dispatch, false);
        console.log(err)
      }
    }
  }
  else {
    let propertyldh;
    try {
      const uidNo = (get(searchScreenObject, "propertyIds", "") || "").trim();
      if (!uidNo) {
        dispatch(toggleSnackbar(true, { labelKey: "WS_FILL_REQUIRED_FIELDS", labelName: "Please provide Property UID" }, "warning"));
        showHideFields(dispatch, false);
        return;
      }
      const response = await httpRequest(
        "get",
        `/property-services/api/fetch?ulb=MCL&uidNo=${encodeURIComponent(uidNo)}`,
        "_search",
        []
      );

      console.log("fetch API response", response);

      if (response && response.Record) {

        propertyldh = response.Record;
      } else {
        dispatch(toggleSnackbar(true, { labelKey: "ERR_WS_PROP_NOT_FOUND", labelName: "No Property records found" }, "warning"));
        showHideFields(dispatch, false);
      }
    } catch (err) {
      console.error(err);
      dispatch(toggleSnackbar(true, { labelKey: "ERR_FETCH_FAILED", labelName: "Failed to fetch property" }, "error"));
      showHideFields(dispatch, false);
    }
    let propertyPayload = {
      "address": {
        "city": "ludhiana",
        "locality": {
          "code": "Ldh_1"
        },
        "doorNo": propertyldh.PropertyNo,
        "buildingName": propertyldh.PropertyNo + ", " + propertyldh.ColonyName,
      },
      "propertyType": "BUILTUP.INDEPENDENTPROPERTY",
      "subUsageCategory": "",
      "landArea": propertyldh.PropertyArea,
      "owners": [
        {
          "mobileNumber": propertyldh.MobileNo,
          "name": propertyldh.OwnerName,
          "correspondenceAddress": propertyldh.PropertyNo + ", " + propertyldh.OwnerName + ", " + propertyldh.ColonyName + ", " + propertyldh.Block + ", " + propertyldh.Zone,
          "fatherOrHusbandName": propertyldh.FatherName,
          "relationship": "FATHER",
          "gender": "MALE",
          "ownerType": "NONE",
          "sameAsPeropertyAddress": true,
          "status": "ACTIVE"
        }
      ],
      "superBuiltUpArea": propertyldh.CoveredArea,
      "usageCategory": (propertyldh.PropertyType || "").toString().trim().toUpperCase(),
      "surveyId": "",
      "ownershipCategory": "INDIVIDUAL.SINGLEOWNER",
      "channel": "SYSTEM",
      "source": "WATER_CHARGES",
      "noOfFloors": 1,
      "tenantId": "pb.ludhiana",
      "additionalDetails": {
        "isRainwaterHarvesting": false,
        "subUsageCategory": ""
      },
      "creationReason": "CREATE"
    }
    debugger;
    let payload = null;

    payload = await httpRequest(
      "post",
      "/property-services/property/_create",
      "_update",
      [],
      { Property: propertyPayload }

    );

    console.log("payload", payload);
    if (payload.Properties && payload.Properties.length > 0) {
      propertyPayload = payload.Properties[0];
      let isFromWorkflowDetails = {
        action: "SUBMIT",
        assignes: null,
        businessId: propertyPayload.propertyId,
        businessService: "PT.CREATEWITHWNS",
        comment: null,
        documents: null,
        moduleName: "PT",
        state: null,
        tenantId: propertyPayload.tenantId
      };
      set(propertyPayload, "workflow", isFromWorkflowDetails);
      payload.Properties[0].creationReason = 'UPDATE';
      payload = await httpRequest(
        "post",
        "/property-services/property/_update",
        "_update",
        [],
        { Property: propertyPayload }
      );
      if (payload) {
        setTimeout(() => {
          // const isMode = getQueryArg(window.location.href, "mode");
          // if (isMode === "MODIFY") {
          //   store.dispatch(
          //     setRoute(`${getQueryRedirectUrl()}&propertyId=${payload.Properties[0].propertyId}`)
          //   )
          // } else {
          store.dispatch(
            setRoute(`${getQueryRedirectUrl()}?propertyId=${payload.Properties[0].propertyId}&tenantId=${propertyPayload.tenantId}`)
          )

          location.reload();
          // }
        }, 3000);
      }
    }
  }
}

const showHideFields = (dispatch, value) => {
  dispatch(
    handleField(
      "apply",
      "components.div.children.formwizardFirstStep.children.IDDetails.children.cardContent.children.propertyIDDetails",
      "visible",
      value
    )
  );
  dispatch(
    handleField(
      "apply",
      "components.div.children.formwizardFirstStep.children.Details",
      "visible",
      value
    )
  );
  dispatch(
    handleField(
      "apply",
      "components.div.children.formwizardFirstStep.children.ownerDetails",
      "visible",
      value
    )
  );
  dispatch(
    handleField(
      "apply",
      "components.div.children.formwizardFirstStep.children.connectionHolderDetails",
      "visible",
      value
    )
  );
}