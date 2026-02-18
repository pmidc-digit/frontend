import { httpRequest } from "../../../../../ui-utils";
import { handleScreenConfigurationFieldChange as handleField, prepareFinalObject, toggleSnackbar } from "egov-ui-framework/ui-redux/screen-configuration/actions";
export const filestoreAPICall = async (queryParams) => {
    try {
        debugger
        const response = await httpRequest(
            "get",
            "/filestore/v1/files/url",
            "",
            queryParams,
            {}
        );

        return response;
    } catch (error) {
        console.error("Error while fetching file store URL:", error);
        throw error;
    }
}

export const getPDFFile = async (tenantId, filestoreId) => {
    debugger
    var queryParams = [
        { key: "tenantId", value: tenantId },
        { key: "fileStoreIds", value: filestoreId }
    ];
    const filestoreapiResponse = await filestoreAPICall(queryParams);
    if (filestoreapiResponse.fileStoreIds && filestoreapiResponse.fileStoreIds.length > 0) {
        let url = filestoreapiResponse.fileStoreIds[0].url;
        if (url) {
            window.open(url, "_blank")
        } else {
            dispatch(
                toggleSnackbar(
                    true,
                    {
                        labelName: error.message || "URL NOT FOUND",
                        labelKey: error.message || "URL NOT FOUND"
                    },
                    "error"
                )
            );
        }
    }else{
        dispatch(
                toggleSnackbar(
                    true,
                    {
                        labelName: error.message || "Something went wrong",
                        labelKey: error.message || "Something went wrong"
                    },
                    "error"
                )
            );
    }
    return false
}