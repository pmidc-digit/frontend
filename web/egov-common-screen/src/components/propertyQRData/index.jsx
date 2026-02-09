
import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css'
import OtpInput from './otpInput';
import { useSearchParams } from 'react-router-dom';
import checkMobileNumber from './function.jsx'
//URL : propertyQRData?surveyid=123&tenantid=pb.amritsar&mobileno=9335130557

const ProppertyQRData = () => {
    const [displaypage, setDisplaypage] = useState(true);
    const [loader, setLoader] = useState(false);
    const [searchParams] = useSearchParams();
    // Extract date from  query parameters
     const surveyID = searchParams.get('surveyid');
     const tenantId = searchParams.get('tenantid');
     const mobileNumber = searchParams.get('mobileno');

     useEffect(()=>{
         checkMobileNumber(mobileNumber)
         setDisplaypage(true)
         setLoader(false)
     }),[mobileNumber]

    const handleOtpComplete = (otp) => {
        console.log("OTP Entered:", otp);
    };
    if(loader){
//show loader
    }
    return (
        <div className="otp-page">
            {displaypage && (
                
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