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
  number
} = {}) => {
  const tail = tailText
    ? {
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
          className: "abg-ack-tail-box",
          className: "ack-tail"
        }
      }
    : {};

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
            paragraph: getCommonParagraph(body, {
              className: "abg-ack-body-sub"
            })
          },
          props: {
            className: "abg-ack-body-box",
            className: "ack-body"
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
