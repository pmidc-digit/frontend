const checkMobileNumber = (number) => {
    const mobileNumberPattern = /^[6-9]\d{9}$/;

    const isMobileValid = mobileNumberPattern.test(number);
    if(isMobileValid){
        // return number;
    }
}


export default checkMobileNumber;