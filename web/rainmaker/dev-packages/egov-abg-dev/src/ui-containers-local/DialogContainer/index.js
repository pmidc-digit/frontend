import React from "react";
import { connect } from "react-redux";
import get from "lodash/get";
import { Dialog, DialogContent } from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";
import { handleScreenConfigurationFieldChange as handleField } from "egov-ui-framework/ui-redux/screen-configuration/actions";

class DialogContainer extends React.Component {
  handleClose = () => {
    const { screenKey, dialogKey } = this.props;
    this.props.handleField(
      screenKey,
      `components.${dialogKey}`,
      "props.open",
      false
    );
  };

  render() {
    const { open, maxWidth, children } = this.props;

    const StyledDialog = withStyles(() => ({
      root: {
        zIndex: 13333
      }
    }))(Dialog);

    return (
      <StyledDialog open={open} maxWidth={maxWidth} onClose={this.handleClose}>
        <DialogContent children={children} />
      </StyledDialog>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { screenConfiguration } = state;
  const { screenKey, dialogKey = "adhocDialog" } = ownProps;
  const { screenConfig } = screenConfiguration;
  const open = get(
    screenConfig,
    `${screenKey}.components.${dialogKey}.props.open`
  );

  return {
    open,
    screenKey,
    screenConfig,
    dialogKey
  };
};

const mapDispatchToProps = dispatch => {
  return { handleField: (a, b, c, d) => dispatch(handleField(a, b, c, d)) };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DialogContainer);
