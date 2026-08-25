import { setFieldProperty, handleFieldChange } from "egov-ui-kit/redux/form/actions";
import get from "lodash/get";
import { getUserInfo, getLocale } from "egov-ui-kit/utils/localStorageUtils";
import { getTranslatedLabel } from "egov-ui-kit/utils/commons";
import { fetchLocalizationLabel } from "egov-ui-kit/redux/app/actions";
import piexif from "piexifjs";
import axios from "axios";

const tenantId = JSON.parse(getUserInfo()).permanentCity;


const getReverseGeocodeAddress = (latitude, longitude) => {
  return new Promise((resolve) => {
    try {
      // Using OpenStreetMap Nominatim API (free, no key required)
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
      axios.get(url, {
        headers: {
          "Accept-Language": "en"
        }
      }).then((response) => {
        const address = response.data.address || {};
        let formattedAddress = response.data.display_name || "";

        // Extract specific parts if available
        const road = address.road || address.street || "";
        const houseNumber = address.house_number || "";
        const building = address.building || "";

        let shortAddress = "";
        if (houseNumber) shortAddress += houseNumber + " ";
        if (road) shortAddress += road;
        if (building && !road) shortAddress += building;

        shortAddress = shortAddress.trim() || formattedAddress;

        resolve({ fullAddress: formattedAddress, shortAddress });
      }).catch((error) => {
        resolve({ fullAddress: "", shortAddress: "" });
      });
    } catch (error) {
      resolve({ fullAddress: "", shortAddress: "" });
    }
  });
};

const extractGPSFromImage = (file) => {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onerror = (error) => {
        resolve({ latitude: null, longitude: null });
      };
      reader.onload = (e) => {
        try {
          // Convert ArrayBuffer to binary string for piexif
          const arrayBuffer = e.target.result;
          const bytes = new Uint8Array(arrayBuffer);
          let binaryString = "";
          for (let i = 0; i < bytes.byteLength; i++) {
            binaryString += String.fromCharCode(bytes[i]);
          }

          const exifData = piexif.load(binaryString);
          const gps = exifData["GPS"];

          if (gps && gps[piexif.GPSIFD.GPSLatitude] && gps[piexif.GPSIFD.GPSLongitude]) {
            const latitudeValue = gps[piexif.GPSIFD.GPSLatitude];
            const longitudeValue = gps[piexif.GPSIFD.GPSLongitude];
            const latitudeRef = gps[piexif.GPSIFD.GPSLatitudeRef];
            const longitudeRef = gps[piexif.GPSIFD.GPSLongitudeRef];


            const latitude = (latitudeValue[0][0] / latitudeValue[0][1] +
              latitudeValue[1][0] / latitudeValue[1][1] / 60 +
              latitudeValue[2][0] / latitudeValue[2][1] / 3600) *
              (latitudeRef === "S" ? -1 : 1);

            const longitude = (longitudeValue[0][0] / longitudeValue[0][1] +
              longitudeValue[1][0] / longitudeValue[1][1] / 60 +
              longitudeValue[2][0] / longitudeValue[2][1] / 3600) *
              (longitudeRef === "W" ? -1 : 1);

            resolve({ latitude: Math.round(latitude * 1000000) / 1000000, longitude: Math.round(longitude * 1000000) / 1000000 });
          } else {
            resolve({ latitude: null, longitude: null });
          }
        } catch (error) {
          resolve({ latitude: null, longitude: null });
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      resolve({ latitude: null, longitude: null });
    }
  });
};

