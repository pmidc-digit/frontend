// Welcome popup content used inside bulkmeterreading.components.div.children.welcomeDialog

import get from "lodash/get";
import {
    getCommonCard,
    getLabel,
    getTextField
} from "egov-ui-framework/ui-config/screens/specs/utils";
import { handleScreenConfigurationFieldChange } from "egov-ui-framework/ui-redux/screen-configuration/actions";
import { store } from "egov-ui-framework/ui-redux/store";
import surveyIdEditPopup from "./surveyIdEditPopup";

const closeWelcomeDialog = () => {
    store.dispatch(
        handleScreenConfigurationFieldChange(
            "bulkmeterreading",
            "components.welcomeDialog",
            "props.open",
            false
        )
    );
};

const setMobileFieldError = (error, helperText) => {
    store.dispatch(
        handleScreenConfigurationFieldChange(
            "bulkmeterreading",
            "components.welcomeDialog.children.popup.children.cardContent.children.mobileNumber",
            "props.error",
            error
        )
    );
    store.dispatch(
        handleScreenConfigurationFieldChange(
            "bulkmeterreading",
            "components.welcomeDialog.children.popup.children.cardContent.children.mobileNumber",
            "props.helperText",
            helperText
        )
    );
};

const onContinue = () => {
    const state = store.getState();
    const mobileNumber = String(
        get(state, "screenConfiguration.preparedFinalObject.welcomePopup.mobileNumber", "") || ""
    ).trim();

    const isValidMobile = /^\d{10}$/.test(mobileNumber);
    if (!isValidMobile) {
        setMobileFieldError(true, "Enter a valid 10 digit mobile number");
        return;
    }

    setMobileFieldError(false, "");

    // Close welcome dialog and open survey id edit dialog
    closeWelcomeDialog();
    store.dispatch(
        handleScreenConfigurationFieldChange(
            "bulkmeterreading",
            "components.surveyDialog",
            "props.open",
            true
        )
    );
};

export const welcomePopup = getCommonCard({
    title: getLabel(
        {
            labelName: "Welcome to Property Tax page",
            labelKey: "WELCOME_TO_PROPERTY_TAX_PAGE"
        },
        {
            style: { fontSize: "18px", fontWeight: 600, marginBottom: "8px" }
        }
    ),
    description: {
        uiFramework: "custom-atoms",
        componentPath: "Div",
        props: {
            style: { color: "#555", fontSize: "14px", marginBottom: "16px" }
        },
        children: {
            text: getLabel({
                labelName: "Please check your mobile number to continue.",
                labelKey: "PLEASE_CHECK_MOBILE_NUMBER"
            })
        }
    },

    mobileNumber: getTextField({
        label: {
            labelName: "Mobile Number",
            labelKey: "MOBILE_NUMBER"
        },
        placeholder: {
            labelName: "Enter 10 digit mobile number",
            labelKey: "ENTER_MOBILE_NUMBER"
        },
        gridDefination: {
            xs: 12,
            sm: 12
        },
        required: true,
        jsonPath: "welcomePopup.mobileNumber",
        props: {
            inputProps: {
                maxLength: 10
            }
        }
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
                    label: getLabel({
                        labelName: "Cancel",
                        labelKey: "CANCEL"
                    })
                },
                onClickDefination: {
                    action: "condition",
                    callBack: closeWelcomeDialog
                }
            },
            continueButton: {
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
                    label: getLabel({
                        labelName: "Continue",
                        labelKey: "CONTINUE"
                    })
                },
                onClickDefination: {
                    action: "condition",
                    callBack: onContinue
                }
            }
        }
    }
});

export default welcomePopup;
