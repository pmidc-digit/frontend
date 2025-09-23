import React from "react";
import { RenderRoutes } from "modules/common";

function hidePopup(event) {
  if (event) event.preventDefault();
  document.querySelector('.popup-overlay').style.display = 'none';
  document.querySelector('.mypop').style.display = 'none';
}

const Citizen = ({ match, routes = [] }) => {
  return (
    <React.Fragment>
      <RenderRoutes match={match} routes={routes} />
      <div className="popup-overlay"></div>
      <div className="mypop">
        <a href="#" className="popup-close" onClick={hidePopup}>✕</a>
        <img src="https://lgpunjab.gov.in/mf.png" alt="Punjab Plantation" />
      </div>
    </React.Fragment>
  );
};

export default Citizen;
