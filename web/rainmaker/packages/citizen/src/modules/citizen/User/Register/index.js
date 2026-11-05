import React, { Component } from "react";
import formHoc from "egov-ui-kit/hocs/form";
import RegisterForm from "./components/RegisterForm";
import { Banner } from "modules/common";
import { connect } from "react-redux";
import get from "lodash/get";

const RegisterFormHOC = formHoc({ formKey: "register" })(RegisterForm);

class Register extends Component {
  render() {
    const { bannerUrl, logoUrl,qrCodeURL,enableWhatsApp } = this.props;
    return (
      <Banner hideBackButton={false} bannerUrl={bannerUrl} logoUrl={logoUrl}>
        {/* <marquee style={{ color: "white", fontStyle: "italic", fontSize: "20px", margin: "20px 0" }}>
         Scheduled Maintenance Notice: The mSeva Portal will undergo scheduled maintenance and database optimization from 7:00 PM on 07 August 2026 to 6:00 PM on 09 August 2026. Services may be temporarily unavailable or experience intermittent interruptions during this period. We regret the inconvenience caused and appreciate your patience and cooperation. - Team mSeva, Punjab Municipal Infrastructure Development Company (PMIDC)
      </marquee> */}
        <RegisterFormHOC logoUrl={logoUrl} qrCodeURL={qrCodeURL} enableWhatsApp={enableWhatsApp}/>
      </Banner>
    );
  }
}

const mapStateToProps = ({ common }) => {
  const { stateInfoById } = common;
  let bannerUrl = get(stateInfoById, "0.bannerUrl");
  let logoUrl = get(stateInfoById, "0.logoUrl");
  let qrCodeURL = get(stateInfoById, "0.qrCodeURL");
  let enableWhatsApp=get(stateInfoById,"0.enableWhatsApp");
  return { bannerUrl, logoUrl ,qrCodeURL,enableWhatsApp};
};

export default connect(
  mapStateToProps,
  null
)(Register);
