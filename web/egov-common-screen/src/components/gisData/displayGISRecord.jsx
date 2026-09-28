import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { showError } from "../../utils/toast";
import { searchPropertyBySurvey, getAddressArray, createTenantIDfromCity } from "./function"
import './index.css'

const DisplayGISRecord = () => {
    const [missingParams, setMissingParams] = useState(false);
    const [searchParams] = useSearchParams();
    const [gisData, setGISData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tenantId, setTenantId] = useState("");

    // Extract parameters from query
    const uid = searchParams.get('uid');
    const city = searchParams.get('City');

    // Fetch tenantId from city
    useEffect(() => {
        if (!city) {
            console.log("No city provided");
            return;
        }

        let isMounted = true;

        const fetchTenantId = async () => {
            try {
                const id = await createTenantIDfromCity(city);
                if (isMounted) {
                    setTenantId(id);
                }
            } catch (err) {
                if (isMounted) {
                    const errorMsg = "Failed to fetch tenant ID";
                    console.error(errorMsg, err);
                    showError(errorMsg);
                    setTenantId("");
                }
            }
        };

        fetchTenantId();

        return () => {
            isMounted = false;
        };
    }, [city]);

    // Fetch GIS data
    useEffect(() => {
        if (!uid || !tenantId) {
            return;
        }

        let isMounted = true;
        setMissingParams(false);

        const fetchGIS = async () => {
            try {
                if (isMounted) setLoading(true);
                const data = await searchPropertyBySurvey({tenantId, surveyId: uid});
                if (isMounted) {
                    setGISData(data?.Properties || []);
                }
            } catch (err) {
                if (isMounted) {
                    const errorMsg = "Failed to fetch GIS data";
                    console.error(errorMsg, err);
                    showError(errorMsg);
                    setGISData([]);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchGIS();

        return () => {
            isMounted = false;
        };
    }, [uid, tenantId]);

    const handleViewDetails = (recordId) => {
        // let url = `/citizen/gis/details?gisId=${recordId}&tenantId=${tenantId}`;
        // window.location.replace(url);
        alert("This Service is not available for now")
    }

    return (
        <>
            <div className="gis-page-header">
                <h1 className="gis-page-title">Welcome to mSeva GIS Portal</h1>
                <p className="gis-page-subtitle">View and manage your GIS property information</p>
            </div>
            <div className="otp-page">
            {missingParams ? (
                <div className="otp-card">
                    <h2 className="otp-title">Invalid Request</h2>
                    <p className="otp-subtext">Please provide mobile number and tenant ID to proceed</p>
                </div>
            ) : loading ? (
                <div className="otp-card">
                    <p>Loading GIS data...</p>
                </div>
            ) : (
                <div className="property_card-container">
                    {gisData.length === 0 ? (
                        <div className="otp-card">
                            <p>No GIS records found for your account</p>
                        </div>
                    ) : (
                        gisData.filter (item => item.status === 'ACTIVE').map((record, idx) => (
                            <div className="gis-card" key={record?.id || idx}>
                                <div className="gis-id">
                                    GIS ID: {record?.surveyId || 'N/A'}
                                </div>

                                <div className="gis-row">
                                    <span className="gis-label">Plot Size:</span>
                                    <span className="gis-value">{record?.landArea || 'NA'}</span>
                                </div>

                                <div className="gis-row">
                                    <span className="gis-label">Land Use:</span>
                                    <span className="gis-value">{record?.landUse || 'NA'}</span>
                                </div>

                                <div className="gis-row">
                                    <span className="gis-label">Zone:</span>
                                    <span className="gis-value">{record?.usageCategory || 'NA'}</span>
                                </div>

                                {record?.address && (
                                    <div className="gis-address">
                                        {getAddressArray(record.address)}
                                    </div>
                                )}

                                <div
                                    className={`status-badge ${record?.status === "ACTIVE"
                                        ? "status-active"
                                        : "status-inworkflow"
                                    }`}
                                >
                                    {record?.status || 'PENDING'}
                                </div>

                                <button className="gis-btn"
                                     onClick={() => handleViewDetails(record?.surveyId)}
                                >
                                    Choose Property
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}
            </div>
        </>
    );
}

export default DisplayGISRecord;
