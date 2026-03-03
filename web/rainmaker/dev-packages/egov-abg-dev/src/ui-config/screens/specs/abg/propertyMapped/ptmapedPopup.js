import get from "lodash/get";
import {
    getCommonCard,
    getLabel,
    getTextField
} from "egov-ui-framework/ui-config/screens/specs/utils";
import { handleScreenConfigurationFieldChange } from "egov-ui-framework/ui-redux/screen-configuration/actions";
import { store } from "egov-ui-framework/ui-redux/store";
import React from "react";
import { connect } from "react-redux";
import { httpRequest } from "egov-ui-framework/ui-utils/api";
import { Dialog } from "components";
import { getTenantId, getUserInfo, getLocalization } from "egov-ui-kit/utils/localStorageUtils";
import MapPTPopup from "./mapptedpopupsd";

// Define usage category options as constant outside the component to prevent recreation on every render
const USAGE_CATEGORY_OPTIONS = [
    { code: "109", name: "Agriculture", isUrban: false },
    { code: "111", name: "Commercial", isUrban: false },
    { code: "112", name: "Industrial", isUrban: false },
    { code: "114", name: "Open Land", isUrban: false },
    { code: "113", name: "Other", isUrban: false },
    { code: "110", name: "Residential", isUrban: false }
];

// safe store getter to avoid "Cannot read properties of undefined (reading 'getState'"
const getSafeStore = () => {
    if (typeof store !== "undefined" && store) return store;
    if (typeof window !== "undefined" && (window.store || window.__STORE__)) return window.store || window.__STORE__;
    return null;
};

const closeWelcomeDialog = () => {
    const s = getSafeStore();
    if (!s || !s.dispatch) return;
    s.dispatch(
        handleScreenConfigurationFieldChange(
            "ptreve",
            "components.welcomeDialog",
            "props.open",
            false
        )
    );
};

const setMobileFieldError = (error, helperText) => {
    const s = getSafeStore();
    if (!s || !s.dispatch) return;
    s.dispatch(
        handleScreenConfigurationFieldChange(
            "ptreve",
            "components.welcomeDialog.children.popup.children.cardContent.children.mobileNumber",
            "props.error",
            error
        )
    );
    s.dispatch(
        handleScreenConfigurationFieldChange(
            "ptreve",
            "components.welcomeDialog.children.popup.children.cardContent.children.mobileNumber",
            "props.helperText",
            helperText
        )
    );
};

const onContinue = () => {
    const s = getSafeStore();
    const state = s && s.getState ? s.getState() : {};
    const mobileNumber = String(
        get(state, "screenConfiguration.preparedFinalObject.ptmapPopup.mobileNumber", "") || ""
    ).trim();

    const isValidMobile = /^\d{10}$/.test(mobileNumber);
    if (!isValidMobile) {
        setMobileFieldError(true, "Enter a valid 10 digit mobile number");
        return;
    }

    setMobileFieldError(false, "");

    // Close welcome dialog and open survey id edit dialog
    if (s && s.dispatch) {
        s.dispatch(
            handleScreenConfigurationFieldChange(
                "ptreve",
                "components.welcomeDialog",
                "props.open",
                false
            )
        );
        s.dispatch(
            handleScreenConfigurationFieldChange(
                "ptreve",
                "components.surveyDialog",
                "props.open",
                true
            )
        );
    }
};



