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
      {<div
        style={{
          maxWidth: "1200px",
          margin: "25px auto",
          padding: "18px 28px",
          borderRadius: "16px",
          background: "rgba(255, 77, 79, 0.9)",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          color: "#ffffff",
          fontSize: "18px",
          fontWeight: "500",
          transition: "all 0.3s ease-in-out",
        }}
      >
        <span style={{ fontSize: "24px" }}>🔐</span>
        <span>
          Effective <strong>March 05, 2026</strong>, extra login security has been enabled. Please make sure your mobile number is updated to receive OTP verification.
        </span>
        <span>05 ਮਾਰਚ, 2026 ਤੋਂ, ਵਾਧੂ ਲੌਗਇਨ ਸੁਰੱਖਿਆ ਨੂੰ ਸਮਰੱਥ ਬਣਾਇਆ ਗਿਆ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਇਹ ਯਕੀਨੀ ਬਣਾਓ ਕਿ ਤੁਹਾਡਾ ਮੋਬਾਈਲ ਨੰਬਰ OTP ਪੁਸ਼ਟੀਕਰਨ ਪ੍ਰਾਪਤ ਕਰਨ ਲਈ ਅੱਪਡੇਟ ਕੀਤਾ ਗਿਆ ਹੈ।</span>
      </div>}
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