const formConfig = {
  name: "complaint",
  idJsonPath: "services[0].serviceRequestId",
  fields: {
    media: {
      id: "media",
      jsonPath: "actionInfo[0].media",
      file: true,
      errorMessage: "CS_FILE_UPLOAD_FAILED",
    },
    complaintType: {
      id: "complaint-type",
      jsonPath: "services[0].serviceCode",
      required: true,
      floatingLabelText: "CS_ADDCOMPLAINT_COMPLAINT_TYPE",
      errorMessage: "CS_ADDCOMPLAINT_COMPLAINT_TYPE_PLACEHOLDER",
      hintText: "CS_ADDCOMPLAINT_COMPLAINT_TYPE_PLACEHOLDER",
    },
    additionalDetails: {
      id: "additional details",
      jsonPath: "services[0].description",
      floatingLabelText: "CS_ADDCOMPLAINT_COMPLAINT_DETAILS",
      hintText: "CS_ADDCOMPLAINT_COMPLAINT_DETAILS_PLACEHOLDER",
      errorMessage: "Landmark should be less than 300 characters",
    },
    latitude: {
      id: "latitude",
      jsonPath: "services[0].addressDetail.latitude",
    },
    longitude: {
      id: "longitude",
      jsonPath: "services[0].addressDetail.longitude",
    },
    address: {
      id: "address",
      jsonPath: "services[0].address",
      floatingLabelText: "CS_ADDCOMPLAINT_LOCATION",
      hintText: "CS_COMPLAINT_DETAILS_LOCATION",
    },
    city: {
      id: "city",
      jsonPath: "services[0].addressDetail.city",
      floatingLabelText: "CORE_COMMON_CITY",
      hintText: "ES_CREATECOMPLAINT_SELECT_PLACEHOLDER",
      errorMessage: "CS_ADDCOMPLAINT_COMPLAINT_TYPE_PLACEHOLDER",
      required: true,
      errorStyle: { position: "absolute", bottom: -8, zIndex: 5 },
      errorText: "",
      dropDownData: [],
      updateDependentFields: ({ formKey, field, dispatch, state }) => {
        dispatch(setFieldProperty("complaint", "mohalla", "value", ""));
      },
      beforeFieldChange: ({ action, dispatch, state }) => {
        if (get(state, "common.prepareFormData.services[0].addressDetail.city") !== action.value) {
          const moduleValue = action.value;
          dispatch(fetchLocalizationLabel(getLocale(), moduleValue, moduleValue));
        }
        return action;
      },
      labelsFromLocalisation: false,
      dataFetchConfig: {
        dependants: [
          {
            fieldKey: "mohalla",
          },
        ],
      },
    },
    mohalla: {
      id: "mohalla",
      required: true,
      jsonPath: "services[0].addressDetail.mohalla",
      floatingLabelText: "CS_CREATECOMPLAINT_MOHALLA",
      hintText: "CS_CREATECOMPLAINT_MOHALLA_PLACEHOLDER",
      errorMessage: "CS_ADDCOMPLAINT_COMPLAINT_TYPE_PLACEHOLDER",
      boundary: true,
      dropDownData: [],
      dataFetchConfig: {
        url: "egov-location/location/v11/boundarys/_search?hierarchyTypeCode=ADMIN&boundaryType=Locality",
        action: "",
        queryParams: [],
        requestBody: {},
        isDependent: true,
        hierarchyType: "ADMIN",
      },

      errorStyle: { position: "absolute", bottom: -8, zIndex: 5 },
      errorText: "",
    },
    houseNo: {
      id: "houseNo",
      jsonPath: "services[0].addressDetail.houseNoAndStreetName",
      floatingLabelText: "CS_ADDCOMPLAINT_HOUSE_NO",
      hintText: "CS_ADDCOMPLAINT_HOUSE_NO_PLACEHOLDER",
      errorMessage: "PT_HOUSE_NO_ERROR_MESSAGE",
    },
    landmark: {
      id: "landmark",
      jsonPath: "services[0].addressDetail.landmark",
      floatingLabelText: "CS_ADDCOMPLAINT_LANDMARK",
      hintText: "CS_ADDCOMPLAINT_LANDMARK_PLACEHOLDER",
      errorMessage: "PT_LANDMARK_ERROR_MESSAGE",
    },
    tenantId: {
      id: "add-complaint-tenantid",
      jsonPath: "services[0].tenantId",
    },
  },
  submit: {
    type: "submit",
    label: "CS_ADDCOMPLAINT_ADDITIONAL_DETAILS_SUBMIT_COMPLAINT",
    id: "addComplaint-submit-complaint",
  },
  afterInitForm: (action, store, dispatch) => {
    try {
      let citizenCity = localStorage.getItem('CITIZEN.CITY') ?  localStorage.getItem('CITIZEN.CITY') : 'pb'
      let state = store.getState();
      const { localizationLabels } = state.app;
      const { cities, citiesByModule } = state.common;
      const { PGR } = citiesByModule || {};
      if (PGR) {
        const tenants = PGR.tenants;
        const dd = tenants.reduce((dd, tenant) => {
          let selected = cities.find((city) => {
            return city.code === tenant.code;
          });
          if (selected) {
            const label = `TENANT_TENANTS_${selected.code.toUpperCase().replace(/[.]/g, "_")}`;
            dd.push({ label: getTranslatedLabel(label, localizationLabels), value: selected.code });
          }

          return dd;
        }, []);
        dispatch(setFieldProperty("complaint", "city", "dropDownData", dd));

        // Set citizenCity as the selected value if it exists
      }
      // let city = get(state, "form.complaint.fields.city.value");
      // let mohalla = get(state, "form.complaint.fields.mohalla.value");
      const cityFormData = get(state, "common.prepareFormData.services[0].addressDetail.city", "");
      const mohallaFormData = get(state, "common.prepareFormData.services[0].addressDetail.mohalla", "");
      const complaintTypeFormData = get(state, "common.prepareFormData.services[0].serviceCode", "");

      // Check if URL has type=pdc parameter
      const params = new URLSearchParams(window.location.search);
      const typeFromUrl = params.get("type");

      if (typeFromUrl === "pdc") {
        // Hide complaint type, city, and mohalla fields if type=pdc
       // console.log("✓✓✓ PDC TYPE DETECTED - HIDING FIELDS");

        // Hide complaint type
        //dispatch(setFieldProperty("complaint", "complaintType", "style", { display: "none" }));
        dispatch(setFieldProperty("complaint", "complaintType", "required", false));
        dispatch(handleFieldChange("complaint", "complaintType", "GarbageNeedsTobeCleared"));
       // console.log("✓ Complaint Type field hidden and set to: GarbageNeedsTobeCleared");

        // Hide city
       // dispatch(setFieldProperty("complaint", "city", "style", { display: "none" }));
        dispatch(setFieldProperty("complaint", "city", "required", false));
        dispatch(handleFieldChange("complaint", "city", citizenCity));
      
        //console.log("✓ City field hidden and set to:", citizenCity);

        // Hide mohalla
        //dispatch(setFieldProperty("complaint", "mohalla", "style", { display: "none" }));
        dispatch(setFieldProperty("complaint", "mohalla", "required", false));
        dispatch(handleFieldChange("complaint", "mohalla", "UNKNOWNAD"));
       // console.log("✓ Mohalla field hidden and set to: UNKNOWNAD");

      } else {
        // Show all fields for other types

        // Show complaint type
        dispatch(setFieldProperty("complaint", "complaintType", "style", { display: "block" }));
        dispatch(setFieldProperty("complaint", "complaintType", "required", true));
        dispatch(handleFieldChange("complaint", "complaintType", complaintTypeFormData));

        // Show city
        dispatch(setFieldProperty("complaint", "city", "style", { display: "block" }));
        dispatch(setFieldProperty("complaint", "city", "required", true));
         dispatch(handleFieldChange("complaint", "city", cityFormData));

        // Show mohalla
        dispatch(setFieldProperty("complaint", "mohalla", "style", { display: "block" }));
        dispatch(setFieldProperty("complaint", "mohalla", "required", true));
        dispatch(handleFieldChange("complaint", "mohalla", mohallaFormData));
      }

   
     

      setTimeout(() => {
        if (typeFromUrl === "pdc") {

          const cityElement = document.getElementById("city");
          const mohallaElement = document.getElementById("mohalla");
          const complaintType = document.getElementById("complaint-type");

          if (complaintType && complaintType.parentElement && complaintType.parentElement.parentElement) {
            complaintType.parentElement.parentElement.style.display = "none";
          }

          if (cityElement) {
            cityElement.style.display = "none";
          }
          if (mohallaElement) {
            mohallaElement.style.display = "none";
          }
        }
      }, 500);

     
   

      // Attach file input listener for GPS extraction
      setTimeout(() => {
        let mediaInput = document.getElementById("media");

        if (!mediaInput) {
          // Try finding by attribute
          mediaInput = document.querySelector("input[id='media']");
        }

        if (!mediaInput) {
          // Try finding any file input with name containing 'media' or 'actionInfo'
          mediaInput = document.querySelector("input[type='file']");
        }

        if (!mediaInput) {
          // Get all file inputs on the page
          const allFileInputs = document.querySelectorAll("input[type='file']");
        }

        if (mediaInput) {
          // Remove any existing listeners
          mediaInput.removeEventListener("change", handleGPSExtraction);
          // Add listener
          mediaInput.addEventListener("change", handleGPSExtraction);
        }
      }, 1000);

      // Define the handler outside so it can be removed/re-added
      const handleGPSExtraction = (e) => {
        const files = e.target.files;
        if (files && files[0]) {
          const file = files[0];
          extractGPSFromImage(file).then(({ latitude, longitude }) => {
            if (latitude !== null && longitude !== null) {
              dispatch(handleFieldChange("complaint", "latitude", latitude));
              dispatch(handleFieldChange("complaint", "longitude", longitude));

              // Fetch address from coordinates
              getReverseGeocodeAddress(latitude, longitude).then(({ fullAddress, shortAddress }) => {
                if (fullAddress) {
                  dispatch(handleFieldChange("complaint", "address", fullAddress));
                  dispatch(handleFieldChange("complaint", "houseNo", shortAddress));
                }
              });
            }
          }).catch((err) => {
            // Error handling for GPS extraction
          });
        }
      };

      return action;
    } catch (e) {
    }
  },
  action: "_create",
  saveUrl: "/rainmaker-pgr/v1/requests/_create",
  redirectionRoute: "/complaint-submitted",
};

export default formConfig;
