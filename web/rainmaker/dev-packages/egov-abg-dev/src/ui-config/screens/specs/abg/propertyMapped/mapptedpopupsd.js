import React from "react";
import { connect } from "react-redux";
import get from "lodash/get";
import { httpRequest } from "egov-ui-framework/ui-utils/api";
import { getTenantId, getUserInfo, getLocalization } from "egov-ui-kit/utils/localStorageUtils";
import { Dialog } from "components";
import PTmapPopup from "./ptmapedPopup";

// Helper function to get usage category name from category ID
const getUsageCategoryName = (categoryId) => {
    const id = String(categoryId || "").trim();
    const categoryMap = {
        "110": "Residential",
        "111": "Commercial",
        "112": "Industrial",
        "113": "Others",
        "109": "Agriculture",
        "114": "Open Land"
    };
    return categoryMap[id] || "N/A";
};

const MapPTPopup = ({ propertiesId, ownerName, ownerMobile, landArea, noOfFloors, locality,
    usageCategory, subSegmentValue, district, tehsil, village, segment, address, rate, unit, rateId, segmentName, onClose, rowdatacomplete, onSubmit }) => {
    debugger;
    console.log("rowdatacomplete:", rowdatacomplete);
    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const [propertyData, setPropertyData] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [fullAddressss, setFullAddressss] = React.useState(address || "-");

    React.useEffect(() => {
        debugger;
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

                console.log("Property API Response:", response);

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

    const handleMarkCorrect = async (rowdatacomplete) => {
        try {
            const requestBody = {
                "PropertyRates": [
                    {
                        id: rowdatacomplete.integration_id,
                        "propertyId": rowdatacomplete.propertyid,
                        "tenantId": rowdatacomplete.tenantid,
                        "districtId": rowdatacomplete.districtid,
                        "tehsilId": rowdatacomplete.tehsilid,
                        "villageId": rowdatacomplete.village_id,
                        "landArea": rowdatacomplete.landarea,
                        "segmentId": rowdatacomplete.segmentid,
                        "subSegmentId": rowdatacomplete.subsegmentid,
                        "tehsil_name": rowdatacomplete.tehsil_name,
                        "tehsilid": rowdatacomplete.tehsilid,
                        "village_id": rowdatacomplete.village_id,
                        "rate": rowdatacomplete.rate,
                        "village_name": rowdatacomplete.village_name,
                        "locality": rowdatacomplete.locality || "",
                        isModified: false
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
            if (response) {
                console.log("Submit response:", response);
                alert("Property rate mapping submitted successfully!");
                if (onClose) {
                    onClose();
                }
            }
        } catch (error) {
            console.error("Error submitting property rate:", error);
            alert("Failed to submit property rate: " + (error.message || "Unknown error"));
        }
    };

    return (
        <div style={{
            padding: "28px",
            fontFamily: "Roboto, Arial, sans-serif",
            backgroundColor: "#ffffff",
            width: "100%",
            boxSizing: "border-box"
        }}>
            {loading && (
                <div style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "#666",
                    fontSize: "14px"
                }}>
                    Loading property details...
                </div>
            )}

            {error && (
                <div style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "#d32f2f",
                    fontSize: "14px",
                    backgroundColor: "#ffebee",
                    borderRadius: "4px",
                    marginBottom: "20px"
                }}>
                    Error: {error}
                </div>
            )}

            {/* Combined Property Details Card */}
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

            { /* Revenue Property Details Card */}
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
                        <div style={{ fontSize: "15px", color: "#222", fontWeight: 600 }}>{getUsageCategoryName(rowdatacomplete.categoryid)}</div>
                    </div>

                    <div>
                        <div style={{ fontSize: "12px", color: "#757575", fontWeight: 600 }}>No of Floors</div>
                        <div style={{ fontSize: "15px", color: "#222", fontWeight: 600 }}>{noOfFloors || "N/A"}</div>
                    </div>

                    <div>
                        <div style={{ fontSize: "12px", color: "#757575", fontWeight: 600 }}>Collect Rate</div>
                        <div style={{ fontSize: "15px", color: "#222", fontWeight: 600 }}>
                            {(rowdatacomplete.rate === 0 || rowdatacomplete.rate === -1)
                                ? "Collector Rate not notified."
                                : rowdatacomplete.rate
                                    ? `₹${rowdatacomplete.rate.toLocaleString()}`
                                    : "N/A"}
                        </div>
                    </div>

                    <div style={{ gridColumn: "1 / -1" }}>
                        <div style={{ fontSize: "12px", color: "#757575", fontWeight: 600 }}>Address</div>
                        <div style={{ fontSize: "15px", color: "#222", fontWeight: 600 }}>{fullAddressss}</div>
                    </div>
                </div>
            </div>

            <div style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                marginTop: "20px"
            }}>
                <button
                    type="button"
                    onClick={onClose}
                    style={{
                        backgroundColor: "#fff",
                        color: "#FF5722",
                        border: "1px solid #FF5722",
                        padding: "10px 20px",
                        borderRadius: "6px",
                        fontWeight: 600,
                        cursor: "pointer",
                        minWidth: "100px"
                    }}
                >
                    Close
                </button>
                <button
                    type="button"
                    onClick={() => handleMarkCorrect(rowdatacomplete)}
                    style={{
                        backgroundColor: "#fff",
                        color: "#FF5722",
                        border: "1px solid #FF5722",
                        padding: "10px 20px",
                        borderRadius: "6px",
                        fontWeight: 600,
                        cursor: "pointer",
                        minWidth: "100px"
                    }}
                >
                    Submit
                </button>
                <button
                    type="button"
                    onClick={() => {
                        console.log("rowdatacomplete:", rowdatacomplete);
                        handleOpen();
                    }}
                    style={{
                        backgroundColor: "#fff",
                        color: "#FF5722",
                        border: "1px solid #FF5722",
                        padding: "10px 20px",
                        borderRadius: "6px",
                        fontWeight: 600,
                        cursor: "pointer",
                        minWidth: "100px"
                    }}
                >
                    Incorrect
                </button>
            </div>

            <Dialog
                open={open}
                isClose={true}
                handleClose={handleClose}
                bodyStyle={{ padding: 0, maxHeight: "90vh", overflowY: "auto" }}
                contentStyle={{ width: "1200px", maxWidth: "95%", maxHeight: "90vh" }}
            >
                <div style={{ padding: "16px 20px 0", fontSize: "18px", fontWeight: 600 }}>
                    Property Revenue Mapped Details
                </div>
                <PTmapPopup
                    propertiesId={propertiesId}
                    ownerName={ownerName}
                    ownerMobile={ownerMobile}
                    landArea={landArea}
                    usageCategory={usageCategory}
                    noOfFloors={noOfFloors}
                    locality={locality}
                    address={address}
                    rowdatacomplete={rowdatacomplete}
                    onClose={handleClose}
                    onCloseAll={onClose}
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

export default connect(mapStateToProps, mapDispatchToProps)(MapPTPopup);
