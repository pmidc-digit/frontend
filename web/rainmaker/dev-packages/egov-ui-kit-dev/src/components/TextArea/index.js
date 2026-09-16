import React from "react";
import PropTypes from "prop-types";
import TextField from "material-ui/TextField";

const defaultStyle = {
  backgroundColor: "transparent",
};

const floatingLabelBaseStyle = {
  top: 30,
  fontSize: "14px",
  letterSpacing: "0.6px",
};

const floatingLabelBaseShrinkStyle = {
  fontSize: "12px",
  color: "#00bcd1",
  transform: "scale(1) translate(0px, -16px)",
  fontWeight: 500,
};
const underlineDisabledStyle = {
  borderBottom: "1px solid #e0e0e0",
};

const TextAreaUi = ({
  className,
  style,
  underlineShow,
  inputStyle,
  onChange,
  errorMessage,
  value = "",
  disabled,
  isRequired,
  hide,
  rows,
  hintText,
  hintStyle,
  textareaStyle,
  rowsMax,
  underlineStyle,
  underlineFocusStyle,
  floatingLabelStyle = {},
  jsonPath,
  id,
  ...rest
}) => {
  const sanitizeTextAreaValue = (val) => {
    if (typeof val !== "string") return val;
    if (rest.allowSpecialChars || rest.disallowSpecialChars === false) return val;
    if (rest.customDisallowRegex) return val.replace(rest.customDisallowRegex, "");
    return val.replace(/[<>\^~{}\[\]\\!;'"`]/g, "");
  };

  const handleTextAreaChange = (event, newValue) => {
    let val = typeof newValue === "string" ? newValue : (event && event.target && event.target.value ? event.target.value : "");
    if (
      typeof val === "string" &&
      !rest.allowSpecialChars &&
      rest.disallowSpecialChars !== false
    ) {
      const sanitized = sanitizeTextAreaValue(val);
      if (sanitized !== val) {
        val = sanitized;
        if (event && event.target) {
          event.target.value = sanitized;
        }
      }
    }
    if (onChange) {
      onChange(event, val);
    }
  };

  return (
    <TextField
      className={className}
      id={id}
      fullWidth={true}
      multiLine={true}
      rows={rows}
      rowsMax={rowsMax}
      disabled={disabled}
      onChange={handleTextAreaChange}
      style={{ ...defaultStyle, ...style }}
      hintText={hintText}
      inputStyle={inputStyle}
      hintStyle={hintStyle}
      textareaStyle={textareaStyle}
      underlineShow={underlineShow}
      underlineStyle={underlineStyle}
      underlineFocusStyle={underlineFocusStyle}
      floatingLabelStyle={{ ...floatingLabelBaseStyle, ...floatingLabelStyle }}
      value={value}
      underlineDisabledStyle={underlineDisabledStyle}
      {...rest}
    />
  );
};

TextAreaUi.propTypes = {
  onChange: PropTypes.func,
  style: PropTypes.object,
  errorMessage: PropTypes.string,
  value: PropTypes.string,
  disabled: PropTypes.bool,
  label: PropTypes.string,
  isRequired: PropTypes.bool,
  hide: PropTypes.bool,
  className: PropTypes.string,
};

export default TextAreaUi;
