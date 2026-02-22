import React from "react";
import { connect } from "react-redux";
import get from "lodash/get";

const MapPTPopup = ({ propertiesId, ownerName, ownerMobile, landArea, noOfFloors, locality,
    usageCategory, subSegmentValue, district, tehsil, village, segment, address, rate, unit, rateId, segmentName, onClose, rowdatacomplete, onSubmit }) => {
    debugger;
    return (
        <div style={{
            padding: "28px",
            fontFamily: "Roboto, Arial, sans-serif",
            backgroundColor: "#ffffff",
            width: "100%",
            boxSizing: "border-box"
        }}>

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
                    Property Details
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
                        <div style={{ fontSize: "15px", color: "#222", fontWeight: 600 }}>{locality || "N/A"}</div>
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

                    {/* <div>
                        <div style={{ fontSize: "12px", color: "#757575", fontWeight: 600 }}>Sub Segment Value</div>
                        <div style={{ fontSize: "15px", color: "#222", fontWeight: 600 }}>{subSegmentValue || "N/A"}</div>
                    </div> */}

                    <div>
                        <div style={{ fontSize: "12px", color: "#757575", fontWeight: 600 }}>Land Area</div>
                        <div style={{ fontSize: "15px", color: "#222", fontWeight: 600 }}>
                            {landArea ? `${landArea} sq.ft` : "N/A"}
                        </div>
                    </div>


                    <div>
                        <div style={{ fontSize: "12px", color: "#757575", fontWeight: 600 }}>Usage Category</div>
                        <div style={{ fontSize: "15px", color: "#222", fontWeight: 600 }}>{usageCategory || "N/A"}</div>
                    </div>

                    <div>
                        <div style={{ fontSize: "12px", color: "#757575", fontWeight: 600 }}>No of Floors</div>
                        <div style={{ fontSize: "15px", color: "#222", fontWeight: 600 }}>{noOfFloors || "N/A"}</div>
                    </div>


                    <div>
                        <div style={{ fontSize: "12px", color: "#757575", fontWeight: 600 }}>Collect Rate</div>
                        <div style={{ fontSize: "15px", color: "#222", fontWeight: 600 }}>
                            {rowdatacomplete.rate ? `₹${rowdatacomplete.rate.toLocaleString()}${rowdatacomplete.unit ? ` / ${rowdatacomplete.unit}` : ''}` : "N/A"}
                        </div>
                    </div>

                    {/* <div>
                        <div style={{ fontSize: "12px", color: "#757575", fontWeight: 600 }}>Unit</div>
                        <div style={{ fontSize: "15px", color: "#222", fontWeight: 600 }}>{rowdatacomplete.unit || "N/A"}</div>
                    </div> */}

                    {/* <div style={{ gridColumn: "1 / -1" }}>
                        <div style={{ fontSize: "12px", color: "#757575", fontWeight: 600 }}>Segment Name</div>
                        <div style={{ fontSize: "15px", color: "#222", fontWeight: 600 }}>{rowdatacomplete.segment_name || "N/A"}</div>
                    </div> */}

                    {/* <div style={{ gridColumn: "1 / -1" }}>
                        <div style={{ fontSize: "12px", color: "#757575", fontWeight: 600 }}>Address</div>
                        <div style={{ fontSize: "15px", color: "#222", fontWeight: 600 }}>{rowdatacomplete.address || "N/A"}</div>
                    </div> */}
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

            </div>
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
