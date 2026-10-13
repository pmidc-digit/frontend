import React from "react";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import { withStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import Label from "../../../utils/translationNode";
import "./index.css";

const styles = (theme) => ({
  root: {
    flexGrow: 1,
  },
  paper: {
    borderRadius: 0,
    marginTop: 0,
    height: 110,
    alignItems: "center",
    justifyContent: "center",
    display: "flex",
    cursor: "pointer",
    [theme.breakpoints.down("sm")]: {
      height: 100,
      marginBottom: 8,
    },
  },
  icon: {
    color: "#2947a3",
  },
  item: {
    padding: 8,
    width: "100%",
    [theme.breakpoints.down("xs")]: {
      maxWidth: "100%",
      flexBasis: "100%",
      padding: 6,
    },
  },
});

class ModuleLandingPage extends React.Component {
  render() {
    const { classes, items, history } = this.props;
    return (
      <Grid container spacing={1}>
        {items.map((obj) => {
          return (
            <Grid className={classes.item} item xs={12} sm={6} md={4} align="center">
              <Card
                className={`${classes.paper} module-card-style`}
                onClick={(e) => {
                  history.push(obj.route);
                }}
              >
                <CardContent classes={{ root: "card-content-style" }}>
                  {obj.icon}
                  <Label label={obj.label} fontSize={14} color="rgba(0, 0, 0, 0.8700000047683716)" dynamicArray={obj.dynamicArray} />
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
  }
}

export default withStyles(styles)(ModuleLandingPage);
