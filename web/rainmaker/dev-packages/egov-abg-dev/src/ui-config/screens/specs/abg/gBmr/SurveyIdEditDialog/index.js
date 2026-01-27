import React, { Component } from "react";
import { TextField } from "components";

export default class SurveyIdEditDialog extends Component {
    constructor(props) {
        super(props);
        this.state = {
            surveyId: props.surveyId || "",
            error: ""
        };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.surveyId !== this.props.surveyId) {
            this.setState({ surveyId: this.props.surveyId || "", error: "" });
        }
    }

    handleChange = (e) => {
        this.setState({ surveyId: e.target.value, error: "" });
    };

    handleSave = () => {
        const { onSave, onClose } = this.props;
        const { surveyId } = this.state;

        if (!String(surveyId || "").trim()) {
            this.setState({ error: "Survey Id/UID is required" });
            return;
        }

        if (typeof onSave === "function") {
            onSave(String(surveyId).trim());
        }

        if (typeof onClose === "function") {
            onClose();
        }
    };

    render() {
        const { onClose, oldSurveyId, propertiesId } = this.props;
        const { surveyId, error } = this.state;

        return (
            <div style={{ padding: "20px" }}>
                <div style={{ marginBottom: "12px", color: "#555" }}>
                    <b>PropertiesId:</b> {propertiesId}
                    <br />
                    <b>Status:</b> {oldSurveyId}
                </div>

                <TextField
                    value={surveyId}
                    onChange={this.handleChange}
                    floatingLabelText="Status"
                    errorText={error}
                />

                <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                    <button
                        type="button"
                        style={{
                            flex: 1,
                            color: "#FF5722",
                            fontSize: "16px",
                            fontWeight: 500,
                            backgroundColor: "#FFF",
                            border: "1px solid #FF5722",
                            padding: "10px",
                            borderRadius: "4px",
                            cursor: "pointer"
                        }}
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        style={{
                            flex: 1,
                            color: "white",
                            fontSize: "16px",
                            fontWeight: 500,
                            backgroundColor: "#FF5722",
                            border: "none",
                            padding: "10px",
                            borderRadius: "4px",
                            cursor: "pointer"
                        }}
                        onClick={this.handleSave}
                    >
                        Map Properties
                    </button>
                </div>
            </div>
        );
    }
}
