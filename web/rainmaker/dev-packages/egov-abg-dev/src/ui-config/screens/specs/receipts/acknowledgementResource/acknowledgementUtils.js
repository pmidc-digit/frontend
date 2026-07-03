import {
  getCommonHeader,
  getCommonCard,
  getCommonParagraph,
  getCommonContainer
} from "egov-ui-framework/ui-config/screens/specs/utils";




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
