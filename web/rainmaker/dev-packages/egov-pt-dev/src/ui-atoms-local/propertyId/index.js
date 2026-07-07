import React from "react";

const styles = {
  backgroundColor: "#2947a3",
  color: "rgba(255, 255, 255, 0.8700000047683716)",
  marginLeft: "8px",
  paddingLeft: "19px",
  paddingRight: "19px",
  textAlign: "center",
  verticalAlign: "middle",
  lineHeight: "35px",
  fontSize: "16px"
};

function PropertyIdContainer(props) {
  const { number } = props;
  return <div style={styles}>Property Tax Unique ID.: {number}</div>;
}

export default PropertyIdContainer;
