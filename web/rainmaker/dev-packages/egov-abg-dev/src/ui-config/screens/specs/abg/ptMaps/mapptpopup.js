// Popup content used inside bulkmeterreading.components.div.children.viewDialog

import get from "lodash/get";
import {
    getCommonContainer,
    getTextField,
    getLabel
} from "egov-ui-framework/ui-config/screens/specs/utils";
import { handleScreenConfigurationFieldChange } from "egov-ui-framework/ui-redux/screen-configuration/actions";
import { store } from "egov-ui-framework/ui-redux/store";

const closeDialog = () => {
    store.dispatch(
        handleScreenConfigurationFieldChange(
            "bulkmeterreading",
            "components.div.children.viewDialog",
            "props.open",
            false
        )
    );
};

const onUpdateSurveyId = () => {
    // TODO: call your update API here if needed, then close
    closeDialog();
};

export const mapptpopup = getCommonContainer({
    headerRow: {
        uiFramework: "custom-atoms",
        componentPath: "Div",
        props: {
            style: {
                marginBottom: "12px",
                color: "#555",
                fontSize: "14px"
            }
        },
        children: {
            propIdLabel: getLabel({
                labelName: "PropertiesId",
                labelKey: "PROPERTIES_ID_LABEL"
            }, {
                style: { fontWeight: "bold", marginRight: "8px", display: "inline-block" }
            }),
            propIdValue: getLabel({
                jsonPath: "mapptpopup.consumerId"
            }, {
                style: { marginRight: "16px", display: "inline-block" }
            }),
            surveyIdLabel: getLabel({
                labelName: "Existing Survey Id/UID:",
                labelKey: "EXISTING_SURVEY_ID_LABEL"
            }, {
                style: { fontWeight: "bold", marginRight: "8px", display: "inline-block" }
            }),
            surveyIdValue: getLabel({
                jsonPath: "mapptpopup.status"
            }, {
                style: { display: "inline-block" }
            })
        }
    },

    surveyField: getTextField({
        label: {
            labelName: "Survey Id/UID",
            labelKey: "SURVEY_ID_UID_LABEL"
        },
        placeholder: {
            labelName: "Survey Id/UID",
            labelKey: "SURVEY_ID_UID_PLACEHOLDER"
        },
        gridDefination: {
            xs: 12,
            sm: 12
        },
        fullWidth: true,
        jsonPath: "mapptpopup.newSurveyId"
    }),

    updateButtonWrapper: {
        uiFramework: "custom-atoms",
        componentPath: "Div",
        props: {
            style: { marginTop: "24px" }
        },
        children: {
            updateButton: {
                componentPath: "Button",
                props: {
                    variant: "contained",
                    style: {
                        width: "100%",
                        height: "48px",
                        backgroundColor: "#FE7A51",
                        color: "#fff",
                        borderRadius: "2px"
                    }
                },
                children: {
                    label: getLabel({
                        labelName: "Update SurveyId",
                        labelKey: "UPDATE_SURVEY_ID_LABEL"
                    })
                },
                onClickDefination: {
                    action: "condition",
                    callBack: onUpdateSurveyId
                }
            }
        }
    }
});

export default mapptpopup;
