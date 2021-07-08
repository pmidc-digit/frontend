import React from "react";
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
//import List from "@material-ui/core/List";
//import ListItem from "@material-ui/core/ListItem";

// @material-ui/icons
//import Email from "@material-ui/icons/Email";
//import Face from "@material-ui/icons/Face";
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";

// core components
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
//import Header from "components/Header/Header.js";
//import CardHeader from "components/Card/CardHeader.js";
//import CustomDropdown from "components/CustomDropdown/CustomDropdown.js";
//import Button from "components/CustomButtons/Button.js";
//import image from "assets/img/bg.jpg";
//import leftImage from "assets/img/stateLogo.png";
//import rightImage from "assets/img/logo.png";
import propertyTaxImage from "assets/img/property_tax.png"
import  "./index.scss"


import styles from "assets/jss/material-kit-react/views/componentsSections/navbarsStyle.js";

const useStyles = makeStyles(styles);

export default function SectionNavbars() {
  const classes = useStyles();
  return (
    <div className={classes.section}>     
         
          <GridContainer id="container">
            <GridItem xs={12} sm={6} md={4} id="griditem" >
              <Card id="card1" 
                   >
                     
                  <h4 style={{
                     marginLeft: "65px",
                     fontWeight: "500"
                  }}>PropetyTax</h4>
                    <img
              src={propertyTaxImage}
              alt="..."              
              id = ""
              style = {{height: "59px",
              width: "65px",
              marginTop: "-44px"}}
            />
                <CardBody style={{  marginLeft: "34px"}}>
                  <p className={classes.description} style={{marginTop: "-36px"}}><br />
                  PropetyTax or housetax is a local tax levised by municipal authorities for maintaining basic civic amentities in your area
                    <br />
                    <a href="/citizen/withoutAuth/pt-mutation/public-search">Pay Property Tax </a> <br /> 
                    <a href="/citizen/user/login">Register Property </a><br />
                    <a href="/citizen/user/login">Apply for Ownership Transfer </a><br />
                  </p>
                </CardBody>
              </Card>
            </GridItem>
            <GridItem xs={12} sm={6} md={4} id="griditem" >
              <Card id="card2"  >
                  <h4 style={{
                     marginLeft: "65px",
                     fontWeight: "500"

                  }}>TradeLicence</h4>
                   <img
              src={propertyTaxImage}
              alt="..."              
              id = ""
              style = {{height: "59px",
              width: "65px",
              marginTop: "-44px"}} />
                <CardBody style={{  marginLeft: "34px"}}>
                  <p className={classes.description} style={{marginTop: "-36px"}} ><br />
                PropetyTax or housetax is a local tax levised by municipal authorities for maintaining basic civic amentities in your area
                    <br />
                    <a href="/citizen/user/login">New Application</a> <br /> 
                    <a href="/citizen/user/login">Renewal of Licence </a><br />
                  </p>
                </CardBody>
              </Card>
            </GridItem>
            <GridItem xs={12} sm={6} md={4} id="griditem" >
              <Card   id="card3">
                  <h4 style={{
                     marginLeft: "65px",
                     fontWeight: "500"
                  }}>Road Cutting</h4>
                  <img
              src={propertyTaxImage}
              alt="..."              
              id = ""
              style = {{height: "59px",
              width: "65px",
              marginTop: "-44px"}} />
                <CardBody style={{  marginLeft: "34px"}}>
                <p className={classes.description} style={{marginTop: "-36px"}}><br />
                PropetyTax or housetax is a local tax levised by municipal authorities for maintaining basic civic amentities in your area
                    <br />
                    <a href="http://enagarsewa.uk.gov.in/" target="_blank" rel="noreferrer">Apply</a> <br /> 
                  </p>
                </CardBody>               
              </Card>
            </GridItem>
          </GridContainer>
        </div>     
  );
}