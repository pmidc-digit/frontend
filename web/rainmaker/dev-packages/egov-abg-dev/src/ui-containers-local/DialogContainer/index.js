import React from "react";
import { connect } from "react-redux";
import get from "lodash/get";
import { Dialog, DialogContent } from "@material-ui/core";
import { handleScreenConfigurationFieldChange as handleField, prepareFinalObject } from "egov-ui-framework/ui-redux/screen-configuration/actions";
import { Dialog as EgovDialog } from "components";
import LabelContainer from "egov-ui-framework/ui-containers/LabelContainer";

class DialogContainer extends React.Component {
  handleClose = () => {
    const { screenKey } = this.props;
    this.props.handleField(
      screenKey,
      `components.adhocDialog`,
      "props.open",
      false
    );
  };
  closeBatchJobModal = () => {
    this.props.closeBatchJob();
  };

  render() {
    const { open, maxWidth, children, batchJobOpen, batchMessage, batchJobId } = this.props;
    return (
      <React.Fragment>
        <Dialog open={open} maxWidth={maxWidth} onClose={this.handleClose}>
          <DialogContent children={children} />
        </Dialog>
        <EgovDialog
          open={batchJobOpen}
          isClose={true}
          title={<div style={{ color: "#484848", fontSize: "16px", fontWeight: 600, textAlign: "center", background: "#f7f7f7", lineHeight: "42px" }}><LabelContainer labelKey="BATCH_JOB_SUCCESS_HEADER" labelName="Batch Job Submitted Successfully" /></div>}
          handleClose={this.closeBatchJobModal}
          titleStyle={{ padding: 0, backgroundColor: "#f7f7f7" }}
          bodyStyle={{ padding: "0% 2% 2% 2%", backgroundColor: "white" }}
        >
          <div style={{ padding: "10px", textAlign: "center" }}>
            {batchMessage && <div style={{ fontSize: "14px", marginBottom: "8px" }}>{batchMessage}</div>}
            {batchJobId && <div style={{ color: "#484848", fontSize: "13px" }}><strong>Job ID:</strong> {batchJobId}</div>}
          </div>
          <div style={{ textAlign: "center" }}>
            <button type="button" style={{ width: "100%", marginTop: "10px", color: "white", fontWeight: 500 }} className="button-verify-link" onClick={this.closeBatchJobModal}>OK</button>
          </div>
        </EgovDialog>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { screenConfiguration } = state;
  const { screenKey } = ownProps;
  const { screenConfig, preparedFinalObject } = screenConfiguration;
  const open = get(
    screenConfig,
    `${screenKey}.components.adhocDialog.props.open`,
  );

  const batchJobModal = get(preparedFinalObject, "batchJobModal", {});
  return {
    open,
    screenKey,
    screenConfig,
    batchJobOpen: !!batchJobModal.open,
    batchMessage: batchJobModal.message || "",
    batchJobId: batchJobModal.jobId || "",
  };
};

const mapDispatchToProps = dispatch => {
  return { handleField: (a, b, c, d) => dispatch(handleField(a, b, c, d)), closeBatchJob: () => dispatch(prepareFinalObject("batchJobModal", { open: false, message: "", jobId: "" })) };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DialogContainer);
