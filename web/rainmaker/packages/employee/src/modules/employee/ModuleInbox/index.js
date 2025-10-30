import React, { Component } from "react";
import FilteredInbox from "./FilteredInbox";

/**
 * ModuleInbox - A wrapper component that displays inbox filtered by module
 * Route: /employee/:moduleName/inbox
 *
 * This component extracts the moduleName from URL and passes it to FilteredInbox component
 * to display only tasks related to that specific module.
 *
 * Module Mapping:
 * URL module names map to multiple businessService values for API filtering
 * - pt → ["PT.MUTATION", "PT.UPDATE", "PT.CREATEWITHWNS", "PT.CREATE"]
 * - tl → ["NEWTL.NHAZ", "NewTL", "EDITRENEWAL", "NEWTL.HAZ", "DIRECTRENEWAL", "ModifyTL", "EditRenewal"]
 * - water-sewage → ["ModifyWSConnection", "NewWS1", "DisconnectWSConnection", etc.]
 * - sewage → ["DisconnectSWConnection_New", "ModifySWConnection", "NewSW1", etc.]
 *
 * The businessServices array is used both for API filtering and frontend filtering.
 */

/**
 * Maps URL module names to their corresponding businessService values
 * @param {string} urlModuleName - The module name from URL (case-insensitive)
 * @returns {Object} Object containing businessServices array and display pattern
 */
const getModuleBusinessServices = (urlModuleName) => {
  const moduleMap = {
    // Property Tax
    'PT': {
      businessServices: ["PT.MUTATION", "PT.UPDATE", "PT.CREATEWITHWNS", "PT.CREATE"],
      pattern: 'PT'
    },

    // Fire NOC
    'FIRENOC': {
      businessServices: ["FIRENOC"],
      pattern: 'FIRENOC'
    },

    // Public Grievance Redressal
    'PGR': {
      businessServices: ["PGRAI", "PGR"],
      pattern: 'PGR'
    },

    // Water & Sewerage
    'WATER-SEWAGE': {
      businessServices: ["ModifyWSConnection", "NewWS1", "DisconnectWSConnection", "DisconnectWSConnection_1807", "DisconnectWSConnection_old"],
      pattern: 'WS'
    },
    'WS': {  // Alias for water-sewage
      businessServices: ["ModifyWSConnection", "NewWS1", "DisconnectWSConnection", "DisconnectWSConnection_1807", "DisconnectWSConnection_old"],
      pattern: 'WS'
    },

    // Sewerage
    'SEWAGE': {
      businessServices: ["DisconnectSWConnection_New", "TEST_at", "ModifySWConnection", "NewSW1"],
      pattern: 'SW'
    },
    'SW': {  // Alias for sewage
      businessServices: ["DisconnectSWConnection_New", "TEST_at", "ModifySWConnection", "NewSW1"],
      pattern: 'SW'
    },

    // Trade License
    'TL': {
      businessServices: ["NEWTL.NHAZ", "NewTL", "EDITRENEWAL", "NEWTL.HAZ", "DIRECTRENEWAL", "ModifyTL", "EditRenewal"],
      pattern: 'TL'
    },

    // OBPAS NOC
    'OBPAS': {
      businessServices: ["obpas_noc"],
      pattern: 'NOC'
    },
    'NOC': {  // Alias for OBPAS
      businessServices: ["obpas_noc"],
      pattern: 'NOC'
    },

    // Building Plan Approval
    'BPA': {
      businessServices: ["BPA", "BPA_OC", "BPA_LOW"],
      pattern: 'BPA'
    }
  };

  return moduleMap[urlModuleName] || { businessServices: [], pattern: urlModuleName };
};

class ModuleInbox extends Component {
  render() {
    const { match, history, location } = this.props;
    const urlModuleName = match && match.params && match.params.moduleName
      ? match.params.moduleName.toUpperCase()
      : null;

    // Get businessServices and pattern for the module
    const moduleConfig = urlModuleName
      ? getModuleBusinessServices(urlModuleName)
      : { businessServices: [], pattern: null };

    return (
      <FilteredInbox
        preselectedModule={moduleConfig.pattern}
        businessServices={moduleConfig.businessServices}
        history={history}
        location={location}
      />
    );
  }
}

export default ModuleInbox;
