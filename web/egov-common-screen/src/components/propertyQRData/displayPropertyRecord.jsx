import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { searchPropertyBySurvey, getAddressArray } from "./function"
const DisplayPropertyRecord = () => {
    const [missingParams, setMissingParams] = useState(false);
    const [searchParams] = useSearchParams();
    const [propertyData, setPropertyData] = useState([]);
    // Extract date from  query parameters
    const surveyID = searchParams.get('surveyid');
    const tenantId = searchParams.get('tenantid');
    const mobileNumber = searchParams.get('mobileno');
    useEffect(() => {
        if (!surveyID || !tenantId || !mobileNumber) {
            if (!errorShown.current) { // Show error only once
                showError("Please scan the QR code again");
                errorShown.current = true;
            }
            setMissingParams(true);
            return;
        }

        const fetchProp = async () => {
            try {
                const data = await searchPropertyBySurvey({ tenantId, surveyId: surveyID });
                //console.log("data",data)
                setPropertyData(data?.Properties || []);

            } catch (err) {
                console.error("API Failed:", err);
            }
        };

        fetchProp();
    }, [surveyID, tenantId, mobileNumber]);
   // console.log("propertyData", propertyData)
   const editPropertyurl = (propertyID, tenantid)=>{
    let url = `/citizen/property-tax/assessment-form?assessmentId=0&purpose=update&propertyId=${propertyID}&tenantId=${tenantid}`;
    window.location.replace(url);   
   }
    return (
        <div className="otp-page">
            {missingParams ? (
                <div className="otp-card">
                    <h2 className="otp-title">Invalid QR Code</h2>
                    <p className="otp-subtext">Please scan a valid QR code to proceed</p>
                </div>
            ) : (
                <div className="property_card-container">
                    {propertyData.length === 0 ? (
                        <p>No properties found</p>
                    ) : (
                        propertyData.map((prop, idx) => (
                            <div className="property-card" key = {prop?.id}>
                                <div className="property-id">
                                    Property ID: {prop?.propertyId}
                                </div>

                                <div className="property-row">
                                    <span className="property-label">Owner:</span>
                                    <span className="property-value">{prop?.owners[0]?.name || 'NA'}</span>
                                </div>

                                <div className="property-row">
                                    <span className="property-label">Guardian:</span>
                                    <span className="property-value">{prop?.owners[0]?.fatherOrHusbandName || 'NA'}</span>
                                </div>

                                <div className="property-address">
                                    {getAddressArray(prop.address)}
                                </div>

                                <div
                                    className={`status-badge ${prop?.status === "ACTIVE"
                                            ? "status-active"
                                            : "status-inworkflow"
                                        }`}
                                >
                                    {prop?.status}
                                </div>

                                <button className="property-btn" onClick={()=>editPropertyurl(prop?.propertyId, prop?.tenantId)}>View</button>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export default DisplayPropertyRecord;