import React, { Component } from "react";
import { connect } from "react-redux";
import { Banner } from "modules/common";
import { LanguageSelectionForm } from "modules/common";
import { fetchLocalizationLabel } from "egov-ui-kit/redux/app/actions";
import { getLocale } from "egov-ui-kit/utils/localStorageUtils";
import { LoadingIndicator } from "egov-ui-kit/components";
import get from "lodash/get";

class LanguageSelection extends Component {
  state = {
    value: getLocale(),
    loading: false,
  };

  onClick = async (value) => {
    this.setState({ value, loading: true });
    try {
      await this.props.fetchLocalizationLabel(value);
    } catch (error) {
      console.error("Localization fetch failed", error);
    } finally {
      this.setState({ loading: false });
    }
  };

  onLanguageSelect = () => {
    this.props.history.push("/user/login");
  };

  render() {
    const { value, loading } = this.state;
    const { onLanguageSelect, onClick } = this;
    const { bannerUrl, logoUrl, languages } = this.props;

    return (
      <Banner className="language-selection" bannerUrl={bannerUrl} logoUrl={logoUrl}>
        {loading && <LoadingIndicator status="loading" />}
        <LanguageSelectionForm items={languages} value={value} onLanguageSelect={onLanguageSelect} onClick={onClick} />
      </Banner>
    );
  }
}

const mapStateToProps = ({ common }) => {
  const { stateInfoById } = common;
  let bannerUrl = get(stateInfoById, "0.bannerUrl");
  let logoUrl = get(stateInfoById, "0.logoUrl");
  let languages = get(stateInfoById, "0.languages", []);
  return { bannerUrl, logoUrl, languages };
};

const mapDispatchToProps = (dispatch) => {
  return {
    fetchLocalizationLabel: (locale) => dispatch(fetchLocalizationLabel(locale)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LanguageSelection);
