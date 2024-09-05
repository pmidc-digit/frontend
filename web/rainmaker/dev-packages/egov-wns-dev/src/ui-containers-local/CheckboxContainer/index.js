import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { connect } from "react-redux";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import TextField from "@material-ui/core/TextField";
import FormGroup from '@material-ui/core/FormGroup';
import LabelContainer from "egov-ui-framework/ui-containers/LabelContainer";
import FormControl from "@material-ui/core/FormControl";
import FormLabel from "@material-ui/core/FormLabel";
import { prepareFinalObject } from "egov-ui-framework/ui-redux/screen-configuration/actions";
import "./index.css";
import { toggleWater, toggleSewerage } from './toggleFeilds';
import { getQueryArg } from "egov-ui-framework/ui-utils/commons";
import { name } from "../../ui-config/screens/specs/wns/applyResource/reviewConnectionDetails";
import { TextFields } from "@material-ui/icons";

const styles = {
  root: {
    color: "#FE7A51",
    "&$checked": {
      color: "#FE7A51"
    }
  },
  formControl: {
    marginTop: 0,
    paddingBottom: 0
  },
  group: {
    display: "inline-block",
    margin: 0
  },
  checked: {},
  radioRoot: {
    marginBottom: 12
  },
  formLabel: {
    fontSize: 12,
    fontWeight: 400,
    letterSpacing: 0.56
  }
};

class CheckboxLabels extends React.Component {
  state = { checkedSewerage: false, checkedWater: false, interChange: false, checkedDischarge: false, dischargeFee : 0, dischargeConnection : ''}
  
  componentWillMount() {
    const { preparedFinalObject } = this.props;
    console.log("preparedFinalObject"+JSON.stringify(preparedFinalObject));
    let checkedWater = (preparedFinalObject && preparedFinalObject.applyScreen.water) ? preparedFinalObject.applyScreen.water : false;
    let checkedSewerage = (preparedFinalObject && preparedFinalObject.applyScreen.sewerage) ? preparedFinalObject.applyScreen.sewerage : false;
    let checkedDischarge = (preparedFinalObject && preparedFinalObject.applyScreen.discharge) ? preparedFinalObject.applyScreen.discharge : false;
    let dischargeFee =(preparedFinalObject && preparedFinalObject.applyScreen.additionalDetails.dischargeFee) ?  preparedFinalObject.applyScreen.additionalDetails.dischargeFee : 0;
    let dischargeConnection =(preparedFinalObject && preparedFinalObject.applyScreen.additionalDetails.dischargeConnection) ? preparedFinalObject.applyScreen.additionalDetails.dischargeConnection : false;
    this.setState({ checkedSewerage: checkedSewerage, checkedWater: checkedWater, checkedDischarge : checkedDischarge, dischargeConnection : dischargeConnection, dischargeFee :dischargeFee });
  }

  handleWater = name => event => {
    const { jsonPathWater, approveCheck, onFieldChange } = this.props;
    this.setState({ [name]: event.target.checked, interChange: true }, () => {
      if (this.state.checkedWater) {
        toggleWater(onFieldChange, true);
        if (this.state.checkedSewerage) 
          { toggleSewerage(onFieldChange, true); }
        else { toggleSewerage(onFieldChange, false); }
      } else { toggleWater(onFieldChange, false); } 
      approveCheck(jsonPathWater, this.state.checkedWater);
    });
  };

