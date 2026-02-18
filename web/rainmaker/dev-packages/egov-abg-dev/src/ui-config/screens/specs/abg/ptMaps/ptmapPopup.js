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
import MapPTPopup from "./mapptpopup";
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
const PTmapPopup = ({ propertiesId, ownerName, ownerMobile, locality, landArea, propertyType, usageCategory, noOfFloors, address, onClose, prepared, dispatch }) => {

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
    const [usageCategoryState, setUsageCategoryState] = React.useState(() => localStorage.getItem("ptmap_usageCategory") || "");
    const [subUsageCategoryState, setSubUsageCategoryState] = React.useState(() => localStorage.getItem("ptmap_subUsageCategory") || "");
    const [usageCategories, setUsageCategories] = React.useState([]);
    const [subUsageCategories, setSubUsageCategories] = React.useState([]);
    const [subUsageCategoryValue, setSubUsageCategoryValue] = React.useState(() => localStorage.getItem("ptmap_subUsageCategoryValue") || "");

    const [mappedRate, setMappedRate] = React.useState(null);
    const [mappedunit, setMappedunit] = React.useState(null);
    const [mappedRateId, setMappedRateId] = React.useState(null);
    const [mappedSegmentName, setMappedSegmentName] = React.useState(null);

    // Fetch revenue data when popup opens (component mounts)
    React.useEffect(() => {
        const fetchRevenueData = async () => {
            try {
                setIsSubmitting(true);
                console.log("Fetching revenue data on popup open");
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

                console.log('Revenue data fetched on mount:', response);
                setRevenueData(response);
                debugger;
                const propertydisits = (response && response.districts) || [];



                if (Array.isArray(propertydisits) && propertydisits.length > 0) {

                    setDistricts(propertydisits);
                    console.log('Districts extracted:', propertydisits);

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
                    console.warn('No property rates found in response. Full response:', response);
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

                // Load usage categories if segment and sub-segment are persisted
                if (segmentState && subUsageCategoryState && !usageCategories.length) {
                    const usageSearchCriteria = {
                        segmentId: segmentState,
                        subSegmentId: subUsageCategoryState,
                        locality: locality || "",
                        getUsageCategories: true
                    };

                    const usageResponse = await httpRequest(
                        "post",
                        "/egov-property-rate/property-rate/_search",
                        "",
                        [],
                        { searchCriteria: usageSearchCriteria }
                    );

                    const usageData = (usageResponse && (
                        usageResponse.usageCategories ||
                        usageResponse.usageCategoryList ||
                        usageResponse.usageCategory ||
                        usageResponse.categories ||
                        usageResponse.data
                    )) || [];

                    if (Array.isArray(usageData) && usageData.length > 0) {
                        const usageOptions = usageData.map((u, idx) => ({
                            code: String(u.code || u.categoryId || u.id || u.value || idx + 1),
                            name: u.name || u.label || u.display || (u.code || u.categoryId || `Option ${idx + 1}`)
                        }));
                        setUsageCategories(usageOptions);
                    }
                }


            } catch (error) {
                console.error('Error loading persisted dropdown data:', error);
            }
        };

        // Only load if we have persisted values
        if (districtState || tehsilState || villageState || segmentState) {
            loadPersistedDropdowns();
        }
    }, [districtState, tehsilState, villageState, segmentState]);

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

                console.log('Tehsils fetched for district:', response);

                // Extract tehsils from response
                const tehsilsData = (response && response.tehsils) || [];

                if (Array.isArray(tehsilsData) && tehsilsData.length > 0) {
                    setTehsils(tehsilsData);
                    console.log('Tehsils set:', tehsilsData);
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

        // Fetch villages for selected tehsil
        if (selectedTehsil) {
            try {
                setIsSubmitting(true);
                console.log("Fetching villages for tehsil:", selectedTehsil);

                const requestBody = {
                    searchCriteria: {
                        tehsilId: selectedTehsil,
                        locality: locality || ""
                    }
                };

                console.log("Request body for villages:", requestBody);

                const url = "/egov-property-rate/property-rate/_search";

                const response = await httpRequest(
                    "post",
                    url,
                    "",
                    [],
                    requestBody
                );

                console.log('Villages fetched for tehsil:', response);
                console.log('Response structure:', Object.keys(response || {}));

                // Extract villages from response
                const villagesData = (response && (
                    response.villages ||
                    response.Villages ||
                    response.villageList ||
                    response.data
                )) || [];

                console.log('Villages data extracted:', villagesData);

                if (Array.isArray(villagesData) && villagesData.length > 0) {
                    setVillages(villagesData);
                    console.log('Villages set:', villagesData);
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

        // Fetch segments for selected village
        if (selectedVillage) {
            try {
                setIsSubmitting(true);
                console.log("Fetching segments for village:", selectedVillage);

                const requestBody = {
                    searchCriteria: {
                        villageId: selectedVillage,
                        locality: locality || ""
                    }
                };

                console.log("Request body for segments:", JSON.stringify(requestBody));

                const url = "/egov-property-rate/property-rate/_search";

                const response = await httpRequest(
                    "post",
                    url,
                    "",
                    [],
                    requestBody
                );

                console.log('Segments fetched for village:', response);
                console.log('Response structure:', Object.keys(response || {}));

                // Extract segments from response
                const segmentsData = (response && (
                    response.segments ||
                    response.Segments ||
                    response.segmentList ||
                    response.data
                )) || [];
                console.log('Segments data extracted:', segmentsData);

                if (Array.isArray(segmentsData) && segmentsData.length > 0) {
                    setSegments(segmentsData);
                    console.log('Segments set:', segmentsData);
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
        setUsageCategoryState("");
        setSubUsageCategoryState("");
        setUsageCategories([]);
        setSubSegments([]);

        if (!selectedSegment) {
            return;
        }

        // Fetch sub-segments for selected segment
        try {
            setIsSubmitting(true);
            console.log("Fetching sub-segments for segment:", selectedSegment);

            const subSegRequestBody = {
                searchCriteria: {
                    segmentId: selectedSegment,
                    locality: locality || "",
                    getSubSegments: true
                }
            };

            console.log("Request body for sub-segments:", JSON.stringify(subSegRequestBody));

            const subSegResponse = await httpRequest(
                "post",
                "/egov-property-rate/property-rate/_search",
                "",
                [],
                subSegRequestBody
            );

            console.log('Sub-segments fetched for segment:', subSegResponse);

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
                console.log('Sub-segments available (normalized):', subSegmentOptions);
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


    };

    const handleSubUsageCategoryValueChange = (e) => {
        e.stopPropagation();
        setSubUsageCategoryValue(e.target.value);
    };

    const handleSubUsageCategoryChange = async (e) => {
        e.stopPropagation();
        const selectedSubSegment = e.target.value;
        setSubUsageCategoryState(selectedSubSegment);

        // Reset usage category when sub segment changes
        setUsageCategoryState("");
        setUsageCategories([]);

        if (!selectedSubSegment) {
            return;
        }

        try {
            setIsSubmitting(true);
            console.log("Fetching usage categories for sub-segment:", selectedSubSegment);

            const requestBody = {
                searchCriteria: {

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

            console.log("Usage categories fetched for sub-segment:", response);

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
                setUsageCategories([]);
            }

            setIsSubmitting(false);
        } catch (error) {
            console.error("Error fetching usage categories for sub-segment:", error);
            setIsSubmitting(false);
            setUsageCategories([]);
        }
    };

    const tenantIdValue = get(prepared, "searchCriteria.tenantId", "");

    const handleMapProperties = async () => {
        // Remove the alert and directly open the dialog
        setDialogOpen(true);
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            debugger;
            // Prepare request body
            const requestBody = {
                "PropertyRates": [
                    {
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
                        "isProrataCal": false
                    }
                ]
            };

            console.log("Submit request body:", JSON.stringify(requestBody));

            const url = "/egov-property-rate/property-rate/_create";

            const response = await httpRequest(
                "post",
                url,
                "",
                [],
                requestBody
            );

            console.log("Submit response:", response);

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

        try {
            setIsSubmitting(true);
            console.log("Mapping properties with data:", {
                propertiesId,
                district: districtState,
                tehsil: tehsilState,
                locality: locality,
                village: villageState,
                segment: segmentState,
                subSegments: subUsageCategoryState,
                usageCategory: usageCategoryState,

                tenantId: tenantIdValue
            });

            const requestBody = {
                searchCriteria: {
                    segmentId: segmentState,
                    subSegmentId: subUsageCategoryState,
                    propertyId: propertiesId,
                    districtId: districtState,
                    tehsilId: tehsilState,
                    villageId: villageState,
                    propertyType: propertyType,
                    locality: locality,
                    usageCategoryId: usageCategoryState,
                    tenantId: tenantIdValue,
                    isRateCheck: true
                }
            };

            console.log("Map Properties request body:", JSON.stringify(requestBody));

            // Call API to map property
            const url = "/egov-property-rate/property-rate/_search";

            const response = await httpRequest(
                "post",
                url,
                "",
                [],
                requestBody
            );

            console.log('Property mapping response:', response);
            debugger;
            // Show success message
            if (response) {
                // Store the rate data from API response
                if (response.rates !== undefined) {
                    setMappedRate(response.rates[0].rate);
                }
                if (response.rates[0].rateId) {
                    setMappedRateId(response.rates[0].rateId);
                }
                if (response.rates[0].segmentName) {
                    setMappedSegmentName(response.rates[0].segmentName);
                }
                if (response.rates[0].unit) {
                    setMappedSegmentName(response.rates[0].unit);
                }
                if (response.rates[0].unit) {
                    setMappedunit(response.rates[0].unit);
                }
                setDialogOpen(true);
            } else {
                alert("No response from server");
            }

            setIsSubmitting(false);
        } catch (error) {
            console.error('Error mapping property:', error);
            setIsSubmitting(false);
            alert("No rate found for this property ID with the given criteria. Please try different criteria or check the property details.");
            //alert("Failed to map property: " + (error.message || "Unknown error"));
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
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "20px",
                    marginTop: "20px"
                }}>
                    <div style={{
                        padding: "0"
                    }}>
                        <div style={{ fontSize: "13px", color: "#757575", marginBottom: "6px", fontWeight: 500 }}>Property ID</div>
                        <div style={{ fontSize: "15px", fontWeight: 600, color: "#333" }}>{propertiesId || "N/A"}</div>
                    </div>

                    <div style={{
                        padding: "0"
                    }}>
                        <div style={{ fontSize: "13px", color: "#757575", marginBottom: "6px", fontWeight: 500 }}>Owner Name</div>
                        <div style={{ fontSize: "15px", fontWeight: 600, color: "#333" }}>{ownerName || "N/A"}</div>
                    </div>

                    <div style={{
                        padding: "0"
                    }}>
                        <div style={{ fontSize: "13px", color: "#757575", marginBottom: "6px", fontWeight: 500 }}>Mobile Number</div>
                        <div style={{ fontSize: "15px", fontWeight: 600, color: "#333" }}>{ownerMobile || "N/A"}</div>
                    </div>

                    <div style={{
                        padding: "0"
                    }}>
                        <div style={{ fontSize: "13px", color: "#757575", marginBottom: "6px", fontWeight: 500 }}>Land Area/build Area</div>
                        <div style={{ fontSize: "15px", fontWeight: 600, color: "#333" }}>{landArea ? `${landArea} sq.ft` : "N/A"}</div>
                    </div>


                    <div style={{
                        padding: "0"
                    }}>
                        <div style={{ fontSize: "13px", color: "#757575", marginBottom: "6px", fontWeight: 500 }}>Property Type</div>
                        <div style={{ fontSize: "15px", fontWeight: 600, color: "#333" }}>{propertyType || "N/A"}</div>
                    </div>


                    <div style={{
                        padding: "0"
                    }}>
                        <div style={{ fontSize: "13px", color: "#757575", marginBottom: "6px", fontWeight: 500 }}>Usage Category</div>
                        <div style={{ fontSize: "15px", fontWeight: 600, color: "#333" }}>{usageCategory || "N/A"}</div>
                    </div>
                    <div style={{
                        padding: "0"
                    }}>
                        <div style={{ fontSize: "13px", color: "#757575", marginBottom: "6px", fontWeight: 500 }}>No of Floors</div>
                        <div style={{ fontSize: "15px", fontWeight: 600, color: "#333" }}>{noOfFloors || "N/A"}</div>
                    </div>
                    <div style={{
                        padding: "0"
                    }}>
                        <div style={{ fontSize: "13px", color: "#757575", marginBottom: "6px", fontWeight: 500 }}>Address</div>
                        <div style={{ fontSize: "15px", fontWeight: 600, color: "#333" }}>{address || "N/A"}</div>
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
                            <option value="">Select Usage Category</option>
                            {usageCategories && usageCategories.length > 0 ? (
                                usageCategories.map((uc, idx) => (
                                    <option key={idx} value={uc.code}>{uc.name}</option>
                                ))
                            ) : ''}
                        </select>
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
                    Property Revenue Map
                </div>
                <MapPTPopup
                    propertiesId={propertiesId}
                    ownerName={ownerName}
                    ownerMobile={ownerMobile}
                    landArea={landArea}
                    noOfFloors={noOfFloors}
                    locality={locality}
                    usageCategory={(usageCategories.find(u => u.code === usageCategoryState) || {}).name || usageCategoryState}
                    address={address}
                    district={(districts.find(d => d.code === districtState) || {}).name || districtState}
                    tehsil={(tehsils.find(t => t.code === tehsilState) || {}).name || tehsilState}
                    village={(villages.find(v => v.code === villageState) || {}).name || villageState}
                    segment={(segments.find(s => s.code === segmentState) || {}).name || segmentState}

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
