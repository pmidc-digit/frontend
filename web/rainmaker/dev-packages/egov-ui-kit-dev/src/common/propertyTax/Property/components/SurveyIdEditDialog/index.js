import React, { Component } from "react";
import { Dialog, TextField, SurveyIdField } from "components";
import Label from "egov-ui-kit/utils/translationNode";
import { httpRequest } from "egov-ui-kit/utils/api";

let SurveyIdNew;
let propertiesf;
export default class SurveyIdEditDialog extends Component {

    constructor(props) {
        super(props);
        this.state = {
            surveyId: props.surveyId || "",
            error: "",
        };
    }

    render() {
        const { open, onClose, oldSurveyId, propertiesId, properties } = this.props;
        const { surveyId, error } = this.state;
        propertiesf = properties;
        return (
            <Dialog
                open={open}
                isClose={true}

                handleClose={onClose}


                bodyStyle={{ padding: "20px" }}
            >


                <div style={{ marginBottom: "12px", color: "#555" }}>
                    <b>PropertiesId</b>{propertiesId} <b>                   Existing Survey Id/UID:</b> {oldSurveyId}
                </div>


                <TextField
                    value={surveyId}
                    onChange={this.handleChange}
                    floatingLabelText="Survey Id/UID"
                    errorText={error}
                />
                <button type="button" style={{ width: '100%', color: 'white', fontsize: '16px', fontweight: '500' }} className={"button-verify-link"} onClick={this.handleSave}>Update SurveyId</button>


            </Dialog>
        );
    }

    handleChange = (e) => {
        console.log("SurveyId value:", e.target.value);
        SurveyIdNew = e.target.value;
        console.log("aaa", propertiesf);

        this.setState({ surveyId: e.target.value, error: "" });
    };

    handleSave = async (e) => {
        alert("test z2  " + SurveyIdNew);
        const { surveyId } = this.state;
        console.log("bbb", propertiesf);
        propertiesf.creationReason = "UPDATE"

        propertiesf.surveyId = SurveyIdNew;
        console.log("ccc", propertiesf);
        let queryObject = propertiesf;
        debugger;
        try {
            const payload = await httpRequest("property-services/property/_update", "_update", [], { Properties: queryObject });
            if (!payload) {
                //this.setMessage(result.Errors[0].code, "ERROR", false);
            } else {
                // this.setMessage("PT_MOBILE_NUM_UPDATED_SUCCESS", "SUCCESS", true);
                setTimeout(() => {
                    window.location.reload();
                }, 2500);
            }

        } catch (e) {

            console.error(e)
            // toggleSnackbarAndSetText(
            //     true,
            //     {
            //         labelName: "Not authorized to access Business Service!",
            //         labelKey: "ERR_NOT_AUTHORISED_BUSINESS_SERVICE",
            //     },
            //     "error"
            // );
        }


        // if (!surveyId || surveyId.trim() === "") {
        //     this.setState({ error: "Survey Id/UID cannot be empty" });
        //     return;
        // }
        //  this.props.onSave(surveyId.trim());
    };

}
