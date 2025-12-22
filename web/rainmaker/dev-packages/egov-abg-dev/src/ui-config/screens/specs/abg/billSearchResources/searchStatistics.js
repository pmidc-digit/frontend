import { getLabel } from "egov-ui-framework/ui-config/screens/specs/utils";

export const searchStatistics = {
  uiFramework: "custom-atoms",
  componentPath: "Div",
  visible: false,
  props: {
    style: {
      padding: "20px 0",
      margin: "20px 0 10px 0"
    }
  },
  children: {
    ulbNameContainer: {
      uiFramework: "custom-atoms",
      componentPath: "Div",
      props: {
        style: {
          marginBottom: "16px",
          fontSize: "18px",
          fontWeight: "600",
          color: "#333"
        }
      },
      children: {
        ulbNameText: {
          uiFramework: "custom-atoms",
          componentPath: "Div",
          props: {
            dangerouslySetInnerHTML: {
              __html: "ULB Name: Loading..."
            }
          }
        }
      }
    },
    statisticsBoxes: {
      uiFramework: "custom-atoms",
      componentPath: "Div",
      props: {
        style: {
          display: "flex",
          gap: "20px",
          justifyContent: "space-between",
          flexWrap: "wrap"
        }
      },
      children: {
        box1: {
          uiFramework: "custom-atoms",
          componentPath: "Div",
          props: {
            style: {
              flex: "1",
              minWidth: "280px",
              background: "#FFFFFF",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              border: "1px solid #E5E7EB"
            }
          },
          children: {
            box1Title: {
              uiFramework: "custom-atoms",
              componentPath: "Div",
              props: {
                style: {
                  fontSize: "14px",
                  color: "#6B7280",
                  marginBottom: "8px",
                  fontWeight: "500"
                },
                dangerouslySetInnerHTML: {
                  __html: "Total Properties in ULB"
                }
              }
            },
            box1Value: {
              uiFramework: "custom-atoms",
              componentPath: "Div",
              props: {
                style: {
                  fontSize: "28px",
                  fontWeight: "700",
                  color: "#111827"
                },
                dangerouslySetInnerHTML: {
                  __html: "0"
                }
              }
            }
          }
        },
        box2: {
          uiFramework: "custom-atoms",
          componentPath: "Div",
          props: {
            style: {
              flex: "1",
              minWidth: "280px",
              background: "#FFFFFF",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              border: "1px solid #E5E7EB"
            }
          },
          children: {
            box2Title: {
              uiFramework: "custom-atoms",
              componentPath: "Div",
              props: {
                style: {
                  fontSize: "14px",
                  color: "#6B7280",
                  marginBottom: "8px",
                  fontWeight: "500"
                },
                dangerouslySetInnerHTML: {
                  __html: "Total Properties Registered with Vasika"
                }
              }
            },
            box2Value: {
              uiFramework: "custom-atoms",
              componentPath: "Div",
              props: {
                style: {
                  fontSize: "28px",
                  fontWeight: "700",
                  color: "#111827"
                },
                dangerouslySetInnerHTML: {
                  __html: "0"
                }
              }
            }
          }
        },
        box3: {
          uiFramework: "custom-atoms",
          componentPath: "Div",
          props: {
            style: {
              flex: "1",
              minWidth: "280px",
              background: "#FFFFFF",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              border: "1px solid #E5E7EB"
            }
          },
          children: {
            box3Title: {
              uiFramework: "custom-atoms",
              componentPath: "Div",
              props: {
                style: {
                  fontSize: "14px",
                  color: "#6B7280",
                  marginBottom: "8px",
                  fontWeight: "500"
                },
                dangerouslySetInnerHTML: {
                  __html: "Total Percentage"
                }
              }
            },
            box3Value: {
              uiFramework: "custom-atoms",
              componentPath: "Div",
              props: {
                style: {
                  fontSize: "28px",
                  fontWeight: "700",
                  color: "#111827"
                },
                dangerouslySetInnerHTML: {
                  __html: "0%"
                }
              }
            }
          }
        }
      }
    }
  }
};