// React wrapper component
const PTmapPopup = ({ propertiesId, ownerName, ownerMobile, locality, landArea, usageCategory, noOfFloors, address, onClose, onCloseAll, prepared, rowdatacomplete, dispatch }) => {

    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [revenueData, setRevenueData] = React.useState(null);
    const [districts, setDistricts] = React.useState([]);
    const [tehsils, setTehsils] = React.useState([]);
    const [villages, setVillages] = React.useState([]);
    const [segments, setSegments] = React.useState([]);
    const [subSegments, setSubSegments] = React.useState([]);
    const [dialogOpen, setDialogOpen] = React.useState(false);

    const [localityState, setLocalityState] = React.useState(() => localStorage.getItem("ptmap_locality") || "");
    const [districtState, setDistrictState] = React.useState(() => localStorage.getItem("ptmap_district") || "");
    const [tehsilState, setTehsilState] = React.useState(() => localStorage.getItem("ptmap_tehsil") || "");
    const [villageState, setVillageState] = React.useState(() => localStorage.getItem("ptmap_village") || "");
    const [segmentState, setSegmentState] = React.useState(() => localStorage.getItem("ptmap_segment") || "");
    const [usageCategoryState, setUsageCategoryState] = React.useState(() => {
        // Map usageCategory to category code
        const raw = String(usageCategory || "").trim().toUpperCase();
        if (raw.includes("RESIDENTIAL") && !raw.includes("NONRESIDENTIAL")) return "110";
        if (raw.includes("COMMERCIAL") || raw.includes("NONRESIDENTIAL")) return "111";
        if (raw.includes("INDUSTRIAL")) return "112";
        if (raw.includes("OTHERS")) return "113";
        if (raw.includes("AGRICULTURE")) return "109";
        if (raw.includes("OPEN") && raw.includes("LAND")) return "114";
        if (raw === "MIXED") return "";
        return "";
    });
    const [subUsageCategoryState, setSubUsageCategoryState] = React.useState(() => localStorage.getItem("ptmap_subSegment") || "");
    const [subUsageCategoryValue, setSubUsageCategoryValue] = React.useState("");
    const [subUsageCategories, setSubUsageCategories] = React.useState([]);
    const [usageCategories, setUsageCategories] = React.useState([]);
    const [mappedRate, setMappedRate] = React.useState(null);
    const [mappedunit, setMappedunit] = React.useState("");
    const [mappedRateId, setMappedRateId] = React.useState(null);
    const [mappedSegmentName, setMappedSegmentName] = React.useState(null);
    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const [propertyData, setPropertyData] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [fullAddressss, setFullAddressss] = React.useState(address || "-");
    React.useEffect(() => {

        const fetchPropertyDetails = async () => {
            if (!propertiesId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const tenantId = getTenantId();
                const url = `/property-services/property/_search?tenantId=${tenantId}&propertyIds=${propertiesId}`;

                const response = await httpRequest("post", url, "", [], {});

                if (response && response.Properties && response.Properties.length > 0) {
                    const property = response.Properties[0];
                    setPropertyData(property);

                    // Build address from property data
                    if (property.address) {
                        const addressParts = [
                            property.address.doorNo,
                            property.address.buildingName,
                            property.address.street,
                            property.address.locality.name,
                            property.address.city
                        ];
                        const formattedAddress = addressParts.filter(Boolean).join(", ") || address || "-";
                        setFullAddressss(formattedAddress);
                    } else {
                        setFullAddressss(address || "-");
                    }
                } else {
                    setPropertyData(null);
                    setFullAddressss(address || "-");
                }
            } catch (err) {
                console.error("Error fetching property details:", err);
                setError(err.message || "Failed to fetch property details");
            } finally {
                setLoading(false);
            }
        };

        fetchPropertyDetails();
    }, [propertiesId]);
    React.useEffect(() => {
        const raw = String(usageCategory || "").trim().toUpperCase();

        // Map usage category to code, handling composite values like NONRESIDENTIAL.COMMERCIAL
        if (raw.includes("RESIDENTIAL") && !raw.includes("NONRESIDENTIAL")) {
            const residential = USAGE_CATEGORY_OPTIONS.find(
                (x) => String(x.name).trim().toUpperCase() === "RESIDENTIAL"
            );
            setUsageCategoryState((residential && residential.code) || "110");
        } else if (raw.includes("COMMERCIAL") || raw.includes("NONRESIDENTIAL")) {
            const commercial = USAGE_CATEGORY_OPTIONS.find(
                (x) => String(x.name).trim().toUpperCase() === "COMMERCIAL"
            );
            setUsageCategoryState((commercial && commercial.code) || "111");
        } else if (raw.includes("INDUSTRIAL")) {
            const industrial = USAGE_CATEGORY_OPTIONS.find(
                (x) => String(x.name).trim().toUpperCase() === "INDUSTRIAL"
            );
            setUsageCategoryState((industrial && industrial.code) || "112");
        } else if (raw.includes("OTHERS")) {
            const other = USAGE_CATEGORY_OPTIONS.find(
                (x) => String(x.name).trim().toUpperCase() === "OTHERS"
            );
            setUsageCategoryState((other && other.code) || "113");
        } else if (raw.includes("AGRICULTURE")) {
            const agriculture = USAGE_CATEGORY_OPTIONS.find(
                (x) => String(x.name).trim().toUpperCase() === "AGRICULTURE"
            );
            setUsageCategoryState((agriculture && agriculture.code) || "109");
        } else if (raw.includes("OPEN") && raw.includes("LAND")) {
            const openLand = USAGE_CATEGORY_OPTIONS.find(
                (x) => String(x.name).trim().toUpperCase() === "OPEN LAND"
            );
            setUsageCategoryState((openLand && openLand.code) || "114");
        } else if (raw === "MIXED") {
            setUsageCategoryState("");
        } else {
            // Keep current state if no match
        }

        localStorage.removeItem("ptmap_usageCategory");
    }, [usageCategory]);

    // Fetch revenue data when popup opens (component mounts)
    React.useEffect(() => {
        const fetchRevenueData = async () => {
            try {
                setIsSubmitting(true);
               
                console.log("Prepared object:", prepared);

                // Try multiple paths to get tenantId
                const tenantId = get(prepared, "searchCriteria.tenantId") ||
                    get(prepared, "tenantId") ||
                    localStorage.getItem("tenant-id") ||
                    "pb.amritsar"; // fallback

                console.log("Using tenantId:", tenantId);

                const requestBody = {
                    searchCriteria: {
                        tenantId: tenantId,
                        locality: locality || ""
                    }
                };

                const url = "/egov-property-rate/property-rate/_search";

                const response = await httpRequest(
                    "post",
                    url,
                    "",
                    [],
                    requestBody
                );

                
                setRevenueData(response);

                const propertydisits = (response && response.districts) || [];



                if (Array.isArray(propertydisits) && propertydisits.length > 0) {

                    setDistricts(propertydisits);
                   

                    // If no persisted district, auto-select based on login/tenant (first available)
                    const persistedDistrict = localStorage.getItem("ptmap_district") || "";
                    if (!persistedDistrict) {
                        const defaultDistrict = propertydisits[0];
                        const defaultCode =
                            defaultDistrict &&
                            (defaultDistrict.code || defaultDistrict.districtId || defaultDistrict.id);
                        if (defaultCode) {
                            setDistrictState(String(defaultCode));
                            localStorage.setItem("ptmap_district", String(defaultCode));
                        }
                    }
                } else {
                   
                    setDistricts([]);
                }

                setIsSubmitting(false);
            } catch (error) {
                console.error('Error fetching revenue data:', error);
                console.error('Error details:', error.message, error.response);
                setIsSubmitting(false);
                alert('Failed to fetch revenue data. Check console for details.');
            }
        };

        fetchRevenueData();
    }, [prepared]); // Add prepared as dependency

    // Load dependent dropdowns on mount if there are persisted values
    React.useEffect(() => {
        const loadPersistedDropdowns = async () => {
            const tenantId = get(prepared, "searchCriteria.tenantId") ||
                get(prepared, "tenantId") ||
                localStorage.getItem("tenant-id") ||
                "pb.amritsar";

            try {
                // Load tehsils if district is persisted
                if (districtState && !tehsils.length) {
                    const tehsilResponse = await httpRequest(
                        "post",
                        "/egov-property-rate/property-rate/_search",
                        "",
                        [],
                        { searchCriteria: { districtId: districtState, locality: locality || "" } }
                    );
                    const tehsilsData = (tehsilResponse && tehsilResponse.tehsils) || [];
                    if (Array.isArray(tehsilsData) && tehsilsData.length > 0) {
                        setTehsils(tehsilsData);
                    }
                }

                // Load villages if tehsil is persisted
                if (tehsilState && !villages.length) {
                    const villageResponse = await httpRequest(
                        "post",
                        "/egov-property-rate/property-rate/_search",
                        "",
                        [],
                        { searchCriteria: { tehsilId: tehsilState, locality: locality || "" } }
                    );
                    const villagesData = (villageResponse && (
                        villageResponse.villages ||
                        villageResponse.Villages ||
                        villageResponse.villageList ||
                        villageResponse.data
                    )) || [];
                    if (Array.isArray(villagesData) && villagesData.length > 0) {
                        setVillages(villagesData);
                    }
                }

                // Load segments if village is persisted
                if (villageState && !segments.length) {
                    const segmentResponse = await httpRequest(
                        "post",
                        "/egov-property-rate/property-rate/_search",
                        "",
                        [],
                        { searchCriteria: { villageId: villageState, locality: locality || "" } }
                    );
                    const segmentsData = (segmentResponse && (
                        segmentResponse.segments ||
                        segmentResponse.Segments ||
                        segmentResponse.segmentList ||
                        segmentResponse.data
                    )) || [];
                    if (Array.isArray(segmentsData) && segmentsData.length > 0) {
                        setSegments(segmentsData);
                    }
                }

                // Load sub-segments if segment is persisted
                if (segmentState && !subSegments.length) {
                    const subSegResponse = await httpRequest(
                        "post",
                        "/egov-property-rate/property-rate/_search",
                        "",
                        [],
                        {
                            searchCriteria: {
                                segmentId: segmentState,
                                locality: locality || "",
                                getSubSegments: true
                            }
                        }
                    );

                    const subSegmentsData = (subSegResponse && (
                        subSegResponse.subSegments ||
                        subSegResponse.SubSegments ||
                        subSegResponse.subSegmentList ||
                        subSegResponse.data
                    )) || [];

                    if (Array.isArray(subSegmentsData) && subSegmentsData.length > 0) {
                        const subSegmentOptions = subSegmentsData.map((s, idx) => ({
                            code: String(s.code || s.subSegmentId || s.id || s.value || idx + 1),
                            name: s.name || s.label || s.display || s.subSegmentName || (s.code || `Sub-Segment ${idx + 1}`)
                        }));
                        setSubSegments(subSegmentOptions);
                    }
                }



            } catch (error) {
                console.error('Error loading persisted dropdown data:', error);
            }
        };

        // Only load if we have persisted values
        if (districtState || tehsilState || villageState) {
            loadPersistedDropdowns();
        }
    }, [districtState, tehsilState, villageState]);

    // Note: Tehsil, Village, and Segment options are now loaded exclusively
    // via API calls in their respective change handlers and the
    // loadPersistedDropdowns effect above, to avoid overwriting
    // selections with mismatched data from revenueData.

    const mobile = String(get(prepared, "ptmapPopup.mobileNumber", "") || "");

    const mdmsLocalities = get(prepared, "searchScreenMdmsData.localities", []) || [];
    const preparedLocalities = get(prepared, "localities", []) || [];
    const boundarySearch = get(prepared, "boundarys", []) || [];
    const searchCriteriaLocality = get(prepared, "searchCriteria.locality", "");

    const localities = (Array.isArray(mdmsLocalities) && mdmsLocalities.length)
        ? mdmsLocalities
        : (Array.isArray(preparedLocalities) && preparedLocalities.length)
            ? preparedLocalities
            : (Array.isArray(boundarySearch) && boundarySearch.length)
                ? boundarySearch
                : [];

    React.useEffect(() => {
        const newLocality = get(prepared, "ptmapPopup.locality", "") || "";
        setLocalityState(newLocality);
    }, [prepared]);

    // Save dropdown values to localStorage whenever they change
    React.useEffect(() => {
        if (districtState) localStorage.setItem("ptmap_district", districtState);
    }, [districtState]);

    React.useEffect(() => {
        if (tehsilState) localStorage.setItem("ptmap_tehsil", tehsilState);
    }, [tehsilState]);

    React.useEffect(() => {
        if (villageState) localStorage.setItem("ptmap_village", villageState);
    }, [villageState]);

    React.useEffect(() => {
        if (segmentState) localStorage.setItem("ptmap_segment", segmentState);
    }, [segmentState]);

    React.useEffect(() => {
        if (usageCategoryState) localStorage.setItem("ptmap_usageCategory", usageCategoryState);
    }, [usageCategoryState]);

    React.useEffect(() => {
        if (subUsageCategoryState) localStorage.setItem("ptmap_subUsageCategory", subUsageCategoryState);
    }, [subUsageCategoryState]);

    React.useEffect(() => {
        if (subUsageCategoryValue) localStorage.setItem("ptmap_subUsageCategoryValue", subUsageCategoryValue);
    }, [subUsageCategoryValue]);

    // Auto-fill dropdown values from rowdatacomplete
    React.useEffect(() => {
        const autoFillDropdowns = async () => {
            if (!rowdatacomplete) return;

            try {
                // Auto-fill district
                if (rowdatacomplete.districtid) {
                    const districtId = String(rowdatacomplete.districtid);
                    setDistrictState(districtId);

                    // Fetch and auto-fill tehsil
                    if (rowdatacomplete.tehsilid) {
                        const tehsilResponse = await httpRequest(
                            "post",
                            "/egov-property-rate/property-rate/_search",
                            "",
                            [],
                            { searchCriteria: { districtId: districtId, locality: locality || "" } }
                        );
                        const tehsilsData = (tehsilResponse && tehsilResponse.tehsils) || [];
                        if (Array.isArray(tehsilsData) && tehsilsData.length > 0) {
                            setTehsils(tehsilsData);
                            setTehsilState(String(rowdatacomplete.tehsilid));

                            // Fetch and auto-fill village
                            if (rowdatacomplete.village_id) {
                                const villageResponse = await httpRequest(
                                    "post",
                                    "/egov-property-rate/property-rate/_search",
                                    "",
                                    [],
                                    { searchCriteria: { tehsilId: String(rowdatacomplete.tehsilid), locality: locality || "" } }
                                );
                                const villagesData = (villageResponse && (
                                    villageResponse.villages ||
                                    villageResponse.Villages ||
                                    villageResponse.villageList ||
                                    villageResponse.data
                                )) || [];
                                if (Array.isArray(villagesData) && villagesData.length > 0) {
                                    setVillages(villagesData);
                                    setVillageState(String(rowdatacomplete.village_id));

                                    // Fetch and auto-fill segment
                                    if (rowdatacomplete.segmentid) {
                                        const segmentResponse = await httpRequest(
                                            "post",
                                            "/egov-property-rate/property-rate/_search",
                                            "",
                                            [],
                                            { searchCriteria: { villageId: String(rowdatacomplete.village_id), locality: locality || "" } }
                                        );
                                        const segmentsData = (segmentResponse && (
                                            segmentResponse.segments ||
                                            segmentResponse.Segments ||
                                            segmentResponse.segmentList ||
                                            segmentResponse.data
                                        )) || [];
                                        if (Array.isArray(segmentsData) && segmentsData.length > 0) {
                                            setSegments(segmentsData);
                                            setSegmentState(String(rowdatacomplete.segmentid));

                                            // Fetch and auto-fill sub-segment
                                            if (rowdatacomplete.subsegmentid) {
                                                const subSegResponse = await httpRequest(
                                                    "post",
                                                    "/egov-property-rate/property-rate/_search",
                                                    "",
                                                    [],
                                                    {
                                                        searchCriteria: {
                                                            segmentId: String(rowdatacomplete.segmentid),
                                                            locality: locality || "",
                                                            getSubSegments: true
                                                        }
                                                    }
                                                );
                                                const subSegmentsData = (subSegResponse && (
                                                    subSegResponse.subSegments ||
                                                    subSegResponse.SubSegments ||
                                                    subSegResponse.subSegmentList ||
                                                    subSegResponse.data
                                                )) || [];
                                                if (Array.isArray(subSegmentsData) && subSegmentsData.length > 0) {
                                                    const subSegmentOptions = subSegmentsData.map((s, idx) => ({
                                                        code: String(s.code || s.subSegmentId || s.id || s.value || idx + 1),
                                                        name: s.name || s.label || s.display || s.subSegmentName || (s.code || `Sub-Segment ${idx + 1}`)
                                                    }));
                                                    setSubSegments(subSegmentOptions);
                                                    setSubUsageCategoryState(String(rowdatacomplete.subsegmentid));
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error auto-filling dropdowns from rowdatacomplete:', error);
            }
        };

        autoFillDropdowns();
    }, [rowdatacomplete]);

    const handleLocalityChange = (e) => {
        e.stopPropagation();
        e.preventDefault();
        const val = e.target.value;
        setLocalityState(val);
    };

    const handleDistrictChange = async (e) => {
        e.stopPropagation();
        const selectedDistrict = e.target.value;
        setDistrictState(selectedDistrict);
        // Reset dependent dropdowns
        setTehsilState("");
        setVillageState("");
        setSegmentState("");
        setTehsils([]);
        setVillages([]);
        setSegments([]);
        setSubSegments([]);

        // Fetch tehsils for selected district
        if (selectedDistrict) {
            try {
                setIsSubmitting(true);
                console.log("Fetching tehsils for district:", selectedDistrict);

                const requestBody = {
                    searchCriteria: {
                        districtId: selectedDistrict,
                        locality: locality || ""
                    }
                };

                const url = "/egov-property-rate/property-rate/_search";

                const response = await httpRequest(
                    "post",
                    url,
                    "",
                    [],
                    requestBody
                );

              

                // Extract tehsils from response
                const tehsilsData = (response && response.tehsils) || [];

                if (Array.isArray(tehsilsData) && tehsilsData.length > 0) {
                    setTehsils(tehsilsData);
                } else {
                    console.warn('No tehsils found for district');
                    setTehsils([]);
                }

                setIsSubmitting(false);
            } catch (error) {
                console.error('Error fetching tehsils:', error);
                setIsSubmitting(false);
                setTehsils([]);
            }
        }
    };

    const handleTehsilChange = async (e) => {
        e.stopPropagation();
        const selectedTehsil = e.target.value;
        setTehsilState(selectedTehsil);
        // Reset dependent dropdowns
        setVillageState("");
        setSegmentState("");
        setVillages([]);
        setSegments([]);
        setSubSegments([]);

        // Fetch villages for selected tehsil
        if (selectedTehsil) {
            try {
                setIsSubmitting(true);
              

                const requestBody = {
                    searchCriteria: {
                        tehsilId: selectedTehsil,
                        locality: locality || ""
                    }
                };

                const url = "/egov-property-rate/property-rate/_search";

                const response = await httpRequest(
                    "post",
                    url,
                    "",
                    [],
                    requestBody
                );

                // Extract villages from response
                const villagesData = (response && (
                    response.villages ||
                    response.Villages ||
                    response.villageList ||
                    response.data
                )) || [];

              

                if (Array.isArray(villagesData) && villagesData.length > 0) {
                    setVillages(villagesData);
                  
                } else {
                    console.warn('No villages found for tehsil');
                    setVillages([]);
                }

                setIsSubmitting(false);
            } catch (error) {
                console.error('Error fetching villages:', error);
                setIsSubmitting(false);
                setVillages([]);
            }
        }
    };

    const handleVillageChange = async (e) => {
        e.stopPropagation();
        const selectedVillage = e.target.value;
        setVillageState(selectedVillage);
        setSegmentState("");
        setSegments([]);
        setSubSegments([]);

        // Fetch segments for selected village
        if (selectedVillage) {
            try {
                setIsSubmitting(true);
              
                const requestBody = {
                    searchCriteria: {
                        villageId: selectedVillage,
                        locality: locality || ""
                    }
                };

                const url = "/egov-property-rate/property-rate/_search";

                const response = await httpRequest(
                    "post",
                    url,
                    "",
                    [],
                    requestBody
                );

                // Extract segments from response
                const segmentsData = (response && (
                    response.segments ||
                    response.Segments ||
                    response.segmentList ||
                    response.data
                )) || [];
             

                if (Array.isArray(segmentsData) && segmentsData.length > 0) {
                    setSegments(segmentsData);
                } else {
                    console.warn('No segments found for village');
                    setSegments([]);
                }

                setIsSubmitting(false);
            } catch (error) {
                console.error('Error fetching segments:', error);
                setIsSubmitting(false);
                setSegments([]);
            }
        }
    };

    const handleSegmentChange = async (e) => {
        e.stopPropagation();
        const selectedSegment = e.target.value;
        setSegmentState(selectedSegment);
        // setUsageCategoryState("");
        //setSubUsageCategoryState("");
        //setUsageCategories([]);
        //setSubSegments([]);

        if (!selectedSegment) {
            return;
        }

        // Fetch sub-segments for selected segment
        try {
            setIsSubmitting(true);
       
            const subSegRequestBody = {
                searchCriteria: {
                    segmentId: selectedSegment,
                    locality: locality || "",
                    getSubSegments: true
                }
            };

    

            const subSegResponse = await httpRequest(
                "post",
                "/egov-property-rate/property-rate/_search",
                "",
                [],
                subSegRequestBody
            );

            

            const subSegmentsData = (subSegResponse && (
                subSegResponse.subSegments ||
                subSegResponse.SubSegments ||
                subSegResponse.subSegmentList ||
                subSegResponse.data
            )) || [];

            if (Array.isArray(subSegmentsData) && subSegmentsData.length > 0) {
                const subSegmentOptions = subSegmentsData.map((s, idx) => ({
                    code: String(s.code || s.subSegmentId || s.id || s.value || idx + 1),
                    name: s.name || s.label || s.display || s.subSegmentName || (s.code || `Sub-Segment ${idx + 1}`)
                }));
               
                setSubSegments(subSegmentOptions);
            } else {
                console.warn('No sub-segments found for segment');
                setSubSegments([]);
            }

            setIsSubmitting(false);
        } catch (error) {
            console.error('Error fetching sub-segments:', error);
            setIsSubmitting(false);
            setSubSegments([]);
        }

    };

    const handleUsageCategoryChange = async (e) => {
        e.stopPropagation();
        const selectedUsageCategory = e.target.value;
        setUsageCategoryState(selectedUsageCategory);
        setSubUsageCategoryValue("");
        setSubUsageCategories([]);

        if (!selectedUsageCategory) {
            // Reset rate values if no category selected
            setMappedRate(null);
            setMappedRateId(null);
            setMappedSegmentName(null);
            setMappedunit(null);
            return;
        }

        try {
            setIsSubmitting(true);
         

            const requestBody = {
                searchCriteria: {
                    segmentId: segmentState,
                    subSegmentId: subUsageCategoryState,
                    propertyId: propertiesId,
                    districtId: districtState,
                    tehsilId: tehsilState,
                    villageId: villageState,
                    locality: locality || "",
                    usageCategoryId: selectedUsageCategory,
                    tenantId: tenantIdValue,
                    isRateCheck: true
                }
            };

         

            const url = "/egov-property-rate/property-rate/_search";

            const response = await httpRequest(
                "post",
                url,
                "",
                [],
                requestBody
            );


            // Extract and set rate information from response
            if (response && response.rates && Array.isArray(response.rates) && response.rates.length > 0) {
                const rateData = response.rates[0];
                setMappedRate(rateData.rate || 0);
                setMappedunit(rateData.unit || "");
                setMappedRateId(rateData.id || rateData.rateId || null);
                setMappedSegmentName(rateData.segmentName || null);
            } else {
                alert('Failed to fetch rate information. Please check console for details.');
                setMappedRate(0);
                setMappedunit("");
                setMappedRateId(0);
            }

            setIsSubmitting(false);
        } catch (error) {
           
            setIsSubmitting(false);
            setMappedRate(0);
            setMappedRateId(0);
            setMappedSegmentName(null);
            setMappedunit(null);

            alert('Failed to fetch rate information. Please check console for details.');
        }
    };

    const handleSubUsageCategoryValueChange = (e) => {
        e.stopPropagation();
        setSubUsageCategoryValue(e.target.value);
    };

    const handleSubUsageCategoryChange = async (e) => {
        e.stopPropagation();
        const selectedSubSegment = e.target.value;
        setSubUsageCategoryState(selectedSubSegment);

        if (!selectedSubSegment) {
            return;
        }

        try {
            setIsSubmitting(true);
        

            const requestBody = {
                searchCriteria: {
                    // segmentId: segmentState,
                    // subSegmentId: selectedSubSegment,
                    // locality: locality || "",
                    getUsageCategories: true
                }
            };

            const url = "/egov-property-rate/property-rate/_search";

            const response = await httpRequest(
                "post",
                url,
                "",
                [],
                requestBody
            );

         

            const usageData = (response && (
                response.usageCategories ||
                response.usageCategoryList ||
                response.usageCategory ||
                response.categories ||
                response.data
            )) || [];

            let usageOptions = [];
            if (Array.isArray(usageData) && usageData.length > 0) {
                usageOptions = usageData.map((u, idx) => ({
                    code: String(u.code || u.categoryId || u.id || u.value || idx + 1),
                    name: u.name || u.label || u.display || (u.code || u.categoryId || `Option ${idx + 1}`)
                }));
            }

            if (usageOptions.length) {
                setUsageCategories(usageOptions);
            } else {
                // setUsageCategories([]);
            }

            setIsSubmitting(false);

            // Call rate check API after sub-segment change
            if (districtState && tehsilState && villageState && segmentState && usageCategoryState) {
                await callRateCheckAPI(selectedSubSegment);
            }
        } catch (error) {
            console.error("Error fetching usage categories for sub-segment:", error);
            setIsSubmitting(false);
            //  setUsageCategories([]);
        }
        const callRateCheckAPI = async (subSegmentId) => {
            try {
                setIsSubmitting(true);
                const tenantIdValue = get(prepared, "searchCriteria.tenantId", "") || localStorage.getItem("tenant-id") || "pb.amritsar";

                const requestBody = {
                    searchCriteria: {
                        segmentId: segmentState,
                        subSegmentId: subSegmentId,
                        propertyId: propertiesId,
                        districtId: districtState,
                        tehsilId: tehsilState,
                        villageId: villageState,
                        locality: locality,
                        usageCategoryId: usageCategoryState,
                        tenantId: tenantIdValue,
                        isRateCheck: true
                    }
                };

                const url = "/egov-property-rate/property-rate/_search";
                const response = await httpRequest("post", url, "", [], requestBody);


                if (response) {
                    if (response.rates !== undefined && response.rates.length > 0) {
                        if (response.rates[0].rate !== undefined) {
                            setMappedRate(response.rates[0].rate);
                        }
                        if (response.rates[0].rateId) {
                            setMappedRateId(response.rates[0].rateId);
                        }
                        if (response.rates[0].segmentName) {
                            setMappedSegmentName(response.rates[0].segmentName);
                        }
                        if (response.rates[0].unit && response.rates[0].unit.name) {
                            setMappedunit(response.rates[0].unit.name);
                        }
                        //  setDialogOpen(true);
                    } else {
                        alert("No Collector Rate has been notified for this usage-type in this Revenue Segment.");
                    }
                }

                setIsSubmitting(false);
            } catch (error) {
                console.error('Error checking rate:', error);
                setIsSubmitting(false);
                setMappedRate(0);
                setMappedRateId(0);
                setMappedSegmentName(null);
                setMappedunit("");
                alert("No Collector Rate has been notified for this usage-type in this Revenue Segment.");
                //  setDialogOpen(true);
            }
        };

        // Call rate check API when sub segment changes if all required fields are filled
        if (selectedSubSegment && districtState && tehsilState && villageState && segmentState && usageCategoryState) {
            callRateCheckAPI(selectedSubSegment);
        }
    };




    const tenantIdValue = get(prepared, "searchCriteria.tenantId", "");

    const handleMapProperties = async () => {
        // Remove the alert and directly open the dialog
        //  setDialogOpen(true);
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);

            // Prepare request body
            const requestBody = {
                "PropertyRates": [
                    {
                        "id": rowdatacomplete.integration_id,
                        "propertyId": propertiesId,
                        "tenantId": tenantIdValue,
                        "districtId": districtState,
                        "tehsilId": tehsilState,
                        "villageId": villageState,
                        "isUrban": true,
                        "segmentId": segmentState,
                        "subSegmentId": subUsageCategoryState,
                        "categoryId": usageCategoryState,
                        "locality": locality || "",
                        "rate": mappedRate || 0,
                        "unit": mappedunit || "",
                        "rateId": mappedRateId,
                        "isActive": true,
                        "isProrataCal": false,
                        "isModified": true
                    }
                ]
            };

            const url = "/egov-property-rate/property-rate/_update";

            const response = await httpRequest(
                "post",
                url,
                "",
                [],
                requestBody
            );

            alert("Property rate mapping submitted successfully!");
            setDialogOpen(false);
            onClose();
            setIsSubmitting(false);
        } catch (error) {
            console.error("Error submitting property rate:", error);
            alert("Failed to submit property rate: " + (error.message || "Unknown error"));
            setIsSubmitting(false);
        }
    };

    const handleConfirmMapping = async () => {

        if (!districtState || !tehsilState || !villageState || !segmentState || !usageCategoryState) {
            alert("Please fill all required fields");
            return;
        }

        if (!rowdatacomplete) {
            alert("Row data is missing. Please try again.");
            return;
        }

        try {
            setIsSubmitting(true);
            
            const requestBody = {
                PropertyRates: [{
                    id: rowdatacomplete.integration_id,
                    propertyId: propertiesId,
                    tenantId: tenantIdValue,
                    districtId: districtState,
                    tehsilId: tehsilState,
                    villageId: villageState,
                    "landArea": rowdatacomplete.landarea,
                    segmentId: segmentState,
                    subSegmentId: subUsageCategoryState,
                    locality: locality,
                    usageCategoryId: usageCategoryState,
                    rate: mappedRate || 0,
                    rateId: mappedRateId || 0,
                    unit: mappedunit || "",
                    isModified: true

                }]
            };
          

            const url = "/egov-property-rate/property-rate/_update";

            const response = await httpRequest(
                "post",
                url,
                "",
                [],
                requestBody
            );

         

            // Close all popups first, then show success message
            if (response) {
                setDialogOpen(false);
                if (onClose) onClose(); // Close inner dialog
                if (onCloseAll) onCloseAll(); // Close outer dialog

                // Show alert after all popups are closed
                setTimeout(() => {
                    alert("Property rate mapping submitted successfully!");
                }, 200);
            } else {
                alert("No response from server");
            }

            setIsSubmitting(false);
        } catch (error) {
            console.error('Error mapping property:', error);
            setIsSubmitting(false);
            alert("Failed to map property: " + (error.message || "Unknown error"));
        }
    };

    return (
        <div style={{ padding: "24px", fontFamily: "'Roboto', sans-serif" }}>
            {/* Header Section with Property Details Card */}
            <div style={{
                background: "#ffffff",
                borderRadius: "8px",
                padding: "24px",
                marginBottom: "24px",
                border: "1px solid #e0e0e0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
            }}>
                <h2 style={{
                    margin: "0 0 20px 0",
                    fontSize: "20px",
                    fontWeight: 600,
                    color: "#333",
                    borderBottom: "2px solid #FF5722",
                    paddingBottom: "12px",
                    display: "inline-block"
                }}>
                    Property Details
                </h2>

                <div style={{
                    border: "1px solid #e6e6e6",
                    borderRadius: "10px",
                    padding: "20px",
                    backgroundColor: "#fafafa",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    marginBottom: "20px"
                }}>
                    <h2 style={{
                        margin: "0 0 16px 0",
                        fontSize: "18px",
                        fontWeight: 600,
                        color: "#333",
                        borderBottom: "2px solid #FF5722",
                        display: "inline-block",
                        paddingBottom: "6px"
                    }}>
                        Mseva Property Details
                    </h2>

                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "16px",
                        marginTop: "12px"
                    }}>
                        <div>
                            <div style={{ fontSize: "12px", color: "#757575", fontWeight: 600 }}>Property ID</div>
                            <div style={{ fontSize: "15px", color: "#222", fontWeight: 600 }}>{(propertyData && propertyData.propertyId) || propertiesId || "N/A"}</div>
                        </div>

                        <div>
                            <div style={{ fontSize: "12px", color: "#757575", fontWeight: 600 }}>Owner Name</div>
                            <div style={{ fontSize: "15px", color: "#222", fontWeight: 600 }}>{(propertyData && propertyData.owners && propertyData.owners.map(owner => owner.name).join(", ")) || ownerName || "N/A"}</div>
                        </div>

                        <div>
                            <div style={{ fontSize: "12px", color: "#757575", fontWeight: 600 }}>Mobile Number</div>
                            <div style={{ fontSize: "15px", color: "#222", fontWeight: 600 }}>{(propertyData && propertyData.owners && propertyData.owners.map(owner => owner.mobileNumber).join(", ")) || ownerMobile || "N/A"}</div>
                        </div>

                        <div>
                            <div style={{ fontSize: "12px", color: "#757575", fontWeight: 600 }}>Locality</div>
                            <div style={{ fontSize: "15px", color: "#222", fontWeight: 600 }}>{propertyData && propertyData.address && propertyData.address.locality ? propertyData.address.locality.name : locality || "N/A"}</div>
                        </div>

                        <div>
                            <div style={{ fontSize: "12px", color: "#757575", fontWeight: 600 }}>Land Area/build Area</div>
                            <div style={{ fontSize: "15px", color: "#222", fontWeight: 600 }}>
                                {propertyData && propertyData.landArea ? `${propertyData.landArea} sq.yards` : propertyData && propertyData.superBuiltUpArea ? `${propertyData.superBuiltUpArea} sq.yards` : "N/A"}
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: "12px", color: "#757575", fontWeight: 600 }}>Usage Category</div>
                            <div style={{ fontSize: "15px", color: "#222", fontWeight: 600 }}>{propertyData && propertyData.usageCategory ? propertyData.usageCategory : usageCategory || "N/A"}</div>
                        </div>

                        <div>
                            <div style={{ fontSize: "12px", color: "#757575", fontWeight: 600 }}>No of Floors</div>
                            <div style={{ fontSize: "15px", color: "#222", fontWeight: 600 }}>{propertyData && propertyData.noOfFloors ? propertyData.noOfFloors : noOfFloors || "N/A"}</div>
                        </div>

                        <div style={{ gridColumn: "1 / -1" }}>
                            <div style={{ fontSize: "12px", color: "#757575", fontWeight: 600 }}>Address</div>
                            <div style={{ fontSize: "15px", color: "#222", fontWeight: 600 }}>{fullAddressss}</div>
                        </div>
                    </div>
                </div>

                <div style={{
                    border: "1px solid #e6e6e6",
                    borderRadius: "10px",
                    padding: "20px",
                    backgroundColor: "#fafafa",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
                }}>
                    <h2 style={{
                        margin: "0 0 16px 0",
                        fontSize: "18px",
                        fontWeight: 600,
                        color: "#333",
                        borderBottom: "2px solid #FF5722",
                        display: "inline-block",
                        paddingBottom: "6px"
                    }}>
                        Revenue Property Details
                    </h2>

                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "16px",
                        marginTop: "12px"
                    }}>
                        <div>
                            <div style={{ fontSize: "12px", color: "#757575", fontWeight: 600 }}>Property ID</div>
                            <div style={{ fontSize: "15px", color: "#222", fontWeight: 600 }}>{propertiesId || "N/A"}</div>
                        </div>

                        <div>
                            <div style={{ fontSize: "12px", color: "#757575", fontWeight: 600 }}>Owner Name</div>
                            <div style={{ fontSize: "15px", color: "#222", fontWeight: 600 }}>{ownerName || "N/A"}</div>
                        </div>

                        <div>
                            <div style={{ fontSize: "12px", color: "#757575", fontWeight: 600 }}>Mobile Number</div>
                            <div style={{ fontSize: "15px", color: "#222", fontWeight: 600 }}>{ownerMobile || "N/A"}</div>
                        </div>

                        <div>
                            <div style={{ fontSize: "12px", color: "#757575", fontWeight: 600 }}>Locality</div>
                            <div style={{ fontSize: "15px", color: "#222", fontWeight: 600 }}>{propertyData && propertyData.address && propertyData.address.locality ? propertyData.address.locality.name : "N/A"}</div>
                        </div>

                        <div>
                            <div style={{ fontSize: "12px", color: "#757575", fontWeight: 600 }}>District</div>
                            <div style={{ fontSize: "15px", color: "#222", fontWeight: 600 }}>{rowdatacomplete.district_name || "N/A"}</div>
                        </div>

                        <div>
                            <div style={{ fontSize: "12px", color: "#757575", fontWeight: 600 }}>Tehsil</div>
                            <div style={{ fontSize: "15px", color: "#222", fontWeight: 600 }}>{rowdatacomplete.tehsil_name || "N/A"}</div>
                        </div>

                        <div>
                            <div style={{ fontSize: "12px", color: "#757575", fontWeight: 600 }}>Village</div>
                            <div style={{ fontSize: "15px", color: "#222", fontWeight: 600 }}>{rowdatacomplete.village_name || "N/A"}</div>
                        </div>

                        <div>
                            <div style={{ fontSize: "12px", color: "#757575", fontWeight: 600 }}>Segment</div>
                            <div style={{ fontSize: "15px", color: "#222", fontWeight: 600 }}>{rowdatacomplete.segment_name || "N/A"}</div>
                        </div>

                        <div>
                            <div style={{ fontSize: "12px", color: "#757575", fontWeight: 600 }}>Sub Segment </div>
                            <div style={{ fontSize: "15px", color: "#222", fontWeight: 600 }}>{rowdatacomplete.sub_segment_name || "N/A"}</div>
                        </div>

                        <div>
                            <div style={{ fontSize: "12px", color: "#757575", fontWeight: 600 }}>Land Area/build Area</div>
                            <div style={{ fontSize: "15px", color: "#222", fontWeight: 600 }}>
                                {landArea ? `${landArea} sq.yards` : "N/A"}
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: "12px", color: "#757575", fontWeight: 600 }}>Usage Category</div>
                            <div style={{ fontSize: "15px", color: "#222", fontWeight: 600 }}>
                                {(USAGE_CATEGORY_OPTIONS.find(uc => String(uc.code) === String(rowdatacomplete.categoryid)) || {}).name || "N/A"}
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: "12px", color: "#757575", fontWeight: 600 }}>No of Floors</div>
                            <div style={{ fontSize: "15px", color: "#222", fontWeight: 600 }}>{noOfFloors || "N/A"}</div>
                        </div>

                        <div>
                            <div style={{ fontSize: "12px", color: "#757575", fontWeight: 600 }}>Collect Rate</div>
                            <div style={{ fontSize: "15px", color: "#222", fontWeight: 600 }}>
                                {(rowdatacomplete.rate === 0 || rowdatacomplete.rate === -1 || rowdatacomplete.rate === "0" || rowdatacomplete.rate === "-1")
                                    ? <span >Collector Rate not notified.</span>
                                    : rowdatacomplete.rate
                                        ? `₹${rowdatacomplete.rate.toLocaleString()}${rowdatacomplete.unit ? ` / ${rowdatacomplete.unit}` : ''}`
                                        : "N/A"
                                }
                            </div>
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                            <div style={{ fontSize: "12px", color: "#757575", fontWeight: 600 }}>Address</div>
                            <div style={{ fontSize: "15px", color: "#222", fontWeight: 600 }}>{fullAddressss}</div>
                        </div>
                    </div>
                </div>

                {/* Mapping Section */}
                <div style={{
                    background: "#fff",
                    borderRadius: "8px",
                    padding: "24px",
                    border: "1px solid #e0e0e0",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
                }}>
                    <h3 style={{
                        margin: "0 0 20px 0",
                        fontSize: "18px",
                        fontWeight: 600,
                        color: "#333"
                    }}>
                        Map Property to Revenue
                    </h3>

                    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                        {/* District Field */}
                        <div style={{ flex: "1 1 calc(50% - 10px)", minWidth: "250px" }}>
                            <label style={{
                                display: "block",
                                marginBottom: "8px",
                                fontSize: "14px",
                                fontWeight: 500,
                                color: "#555"
                            }}>
                                District <span style={{ color: "#e53935" }}>*</span>
                            </label>
                            <select
                                value={districtState}
                                onChange={handleDistrictChange}
                                onClick={(e) => e.stopPropagation()}
                                disabled
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    border: "1px solid #ccc",
                                    borderRadius: "4px",
                                    fontSize: "14px",
                                    backgroundColor: "#f5f5f5",
                                    color: "#777",
                                    boxSizing: "border-box",
                                    cursor: "not-allowed"
                                }}
                            >
                                <option value="">Select District</option>
                                {districts.map((district, idx) => (
                                    <option key={idx} value={district.code}>
                                        {district.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Tehsil Field */}
                        <div style={{ flex: "1 1 calc(50% - 10px)", minWidth: "250px" }}>
                            <label style={{
                                display: "block",
                                marginBottom: "8px",
                                fontSize: "14px",
                                fontWeight: 500,
                                color: "#555"
                            }}>
                                Tehsil <span style={{ color: "#e53935" }}>*</span>
                            </label>
                            <select
                                value={tehsilState}
                                onChange={handleTehsilChange}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    border: "1px solid #ccc",
                                    borderRadius: "4px",
                                    fontSize: "14px",
                                    backgroundColor: "#fff",
                                    color: "#333",
                                    boxSizing: "border-box",
                                    cursor: "pointer"
                                }}
                            >
                                <option value="">Select Tehsil</option>
                                {tehsils.map((tehsil, idx) => (
                                    <option key={idx} value={tehsil.code}>
                                        {tehsil.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Village Field */}
                        <div style={{ flex: "1 1 calc(50% - 10px)", minWidth: "250px" }}>
                            <label style={{
                                display: "block",
                                marginBottom: "8px",
                                fontSize: "14px",
                                fontWeight: 500,
                                color: "#555"
                            }}>
                                Village <span style={{ color: "#e53935" }}>*</span>
                            </label>
                            <select
                                value={villageState}
                                onChange={handleVillageChange}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    border: "1px solid #ccc",
                                    borderRadius: "4px",
                                    fontSize: "14px",
                                    backgroundColor: "#fff",
                                    color: "#333",
                                    boxSizing: "border-box",
                                    cursor: "pointer"
                                }}
                            >
                                <option value="">Select Village</option>
                                {villages.map((village, idx) => (
                                    <option key={idx} value={village.code}>
                                        {village.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Segment Field */}
                        <div style={{ flex: "1 1 calc(50% - 10px)", minWidth: "250px" }}>
                            <label style={{
                                display: "block",
                                marginBottom: "8px",
                                fontSize: "14px",
                                fontWeight: 500,
                                color: "#555"
                            }}>
                                Segment <span style={{ color: "#e53935" }}>*</span>
                            </label>
                            <select
                                value={segmentState}
                                onChange={handleSegmentChange}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    border: "1px solid #ccc",
                                    borderRadius: "4px",
                                    fontSize: "14px",
                                    backgroundColor: "#fff",
                                    color: "#333",
                                    boxSizing: "border-box",
                                    cursor: "pointer"
                                }}
                            >
                                <option value="">Select Segment</option>
                                {segments.map((segment, idx) => (
                                    <option key={idx} value={segment.code}>
                                        {segment.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Sub Segment Field */}
                        <div style={{ flex: "1 1 calc(50% - 10px)", minWidth: "250px" }}>
                            <label style={{
                                display: "block",
                                marginBottom: "8px",
                                fontSize: "14px",
                                fontWeight: 500,
                                color: "#555"
                            }}>
                                Sub Segment
                            </label>
                            <select
                                value={subUsageCategoryState}
                                onChange={handleSubUsageCategoryChange}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    border: "1px solid #ccc",
                                    borderRadius: "4px",
                                    fontSize: "14px",
                                    backgroundColor: "#fff",
                                    color: "#333",
                                    boxSizing: "border-box",
                                    cursor: "pointer"
                                }}
                            >
                                <option value="">Select Sub Segment</option>
                                {subSegments && subSegments.length > 0 &&
                                    subSegments.map((ss, idx) => (
                                        <option key={idx} value={ss.code}>
                                            {ss.name}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        {/* Usage Category Field */}
                        <div style={{ flex: "1 1 calc(50% - 10px)", minWidth: "250px" }}>
                            <label style={{
                                display: "block",
                                marginBottom: "8px",
                                fontSize: "14px",
                                fontWeight: 500,
                                color: "#555"
                            }}>
                                Usage Category <span style={{ color: "#e53935" }}>*</span>
                            </label>
                            <select
                                value={usageCategoryState}
                                onChange={handleUsageCategoryChange}
                                onClick={(e) => e.stopPropagation()}
                                disabled={String(usageCategory || "").trim().toUpperCase() !== "MIXED"}
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    border: "1px solid #ccc",
                                    borderRadius: "4px",
                                    fontSize: "14px",
                                    backgroundColor: String(usageCategory || "").trim().toUpperCase() !== "MIXED" ? "#f5f5f5" : "#fff",
                                    color: String(usageCategory || "").trim().toUpperCase() !== "MIXED" ? "#999" : "#333",
                                    boxSizing: "border-box",
                                    cursor: String(usageCategory || "").trim().toUpperCase() !== "MIXED" ? "not-allowed" : "pointer"
                                }}
                            >
                                <option value="">Select Usage Category</option>
                                {USAGE_CATEGORY_OPTIONS.map((uc, idx) => (
                                    <option key={idx} value={uc.code}>{uc.name}</option>
                                ))}
                            </select>
                        </div>

                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div style={{
                display: "flex",
                gap: "16px",
                marginTop: "24px",
                justifyContent: "flex-end"
            }}>
                <button
                    type="button"
                    style={{
                        minWidth: "120px",
                        color: "#FF5722",
                        fontSize: "14px",
                        fontWeight: 500,
                        backgroundColor: "#fff",
                        border: "1px solid #FF5722",
                        padding: "10px 24px",
                        borderRadius: "4px",
                        cursor: "pointer"
                    }}
                    onClick={onClose}
                >
                    Cancel
                </button>

                <button
                    type="button"
                    style={{
                        minWidth: "160px",
                        color: "white",
                        fontSize: "14px",
                        fontWeight: 500,
                        background: "#FF5722",
                        border: "none",
                        padding: "10px 24px",
                        borderRadius: "4px",
                        cursor: isSubmitting ? "not-allowed" : "pointer",
                        opacity: isSubmitting ? 0.6 : 1
                    }}
                    onClick={handleConfirmMapping}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Mapping..." : "Map Properties"}
                </button>
            </div>

            <Dialog
                open={dialogOpen}
                isClose={true}
                handleClose={handleDialogClose}
                bodyStyle={{ padding: "24px", backgroundColor: "#ffffff", maxHeight: "90vh", overflowY: "auto" }}
                contentStyle={{ width: "800px", maxWidth: "95%", backgroundColor: "#ffffff", maxHeight: "90vh" }}
            >
                <div style={{ padding: "16px 20px 0", fontSize: "18px", fontWeight: 600 }}>
                    Property Revenue Maped Details
                </div>
                <MapPTPopup
                    propertiesId={propertiesId}
                    ownerName={ownerName}
                    ownerMobile={ownerMobile}
                    landArea={landArea}
                    noOfFloors={noOfFloors}
                    locality={locality}
                    usageCategory={(USAGE_CATEGORY_OPTIONS.find(u => u.code === usageCategoryState || u.name.toUpperCase() === (usageCategory || '').toUpperCase()) || {}).name || usageCategory}
                    address={address}
                    district={(districts.find(d => d.code === districtState) || {}).name || districtState}
                    tehsil={(tehsils.find(t => t.code === tehsilState) || {}).name || tehsilState}
                    village={(villages.find(v => v.code === villageState) || {}).name || villageState}
                    segment={(segments.find(s => s.code === segmentState) || {}).name || segmentState}
                    subSegmentValue={(subSegments.find(ss => ss.code === subUsageCategoryState) || {}).name || subUsageCategoryState}
                    rate={mappedRate}
                    unit={mappedunit}
                    rateId={mappedRateId}
                    segmentName={mappedSegmentName}
                    onClose={handleDialogClose}
                    onSubmit={handleSubmit}
                />
            </Dialog>
        </div>
    );
};

const mapStateToProps = (state) => ({
    prepared: get(state, "screenConfiguration.preparedFinalObject", {})
});

const mapDispatchToProps = (dispatch) => ({
    dispatch
});

export default connect(mapStateToProps, mapDispatchToProps)(PTmapPopup);
