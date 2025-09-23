import React from "react";
import { Dialog, Button, Image } from "components";
import Label from "egov-ui-kit/utils/translationNode";
import "./index.css";

const styles = {
  logoutContentStyle: { textAlign: "center", padding: "24px 20px" },
};

function hidePopup(event) {
  if (event) event.preventDefault();
  document.querySelector(".popup-overlay").style.display = "none";
  document.querySelector(".mypop").style.display = "none";
}

const WelcomeMessage = ({ WCPopupClose, WCPopupOpen, title, body }) => {
  const actions = [
    <Button
      label={"test"}
      backgroundColor={"#fff"}
      style={{ boxShadow: "none", display: "none" }}
    />,
  ];

  return (
    <React.Fragment>
      <Dialog
        open={WCPopupOpen}
        title={
          <Label
            label={title}
            bold={true}
            color="rgba(0, 0, 0, 0.8700000047683716)"
            fontSize="20px"
            labelStyle={{ padding: "16px 0px 0px 24px" }}
          />
        }
        children={[<Image className="whatsApp-Image" source={`${body}`} />]}
        handleClose={WCPopupClose}
        actions={actions}
        contentClassName={"wc-popup"}
        contentStyle={{ width: "90%" }}
        isClose={true}
        isImage={true}
      />
      <div className="popup-overlay"></div>
      <div className="mypop">
        <a href="#" className="popup-close" onClick={hidePopup}>
          ✕
        </a>
        <img src="https://lgpunjab.gov.in/mf.png" alt="Punjab Plantation" />
      </div>
    </React.Fragment>
  );
};

export default WelcomeMessage;