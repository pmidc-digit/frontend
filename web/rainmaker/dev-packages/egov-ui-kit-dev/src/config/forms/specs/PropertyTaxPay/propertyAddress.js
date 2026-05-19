import { mohalla } from "egov-ui-kit/config/forms/specs/PropertyTaxPay/utils/reusableFields";
import { fetchLocalizationLabel } from "egov-ui-kit/redux/app/actions";
import { fetchGeneralMDMSData, fetchFinancialYearData, prepareFormData } from "egov-ui-kit/redux/common/actions";
import { setFieldProperty } from "egov-ui-kit/redux/form/actions";
import { fetchDropdownData, generalMDMSDataRequestObj, getGeneralMDMSDataDropdownName, getTranslatedLabel } from "egov-ui-kit/utils/commons";
import { getLocale } from "egov-ui-kit/utils/localStorageUtils";
import filter from "lodash/filter";
import get from "lodash/get";
import sortBy from "lodash/sortBy";
const formConfig = {
  name: "propertyAddress",
  fields: {
    city: {
      id: "city",
      jsonPath: "PropertiesTemp[0].address.city",
      required: true,
      formName: "propertyAddress",
      localePrefix: { moduleName: "tenant", masterName: "tenants" },
      labelsFromLocalisation: true,
      type: "AutocompleteDropdown",
      floatingLabelText: "CORE_COMMON_CITY",
      errorStyle: { position: "absolute", bottom: -8, zIndex: 5 },
      fullWidth: true,
      hintText: "PT_COMMONS_SELECT_PLACEHOLDER",
      numcols: 6,
      gridDefination: {
        xs: 12,
        sm: 6
      },
      dataFetchConfig: {
        dependants: [
          {
            fieldKey: "mohalla",
          },
        ],
      },
      updateDependentFields: ({ formKey, field, dispatch, state }) => {
        dispatch(prepareFormData("Properties[0].tenantId", field.value));
        dispatch(
          prepareFormData(
            "Properties[0].address.city",
            filter(get(state, "common.cities"), (city) => {
              return city.code === field.value;
            })[0].name
          )
        );
        dispatch(setFieldProperty("propertyAddress", "mohalla", "value", ""));
        const moduleValue = field.value;
        dispatch(fetchLocalizationLabel(getLocale(), moduleValue, moduleValue));
        let requestBody = generalMDMSDataRequestObj(field.value);

        dispatch(
          fetchGeneralMDMSData(requestBody, "PropertyTax", getGeneralMDMSDataDropdownName())
        );
      },
    },
    houseNumber: {
      id: "house-number",
      jsonPath: "Properties[0].address.doorNo",
      type: "textfield",
      floatingLabelText: "PT_PROPERTY_DETAILS_DOOR_NUMBER",
      hintText: "PT_PROPERTY_DETAILS_DOOR_NUMBER_PLACEHOLDER",
      numcols: 6,
      errorMessage: "PT_PROPERTY_DETAILS_DOOR_NUMBER_ERRORMSG",
      errorStyle: { position: "absolute", bottom: -8, zIndex: 5 },
      maxLength: 64,
    },
    colony: {
      id: "property-colony",
      jsonPath: "Properties[0].address.buildingName",
      type: "textfield",
      floatingLabelText: "PT_PROPERTY_DETAILS_BUILDING_COLONY_NAME",
      hintText: "PT_PROPERTY_DETAILS_BUILDING_COLONY_NAME_PLACEHOLDER",
      numcols: 6,
      errorMessage: "PT_PROPERTY_DETAILS_COLONY_NAME_ERRORMSG",
      errorStyle: { position: "absolute", bottom: -8, zIndex: 5 },
      maxLength: 64,
    },
    street: {
      id: "property-street",
      jsonPath: "Properties[0].address.street",
      type: "textfield",
      floatingLabelText: "PT_PROPERTY_DETAILS_STREET_NAME",
      hintText: "PT_PROPERTY_DETAILS_STREET_NAME_PLACEHOLDER",
      numcols: 6,
      errorMessage: "PT_PROPERTY_DETAILS_STREET_ERRORMSG",
      errorStyle: { position: "absolute", bottom: -8, zIndex: 5 },
      maxLength: 64,
    },
    ...mohalla,
    pincode: {
      id: "pincode",
      type: "number",
      jsonPath: "Properties[0].address.pincode",
      floatingLabelText: "PT_PROPERTY_DETAILS_PINCODE",
      hintText: "PT_PROPERTY_DETAILS_PINCODE_PLACEHOLDER",
      numcols: 6,
      //errorMessage: "PT_PROPERTY_DETAILS_PINCODE_ERRORMSG",
      errorMessage: "PT_PINCODE_ERROR_MESSAGE",
      errorStyle: { position: "absolute", bottom: -8, zIndex: 5 },
      // pattern: "^([0-9]){6}$",
      pattern: "^(?!000000|111111|222222|333333|444444|555555|666666|777777|888888|999999)(14[0-9][0-9][0-9][0-9]|151[0-9]{3}|1520[0-9]{2}|1521[0-2][0-9]|15213[0-2])$",
    },
    // oldPID: {
    //   id: "oldpid",
    //   type: "textField",
    //   className: "pt-old-pid-text-field",
    //   //text: "PT_SEARCH_BUTTON",
    //   //iconRedirectionURL: "https://pmidc.punjab.gov.in/propertymis/search.php",
    //   jsonPath: "Properties[0].oldPropertyId",
    //   floatingLabelText: "PT_PROPERTY_ADDRESS_EXISTING_PID",
    //   hintText: "PT_PROPERTY_ADDRESS_EXISTING_PID_PLACEHOLDER",
    //   numcols: 6,
    //   errorMessage: "PT_PROPERTY_DETAILS_PINCODE_ERRORMSG",
    //   errorStyle: { position: "absolute", bottom: -8, zIndex: 5 },
    //   toolTip: true,
    //   pattern: /^[^\$\"'<>?\\\\~`!@$%^+={}*,.:;“”‘’]{1,64}$/i,
    //   toolTipMessage: "PT_OLDPID_TOOLTIP_MESSAGE",
    //   maxLength: 64,
    // },
    UID: {
      id: "UID",
      type: "textfield",
      className: "pt-old-pid-text-field",
      required: process.env.REACT_APP_NAME === "Citizen" ? false : true,
      // text: "PT_SEARCH_BUTTON",
      // iconRedirectionURL: "https://pmidc.punjab.gov.in/propertymis/search.php",
      jsonPath: "Properties[0].surveyId",
      floatingLabelText: "Survey Id/UID",
      hintText: "Enter Survey Id/UID",
      numcols: 6,
      errorMessage: "PT_PROPERTY_DETAILS_PINCODE_ERRORMSG",
      errorStyle: { position: "absolute", bottom: -8, zIndex: 5 },
      // toolTip: true,
      //pattern: /^[^\$\"'<>?\\\\~`!@$%^()+={}\[\]*:;“”‘’]{1,64}$/i,
      // toolTipMessage: "PT_OLDPID_TOOLTIP_MESSAGE",
      maxLength: 64,
    },
    YearcreationProperty: {
      id: "YearcreationProperty",
      type: "AutocompleteDropdown",
      //className: "pt-old-pid-text-field",
      // iconRedirectionURL: getTenantId()=='pb.amritsar'? "https://arcserver.punjab.gov.in/portal/apps/webappviewer/index.html?id=8b678d4d5020448499054bf346843ea9": getTenantId()=='pb.hoshiarpur'?"https://arcserver.punjab.gov.in/portal/apps/webappviewer/index.html?id=9bc1b255320a49c590dd17d4d258e054": "https://gis.punjab.gov.in",
      jsonPath: "Properties[0].additionalDetails.yearConstruction",
      floatingLabelText: "Year of creation of Property",
      required: true,
      hintText: "Select",
      numcols: 6,
      gridDefination: {
        xs: 12,
        sm: 6
      },
      errorMessage: "PT_PROPERTY_DETAILS_PINCODE_ERRORMSG",
      errorStyle: { position: "absolute", bottom: -8, zIndex: 5 },
      formName: "propertyAddress",
      updateDependentFields: ({ formKey, field, dispatch }) => {
        if (field.value && field.value.length > 0) {
          const mohalla = field.dropDownData.find((option) => {
            return option.value === field.value;
          });
          dispatch(prepareFormData("Properties[0].additionalDetails.yearConstruction", mohalla.code));
        }
      },
      // toolTip: true,
      //pattern: /^[^\$\"'<>?\\\\~`!@$%^()+={}\[\]*:;“”‘’]{1,64}$/i,
      // toolTipMessage: "PT_OLDPID_TOOLTIP_MESSAGE",
      maxLength: 64,
    },
  },
  afterInitForm: (action, store, dispatch) => {
    try {
      let state = store.getState();
      const { localizationLabels } = state.app;
      const { cities, citiesByModule } = state.common;
      const PT = citiesByModule && citiesByModule.PT;
      if (PT) {
        const tenants = PT.tenants;
        const dd = tenants.reduce((dd, tenant) => {
          let selected = cities.find((city) => {
            return city.code === tenant.code;
          });
          const label = `TENANT_TENANTS_${selected.code.toUpperCase().replace(/[.]/g, "_")}`;
          dd.push({ label: getTranslatedLabel(label, localizationLabels), value: selected.code });
          return dd;
        }, []);
        dispatch(setFieldProperty("propertyAddress", "city", "dropDownData", sortBy(dd, ["label"])));
      }
      const tenant = get(state, 'form.propertyAddress.fields.city.value', null);
      const mohallaDropDownData = get(state, 'form.propertyAddress.fields.mohalla.dropDownData', []);

      // Set YearcreationProperty dropdown and value for update mode
      const financialYears = get(state, 'common.dropDownData.FinancialYear', []);
      if (financialYears.length > 0) {
        dispatch(setFieldProperty("propertyAddress", "YearcreationProperty", "dropDownData", financialYears));
        // Set value if present in preparedFinalObject
        const yearValue = get(state, 'screenConfiguration.preparedFinalObject.Properties[0].additionalDetails.yearConstruction', null);
        if (yearValue) {
          dispatch(setFieldProperty("propertyAddress", "YearcreationProperty", "value", yearValue));
        }
      } else {
        dispatch(fetchFinancialYearData());
      }

      const financialYears = get(state, 'common.dropDownData.FinancialYear', []);
      if (financialYears.length > 0) {
        dispatch(setFieldProperty("propertyAddress", "YearcreationProperty", "dropDownData", financialYears));
      } else {
        dispatch(fetchFinancialYearData());
      }

      if (process.env.REACT_APP_NAME === "Citizen" && tenant && mohallaDropDownData.length == 0) {
        const dataFetchConfig = {
          url: "egov-location/location/v11/boundarys/_search?hierarchyTypeCode=REVENUE&boundaryType=Locality",
          action: "",
          queryParams: [{
            key: "tenantId",
            value: tenant
          }],
          requestBody: {},
          isDependent: true,
          hierarchyType: "REVENUE"
        }
        fetchDropdownData(dispatch, dataFetchConfig, 'propertyAddress', 'mohalla', state, true);
      }
      return action;
    } catch (e) {
      console.log(e);
      return action;
    }
  },
  action: "",
  redirectionRoute: "",
  saveUrl: "",
  isFormValid: false,
};

export default formConfig;