import {
  getCommonHeader,
  getCommonCard,
  getCommonParagraph,
  getCommonContainer
} from "egov-ui-framework/ui-config/screens/specs/utils";

const style = {
  bodyBox: {
    marginLeft: 16,
    flex: 2
  },
  tailText: {
    color: "#2947a3",
    fontSize: 16,
    fontWeight: 400
  },
  tailNumber: {
    fontSize: 24,
    fontWeight: 500
  },
  tailBox: {
    textAlign: "right",
    justifyContent: "center",
    flex: 1
  },
  bodySub: {
    marginTop: "8px",
    marginBottom: "0px",
    color: "rgba(0, 0, 0, 0.60)",
    fontFamily: "Roboto"
  },
  container: {
    display: "flex",
    minHeight: "106px",
    justifyContent: "center",
    alignItems: "center"
  }
};

const acknowledgementCard = ({
  icon = "done",
  backgroundColor = "#39CB74",
  header,
  body,
  tailText,
  number,
  tailTextOne,
  newNumber
} = {}) => {
  let tail;
  if (number && newNumber) {
    tail = tailText && number && tailTextOne && newNumber && newNumber !== null && number !== "null" ? {
      uiFramework: "custom-atoms",
      componentPath: "Div",
      children: {
        text: getCommonHeader(tailText, { className: "abg-ack-tail-text" }),
        paragraph: getCommonHeader(
          { labelName: number },
          { className: "abg-ack-tail-number" }
        ),
        textOne: getCommonHeader(tailTextOne, { className: "abg-ack-tail-text" }),
        paragraphOne: getCommonHeader(
          { labelName: newNumber },
          { className: "abg-ack-tail-number" }
        )
      },
      props: {
        className: "abg-ack-tail-box"
      }
    }
      : {};
  } else {
    tail = tailText && number && number !== "null" ? {
      uiFramework: "custom-atoms",
      componentPath: "Div",
      children: {
        text: getCommonHeader(tailText, { className: "abg-ack-tail-text" }),
        paragraph: getCommonHeader(
          {
            labelName: number
          },
          { className: "abg-ack-tail-number" }
        )
      },
      props: {
        className: "abg-ack-tail-box"
      }
    }
      : {};
  }

  return getCommonCard({
    applicationSuccessContainer: getCommonContainer(
      {
        avatar: {
          componentPath: "Avatar",
          props: {
            style: {
              width: "72px",
              height: "72px",
              backgroundColor: backgroundColor
            }
          },
          children: {
            Icon: {
              uiFramework: "custom-atoms",
              componentPath: "Icon",
              props: {
                iconName: icon,
                style: {
                  fontSize: "50px"
                },
                iconSize: "50px"
              }
            }
          }
        },
        body: {
          uiFramework: "custom-atoms",
          componentPath: "Div",
          children: {
            header: getCommonHeader(header),
            paragraph: body
              ? getCommonParagraph(body, {
                className: "abg-ack-body-sub"
              })
              : {}
          },
          props: {
            className: "abg-ack-body-box"
          }
        },
        tail: tail
      },
      {
        className: "abg-ack-container"
      }
    )
  });
};

export default acknowledgementCard;
