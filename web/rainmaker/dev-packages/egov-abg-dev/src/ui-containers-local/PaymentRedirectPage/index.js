import React, { Component } from "react";
import get from "lodash/get";
import { httpRequest } from "../../ui-utils/api";
import { withRouter } from "react-router";
import { PGService } from "egov-ui-kit/utils/endPoints";

class PaymentRedirect extends Component {
  componentDidMount = async () => {
    //let { history } = this.props;
    let { search } = this.props.location;
    try {
      let pgUpdateResponse = await httpRequest(
        "post",
        PGService.UPDATE.URL + search,
        "_update",
        [],
        {}
      );
      let moduleId = get(pgUpdateResponse, "Transaction[0].moduleId");
      let tenantId = get(pgUpdateResponse, "Transaction[0].tenantId");
      //let txnAmount = get(pgUpdateResponse, "Transaction[0].txnAmount");
      if (get(pgUpdateResponse, "Transaction[0].txnStatus") === "FAILURE") {
        // window.location.href = `/employee-tradelicence/egov-ui-framework/tradelicence/acknowledgement?purpose=${"pay"}&status=${"failure"}&applicationNumber=${moduleId}&tenantId=${tenantId}`;
        window.location.href = `/tradelicence/acknowledgement?purpose=${"pay"}&status=${"failure"}&applicationNumber=${moduleId}&tenantId=${tenantId}`;
      } else {
        let transactionId = get(pgUpdateResponse, "Transaction[0].txnId");

        // window.location.href = `/employee-tradelicence/egov-ui-framework/tradelicence/acknowledgement?purpose=${"pay"}&status=${"success"}&applicationNumber=${moduleId}&tenantId=${tenantId}&secondNumber=${transactionId}`;
        window.location.href = `/tradelicence/acknowledgement?purpose=${"pay"}&status=${"success"}&applicationNumber=${moduleId}&tenantId=${tenantId}&secondNumber=${transactionId}`;
      }
    } catch (e) {
      alert(e);
      // history.push("/property-tax/payment-success/"+moduleId.split("-",(moduleId.split("-").length-1)).join("-"))
    }
  };
  render() {
    return <div />;
  }
}

export default withRouter(PaymentRedirect);
