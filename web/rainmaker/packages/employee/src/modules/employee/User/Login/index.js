import React from "react";
import formHoc from "egov-ui-kit/hocs/form";
import { Banner } from "modules/common";
import LoginForm from "./components/LoginForm";
import { connect } from "react-redux";
import get from "lodash/get";

const LoginFormHOC = formHoc({ formKey: "employeeLogin" })(LoginForm);

const Login = ({ bannerUrl, logoUrl }) => {
  return (
    <Banner hideBackButton={false} bannerUrl={bannerUrl} logoUrl={logoUrl}>
      {/* <div
  style={{
    maxWidth: "1200px",
    width: "100%",
    margin: "25px auto",
    padding: "18px 28px",
    borderRadius: "16px",
    background: "rgba(255, 77, 79, 0.9)",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    color: "#ffffff",
    transition: "all 0.3s ease-in-out",
    boxSizing: "border-box",
  }}
>
  <span style={{ fontSize: "24px", flexShrink: 0 }}>🔐</span>

  <marquee
    scrollAmount="5"
    style={{
      color: "#fff",
      fontStyle: "italic",
      fontSize: "20px",
      fontWeight: "500",
      width: "100%",
      margin: 0,
    }}
  >
    Scheduled Maintenance Notice: The mSeva Portal will undergo scheduled
    maintenance and database optimization from <b>7:00 PM on 07 August 2026</b>{" "}
    to <b>6:00 PM on 09 August 2026</b>. Services may be temporarily unavailable
    or experience intermittent interruptions during this period. We regret the
    inconvenience caused and appreciate your patience and cooperation. –{" "}
    <b>Team mSeva</b>, Punjab Municipal Infrastructure Development Company
    (PMIDC)
  </marquee>
</div> */}
      <LoginFormHOC logoUrl={logoUrl} />
    </Banner>
  );
};

const mapStateToProps = ({ common }) => {
  const { stateInfoById } = common;
  let bannerUrl = get(stateInfoById, "0.bannerUrl");
  let logoUrl = get(stateInfoById, "0.logoUrl");
  return { bannerUrl, logoUrl };
};

export default connect(
  mapStateToProps,
  null
)(Login);
