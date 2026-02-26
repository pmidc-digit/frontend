
import { useEffect, useState, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css'
import OtpInput from './otpInput';
import { useSearchParams } from 'react-router-dom';
import { checkMobileNumber, loginWithOtp, searchPropertyBySurvey } from './function.jsx'
import { statetenantId } from "./constant.jsx"
//URL : propertyQRData?surveyid=123&tenantid=pb.amritsar&mobileno=9335130557
import { showLoading } from "../../utils/toast.jsx"
import { storage } from '../../utils/localstorage.jsx';
const ProppertyQRData = () => {
    const [displaypage, setDisplaypage] = useState(false);
    const [loader, setLoader] = useState(false);
    const [searchParams] = useSearchParams();
    const sentFor = useRef(null);
    // Extract date from  query parameters
    const surveyID = searchParams.get('surveyid');
    const tenantId = searchParams.get('tenantid');
    const mobileNumber = searchParams.get('mobileno');
    useEffect(() => {
        if (loader) {
            showLoading("Loading...");
        }
    }, [loader]);
    useEffect(() => {
        if (!mobileNumber) return;
        if (sentFor.current === mobileNumber) return;
        sentFor.current = mobileNumber
        checkMobileNumber(mobileNumber).finally(() => setLoader(false))
        setDisplaypage(true)

    }), [mobileNumber]

    const handleOtpComplete = async (otp) => {
        console.log("OTP Entered:", otp);
        const result = await loginWithOtp(mobileNumber, otp);
        if (result.success) {
            console.log("Access Token:", result);
            storage.set("user-info", result.data.UserRequest);
            storage.set("token", result.data.access_token);
            storage.set("tenant-id", statetenantId);
            setDisplaypage(false);
            setLoader(true);
            try {
                const data = await searchPropertyBySurvey({tenantId: tenantId, surveyId: surveyID});

                console.log(data);
            } catch (err) {
                console.error("API Failed:", err);
            }
        } else {
            console.error(result.message);
        }
    };
    return (
        <div className="otp-page">

            {displaypage && !loader && (

                <div className="otp-card">
                    <h2 className="otp-title">OTP Verification</h2>

                    <div className="info-box">
                        <span><strong>Survey ID:</strong> {surveyID}</span>
                        <span><strong>Tenant ID:</strong> {tenantId}</span>
                        <p><strong>Mobile:</strong> {mobileNumber}</p>
                    </div>

                    <p className="otp-subtext">
                        Enter the 6-digit OTP sent to your mobile
                    </p>

                    <OtpInput onComplete={handleOtpComplete} />
                </div>

            )}



        </div>


    )
}
export default ProppertyQRData;