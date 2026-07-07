import React from "react";
import Icon from "../Icon";
import Label from "egov-ui-kit/utils/translationNode";
import { Link } from "react-router-dom";
import "./index.css";

const BreadCrumbs = ({ url, history, label }) => {
  return (
    <div className="rainmaker-displayInline wns-breadcrumb-path">
      <Link to="home">
        <Icon action="action" name="home" color="#2947a3" />
      </Link>
      <div className="rainmaker-displayInline">
        <div className="wns-breadcrumb-icon"> ❯ </div>
        <div>
          <Label labelClassName="breadcrum-label-style" label={label ? label : ""} />
        </div>
      </div>
    </div>
  );
};

export default BreadCrumbs;
