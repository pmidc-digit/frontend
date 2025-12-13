import React, { Component } from "react";
import { withRouter } from "react-router";
import { connect } from "react-redux";
import { Toast } from "components";
import { addBodyClass, getModuleName } from "egov-ui-kit/utils/commons";
import { fetchCurrentLocation, fetchLocalizationLabel, toggleSnackbarAndSetText, setRoute } from "egov-ui-kit/redux/app/actions";
import { fetchMDMSData } from "egov-ui-kit/redux/common/actions";
import Router from "./Router";
import commonConfig from "config/common";
// import logoMseva from "egov-ui-kit/assets/images/logo-white.png";
import routes from "./Routes";
import { getLocale, getModule, setModule, getStoredModulesList, getTenantId } from "egov-ui-kit/utils/localStorageUtils";
import isEmpty from "lodash/isEmpty";
import { LoadingIndicator, CommonShareContainer } from "components";

class App extends Component {
  constructor(props) {
    super(props);
    const { pathname: currentPath } = props.location;

    props.history.listen((location, action) => {
      const { pathname: nextPath } = location;
      addBodyClass(nextPath);
      props.toggleSnackbarAndSetText(false, { labelName: "", labelKey: "" }, "success");
    });

    addBodyClass(currentPath);
  }

  componentDidMount = async () => {
    const { fetchLocalizationLabel, fetchCurrentLocation, fetchMDMSData } = this.props;
    const { pathname } = window.location;

    // Initialize localization
    // fetchLocalizationLabel now handles:
    // 1. Checking IndexedDB cache
    // 2. Hydrating Redux from cache
    // 3. Fetching from API if cache is missing/incomplete
    fetchLocalizationLabel(getLocale() || "en_IN");

    // FIX (Comment #1): Update module on initial load
    this.updateModuleOnRouteChange();

    // FIX (Comment #1): Listen to route changes to update module filter
    this.unlisten = this.props.history.listen((location) => {
      this.updateModuleOnRouteChange();
    });

    let requestBody = {
      MdmsCriteria: {
        tenantId: commonConfig.tenantId,
        moduleDetails: [
          {
            moduleName: "common-masters",
            masterDetails: [
              {
                name: "StateInfo",
              },
            ],
          },
          {
            moduleName: "tenant",
            masterDetails: [
              {
                name: "tenants",
              },
              {
                name: "citymodule",
              },
            ],
          },
        ],
      },
    };
    // Note: fetchLocalizationLabel is now called conditionally above based on IndexedDB data

    // current location
    fetchCurrentLocation();
    fetchMDMSData(requestBody);
  }

  componentWillUnmount() {
    // Cleanup: Remove route change listener
    if (this.unlisten) {
      this.unlisten();
    }
  }

  // FIX (Comment #1): Update module on every route change
  updateModuleOnRouteChange = () => {
    const moduleName = getModuleName();
    const currentModule = getModule();

    if (moduleName !== currentModule) {
      console.log(`Log => ** [Module Update] Route changed. New module: ${moduleName} (was: ${currentModule})`);
      setModule(moduleName);

      // Check if this module's localization is already loaded
      const storedModulesList = getStoredModulesList();
      const storedModules = storedModulesList ? JSON.parse(storedModulesList) : [];

      if (!storedModules.includes(moduleName)) {
        this.props.fetchLocalizationLabel(getLocale() || "en_IN", moduleName, getTenantId(), true);
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    const { route: nextRoute, authenticated, location } = nextProps;
    const { route: currentRoute, history, setRoute } = this.props;

    if (nextRoute && currentRoute !== nextRoute) {
      history.push(nextRoute);
      setRoute("");
    }

    const isPrivacyPolicy = location && location.pathname && location.pathname.includes("privacy-policy");
    if (nextProps.hasLocalisation !== this.props.hasLocalisation && !authenticated && !isPrivacyPolicy) {
      nextProps.hasLocalisation && this.props.history.replace("/language-selection");
    }
  }

  render() {
    const { toast, loading, defaultUrl, hasLocalisation } = this.props;
    return (
      <div>
        <Router routes={routes} hasLocalisation={hasLocalisation} defaultUrl={defaultUrl} />
        {toast && toast.open && !isEmpty(toast.message) && <Toast open={toast.open} message={toast.message} variant={toast.variant} />}
        {loading && <LoadingIndicator />}
        <CommonShareContainer componentId="rainmaker-common-share" />
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { route, toast } = state.app;
  const { auth } = state;
  const { authenticated } = auth || false;
  const props = {};
  const { spinner } = state.common;
  const { stateInfoById } = state.common || [];
  let hasLocalisation = false;
  let defaultUrl = process.env.REACT_APP_NAME === "Citizen" ? "/user/register" : "/user/login";
  if (stateInfoById && stateInfoById.length > 0) {
    hasLocalisation = stateInfoById[0].hasLocalisation;
    defaultUrl = stateInfoById[0].defaultUrl;
  }
  const loading = ownProps.loading || spinner;
  if (route && route.length) {
    props.route = route;
  }
  if (toast && toast.open && toast.message && !isEmpty(toast.message)) {
    props.toast = toast;
  }
  return {
    ...props,
    loading,
    hasLocalisation,
    defaultUrl,
    authenticated,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    // FIX: Pass all 4 parameters to fetchLocalizationLabel action
    fetchLocalizationLabel: (locale, module, tenantId, isFromModule) => dispatch(fetchLocalizationLabel(locale, module, tenantId, isFromModule)),
    toggleSnackbarAndSetText: (open, message, error) => dispatch(toggleSnackbarAndSetText(open, message, error)),
    fetchMDMSData: (criteria) => dispatch(fetchMDMSData(criteria)),
    fetchCurrentLocation: () => dispatch(fetchCurrentLocation()),
    setRoute: (route) => dispatch(setRoute(route)),
  };
};

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(App)
);
