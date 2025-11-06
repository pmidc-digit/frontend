import React, { Component } from "react";
import { FeesEstimateCard } from "../../ui-molecules-local";
import { Dialog } from "components";
import { connect } from "react-redux";
import get from "lodash/get";
import orderBy from "lodash/orderBy";

class EstimateCardContainer extends Component {
  constructor(props) {
    super(props);
    this.state = { welcomePopupOpen: false };
    this._welcomeTimer = null;
  }

  componentDidMount() {
    // Show a welcome popup 2 seconds after landing on Payment Collection Details
    if (this._welcomeTimer) {
      clearTimeout(this._welcomeTimer);
    }
    this._welcomeTimer = setTimeout(() => {
      this.setState({ welcomePopupOpen: true });
      this._welcomeTimer = null;
    }, 2000);
  }

  componentWillUnmount() {
    if (this._welcomeTimer) {
      clearTimeout(this._welcomeTimer);
      this._welcomeTimer = null;
    }
  }

  closeWelcomePopup = () => {
    if (this._welcomeTimer) {
      clearTimeout(this._welcomeTimer);
      this._welcomeTimer = null;
    }
    this.setState({ welcomePopupOpen: false });
  }

  render() {
    const { estimate, isArrears } = this.props;
    const { welcomePopupOpen } = this.state;
    return (
      <React.Fragment>
        <FeesEstimateCard estimate={estimate} isArrears={isArrears} />

        <Dialog
          className="pt-warning-popup"
          open={welcomePopupOpen}
          isClose={true}
          // title={"NOC_FEE_ESTIMATE_HEADER_payer_mobile"}
          handleClose={this.closeWelcomePopup}
          titleStyle={{ padding: "2%", backgroundColor: "white" }}
          actionsContainerStyle={{ padding: "2%", backgroundColor: "white" }}
          bodyStyle={{ padding: "0% 2% 2% 2%", backgroundColor: "white" }}
        >
          <div style={{ padding: "10px", textAlign: "center" }}>
            <div style={{ color: "rgba(0, 0, 0, 0.87)", fontSize: "14px", marginBottom: "4px" }}>
              <label title="{PAYMER_MOBILE_NO_MSG}"></label>
            </div>
          </div>
          <div className="pt-warning-button-container" style={{ textAlign: "center" }}>
            <button
              type="button"
              style={{ width: "100%", marginTop: "10px", color: "white", fontWeight: 500 }}
              className={"button-verify-link"}
              onClick={this.closeWelcomePopup}
            >
              OK
            </button>
          </div>
        </Dialog>
      </React.Fragment>
    );
  }
}

const sortBillDetails = (billDetails = []) => {
  let sortedBillDetails = [];
  sortedBillDetails = billDetails.sort((x, y) => y.fromPeriod - x.fromPeriod);
  return sortedBillDetails;
}
const formatTaxHeaders = (billDetail = {}) => {

  let formattedFees = []
  const { billAccountDetails = [] } = billDetail;
  const billAccountDetailsSorted = orderBy(
    billAccountDetails,
    ["amount"],
    ["asce"]);
  formattedFees = billAccountDetailsSorted.map((taxHead) => {
    return {
      info: {
        labelKey: taxHead.taxHeadCode,
        labelName: taxHead.taxHeadCode
      },
      name: {
        labelKey: taxHead.taxHeadCode,
        labelName: taxHead.taxHeadCode
      },
      value: taxHead.amount
    }
  })
  formattedFees.reverse();
  return formattedFees;
}


const mapStateToProps = (state, ownProps) => {
  const { screenConfiguration } = state;



  const fees = formatTaxHeaders(sortBillDetails(get(screenConfiguration, "preparedFinalObject.ReceiptTemp[0].Bill[0].billDetails", []))[0]);
  // const fees = get(screenConfiguration, "preparedFinalObject.applyScreenMdmsData.estimateCardData", []);
  const billDetails = get(screenConfiguration, "preparedFinalObject.ReceiptTemp[0].Bill[0].billDetails", []);
  const isArrears = get(screenConfiguration, "preparedFinalObject.isArrears");
  let totalAmount = 0;
  let arrears = 0;
  for (let billDetail of billDetails) {
    totalAmount += billDetail.amount;

  }
  if (totalAmount > 0) {
    arrears = totalAmount - billDetails[0].amount;
    arrears = arrears.toFixed(2);
  }
  const estimate = {
    header: { labelName: "Fee Estimate", labelKey: "NOC_FEE_ESTIMATE_HEADER" },
    fees,
    totalAmount,
    arrears
  };
  return { estimate, isArrears };
};

export default connect(
  mapStateToProps,
  null
)(EstimateCardContainer);
