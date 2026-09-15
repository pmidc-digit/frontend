import React from 'react';
import PropTypes from 'prop-types';
import TextField from '@material-ui/core/TextField';

const MihyText=(props)=> {
    const {id,value,label,fullWidth,onChange,...rest} = props;

    const sanitizeValue = (val) => {
      if (typeof val !== "string") return val;
      if (rest.allowSpecialChars || rest.disallowSpecialChars === false) return val;
      if (rest.type === "password") return val;
      if (rest.customDisallowRegex) return val.replace(rest.customDisallowRegex, "");
      return val.replace(/[<>$\^~{}\[\]\\%*]/g, "");
    };

    const sanitizeTextAreaValue = (val) => {
      if (typeof val !== "string") return val;
      if (rest.allowSpecialChars || rest.disallowSpecialChars === false) return val;
      if (rest.customDisallowRegex) return val.replace(rest.customDisallowRegex, "");
      return val.replace(/[<>\^~{}\[\]\\]/g, "");
    };

    const handleChange = (e) => {
      if (
        e &&
        e.target &&
        typeof e.target.value === "string" &&
        rest.type !== "password" &&
        rest.type !== "date" &&
        rest.type !== "time" &&
        rest.type !== "number" &&
        !rest.allowSpecialChars &&
        rest.disallowSpecialChars !== false
      ) {
        const sanitized = props.multiline ? sanitizeTextAreaValue(e.target.value) : sanitizeValue(e.target.value);
        if (sanitized !== e.target.value) {
          e.target.value = sanitized;
        }
      }
      if (onChange) {
        onChange(e);
      }
    };

    return (
        <TextField
          id={id}
          label={label}
          value={value}
          fullWidth={true}
          {...rest}
          onChange={handleChange}
          FormHelperTextProps={{ style: { fontSize: "1.4rem" } }}
        />
    );
  }

MihyText.propTypes = {
  id: PropTypes.string.isRequired,
  label:PropTypes.string.isRequired,
  value:PropTypes.string
};

MihyText.defaultProps= {
  fullWidth:true
}

export default MihyText;