  handleSewerage = name => event => {
    const { jsonPathSewerage, approveCheck, onFieldChange } = this.props;
    this.setState({ [name]: event.target.checked, interChange: true }, () => {
      if (this.state.checkedSewerage) {
        toggleSewerage(onFieldChange, true);
        if (this.state.checkedWater) { toggleWater(onFieldChange, true); }
        else { toggleWater(onFieldChange, false); }
      } else { toggleSewerage(onFieldChange, false); }
      approveCheck(jsonPathSewerage, this.state.checkedSewerage);
    });
  }
  handleDischarge = (name, dispatch) => event=>{
    debugger;
    const { jsonPathDischarge, approveCheck, onFieldChange } = this.props;
    //console.log("jsonPathDischarge"+jsonPathDischargeConnection);
    this.setState({ [name]: event.target.checked, interChange: true }, () => {
      if (this.state.checkedSewerage) {
        toggleSewerage(onFieldChange, true);
        if (this.state.checkedWater) { toggleWater(onFieldChange, true); }
        else { toggleWater(onFieldChange, false); }
      } else { toggleSewerage(onFieldChange, false); }
        approveCheck(jsonPathDischarge, this.state.checkedDischarge);
        if(this.state.checkedDischarge === true){
            if(this.state.checkedWater !== true && this.state.checkedSewerage !== true){
              approveCheck('applyScreen.additionalDetails.dischargeConnection', 'OnlyMotor');
            }else if(this.state.checkedWater === true && this.state.checkedSewerage === true){
                approveCheck('applyScreen.additionalDetails.dischargeConnection','both');
            }
            else{
              approveCheck('applyScreen.additionalDetails.dischargeConnection', 'true');
            }
        }
    });
  }
  handleDischargeAmount = (name, dispatch)=> event=>{
    const {approveCheck, onFieldChange } = this.props;
    //console.log("jsonPathDischargeAmount"+jsonPathDischargeFee);
    this.setState({ [name]: event.target.value, interChange: true }, () => {
       approveCheck('applyScreen.additionalDetails.dischargeFee', this.state.dischargeAmount);
    });
    //console.log("dischargeAmount"+this.state.dischargeAmount)
  }
  render() {
    const { classes, required, preparedFinalObject, disabled = false} = this.props;
   
    let checkedWater, checkedSewerage, checkedDischarge, dischargeAmount;
    if (this.state.interChange) {
      checkedWater = this.state.checkedWater;
      checkedSewerage = this.state.checkedSewerage;
      checkedDischarge = this.state.checkedDischarge;
      dischargeAmount = this.state.dischargeAmount;

    } else {
      
      checkedWater = (preparedFinalObject && preparedFinalObject.applyScreen.water) ? preparedFinalObject.applyScreen.water : false;
      checkedSewerage = (preparedFinalObject && preparedFinalObject.applyScreen.sewerage) ? preparedFinalObject.applyScreen.sewerage : false;
      checkedDischarge = (preparedFinalObject && preparedFinalObject.applyScreen.discharge) ? preparedFinalObject.applyScreen.discharge : false;
      dischargeAmount = (preparedFinalObject && preparedFinalObject.applyScreen.additionalDetails.dischargeFee) ? preparedFinalObject.applyScreen.additionalDetails.dischargeFee : 0;
    }
    //console.log("preparedFinalObjectAfter"+JSON.stringify(preparedFinalObject));
    return (
      <div className={classes.root}>
        <FormControl component="fieldset" className={classes.formControl} required={required}>
          <FormLabel className={classes.formLabel}>
            <LabelContainer className={classes.formLabel} labelKey="WS_APPLY_FOR" />
          </FormLabel>
          <FormGroup row>
            <FormControlLabel
              classes={{ label: "checkbox-button-label" }}
              control={
                <Checkbox
                  checked={checkedWater}
                  onChange={this.handleWater("checkedWater")}
                  classes={{ root: classes.radioRoot, checked: classes.checked }}
                  color="primary"
                  disabled={disabled}
                />}
              label={<LabelContainer labelKey="WS_APPLY_WATER" />}
            />
            <FormControlLabel
              classes={{ label: "checkbox-button-label" }}
              control={
                <Checkbox
                  checked={checkedSewerage}
                  onChange={this.handleSewerage("checkedSewerage")}
                  classes={{ root: classes.radioRoot, checked: classes.checked }}
                  color="primary"
                  disabled={disabled}
                />}
              label={<LabelContainer labelKey="WS_APPLY_SEWERAGE" />}
            />
            {
              (process.env.REACT_APP_NAME !== "Citizen" &&
                <FormControlLabel
                    classes={{ label: "checkbox-button-label" }}
                    control={
                      <Checkbox
                        checked={checkedDischarge}
                        onChange={this.handleDischarge("checkedDischarge")}
                        classes={{ root: classes.radioRoot, checked: classes.checked }}
                        color="primary"
                        disabled={disabled}
                      />}
                    label={<LabelContainer labelKey="Discharge" />}
                  />
              )
            }
             
         
          {checkedDischarge && 
              
                        <TextField
                            fullWidth
                            type="number"
                            variant="outlined"
                            name=""
                            label="Discharge Amount"
                            value={dischargeAmount}
                            className={classes.textField}
                            required={checkedDischarge}
                            onChange={this.handleDischargeAmount("dischargeAmount")}
                            InputProps={{
                              className: classes.input,
                            }}
                            inputProps={{
                              style: { textAlign: "left", padding: "0.5rem" },
                            }}
                          />
                         
                      }                
              
          </FormGroup>
        </FormControl>
      </div>
    )
  }
}

const mapStateToProps = (state, ownprops) => {
  const { screenConfiguration } = state;
  const { jsonPathWater, jsonPathSewerage, jsonPathDischarge } = ownprops;
  const { preparedFinalObject } = screenConfiguration;
  return { preparedFinalObject, jsonPathWater, jsonPathSewerage, jsonPathDischarge};
};

const mapDispatchToProps = dispatch => {
  return { approveCheck: (jsonPath, value) => { dispatch(prepareFinalObject(jsonPath, value)); } };
};

CheckboxLabels.propTypes = { classes: PropTypes.object.isRequired };

export default withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(CheckboxLabels));
