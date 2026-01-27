import get from "lodash/get";
import {
    getCommonCard,
    getLabel,
    getTextField
} from "egov-ui-framework/ui-config/screens/specs/utils";
import { handleScreenConfigurationFieldChange } from "egov-ui-framework/ui-redux/screen-configuration/actions";
import { store } from "egov-ui-framework/ui-redux/store";

const closeDialog = () => {
    store.dispatch(
        handleScreenConfigurationFieldChange(
            "bulkmeterreading",
            "components.surveyDialog",
            "props.open",
            false
        )
    );
};

const setSurveyIdError = (error, helperText) => {
    store.dispatch(
        handleScreenConfigurationFieldChange(
            "bulkmeterreading",
            "components.surveyDialog.children.popup.children.cardContent.children.surveyId",
            "props.error",
            error
        )
    );
    store.dispatch(
        handleScreenConfigurationFieldChange(
            "bulkmeterreading",
            "components.surveyDialog.children.popup.children.cardContent.children.surveyId",
            "props.helperText",
            helperText
        )
    );
};

const onUpdate = () => {
    const state = store.getState();
    const surveyId = String(
        get(state, "screenConfiguration.preparedFinalObject.surveyIdEditPopup.surveyId", "") || ""
    ).trim();

    if (!surveyId) {
        setSurveyIdError(true, "Survey Id/UID is required");
        return;
    }

    setSurveyIdError(false, "");

    // Note: This only validates + closes. If you want API update here,
    // tell me the exact endpoint/body to call.
    closeDialog();
};

export const surveyIdEditPopup = getCommonCard({
    title: getLabel(
        {
            labelName: "Update Survey Id/UID",
            labelKey: "ABG_UPDATE_SURVEY_ID"
        },
        { style: { fontSize: "18px", fontWeight: 600, marginBottom: "8px" } }
    ),

    propertiesId: getTextField({
        label: { labelName: "Properties Id", labelKey: "ABG_PROPERTIES_ID" },
        gridDefination: { xs: 12, sm: 12 },
        jsonPath: "surveyIdEditPopup.propertiesId",
        props: {
            disabled: true
        }
    }),

    oldSurveyId: getTextField({
        label: { labelName: "Existing Survey Id/UID", labelKey: "ABG_OLD_SURVEY_ID" },
        gridDefination: { xs: 12, sm: 12 },
        jsonPath: "surveyIdEditPopup.oldSurveyId",
        props: {
            disabled: true
        }
    }),

    surveyId: getTextField({
        label: { labelName: "New Survey Id/UID", labelKey: "ABG_NEW_SURVEY_ID" },
        placeholder: { labelName: "Enter Survey Id/UID", labelKey: "ABG_ENTER_SURVEY_ID" },
        gridDefination: { xs: 12, sm: 12 },
        required: true,
        jsonPath: "surveyIdEditPopup.surveyId"
    }),

    buttonRow: {
        uiFramework: "custom-atoms",
        componentPath: "Div",
        props: {
            style: {
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
                marginTop: "20px"
            }
        },
        children: {
            cancelButton: {
                componentPath: "Button",
                props: {
                    variant: "outlined",
                    style: {
                        color: "#FE7A51",
                        border: "#FE7A51 solid 1px",
                        borderRadius: "2px"
                    }
                },
                children: {
                    label: getLabel({ labelName: "Cancel", labelKey: "CANCEL" })
                },
                onClickDefination: {
                    action: "condition",
                    callBack: closeDialog
                }
            },
            updateButton: {
                componentPath: "Button",
                props: {
                    variant: "contained",
                    style: {
                        backgroundColor: "#FE7A51",
                        color: "#fff",
                        borderRadius: "2px"
                    }
                },
                children: {
                    label: getLabel({ labelName: "Update", labelKey: "ABG_UPDATE" })
                },
                onClickDefination: {
                    action: "condition",
                    callBack: onUpdate
                }
            }
        }
    }
});

export default surveyIdEditPopup;
