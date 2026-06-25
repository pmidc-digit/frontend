import React from "react";
import { LabelContainer } from "egov-ui-framework/ui-containers";

const styles = {
  // backgroundColor: "#2947a3",
  color: "rgba(0, 0, 0, 0.75)",
  marginTop: "19px",
  paddingRight: "19px",
  textAlign: "center",
  verticalAlign: "middle",
  lineHeight: "35px",
  fontSize: "16px"
};

function ApplicationNoContainer(props) {
  const { number, label } = props;
  return <div style={styles}>
    <LabelContainer
      labelName={label.labelValue}
      labelKey={label.labelKey}
    />
    <span> </span>{number}</div>;
}

export default ApplicationNoContainer;
