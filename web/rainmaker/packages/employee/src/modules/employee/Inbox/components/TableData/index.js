import Hidden from "@material-ui/core/Hidden";
import { withStyles } from "@material-ui/core/styles";
import Tab from "@material-ui/core/Tab";
import Tabs from "@material-ui/core/Tabs";
import CircularProgress from "@material-ui/core/CircularProgress";
import MenuButton from "egov-ui-framework/ui-molecules/MenuButton";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Button from "@material-ui/core/Button";
import Switch from "@material-ui/core/Switch";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import AutorenewIcon from '@material-ui/icons/Autorenew';

import FilterListIcon from '@material-ui/icons/FilterList';
import { prepareFinalObject } from "egov-ui-framework/ui-redux/screen-configuration/actions";
import { getLocaleLabels, transformById } from "egov-ui-framework/ui-utils/commons";
import TextFieldIcon from "egov-ui-kit/components/TextFieldIcon";
import { toggleSnackbarAndSetText } from "egov-ui-kit/redux/app/actions";
import { httpRequest, multiHttpRequest } from "egov-ui-kit/utils/api";
import { getLocale, getLocalization, getTenantId, localStorageGet, localStorageSet } from "egov-ui-kit/utils/localStorageUtils";
import Label from "egov-ui-kit/utils/translationNode";
import cloneDeep from "lodash/cloneDeep";
import get from "lodash/get";
import isEmpty from "lodash/isEmpty";
import orderBy from "lodash/orderBy";
import set from "lodash/set";
import uniq from "lodash/uniq";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Taskboard } from "../actionItems";
import Filter from "../Filter";
import InboxData from "../Table";
import "./index.css";

const getWFstatus = (status) => {
  switch (status) {
    case "INITIATED":
      return "Initiated";
    case "CORRECTIONPENDING":
    case "PENDING_FOR_CITIZEN_ACTION":
      return "Pending for Citizen Action";
    case "OPEN":
    case "APPLIED":
    case "DOCUMENTVERIFY":
    case "PENDING_FOR_DOCUMENT_VERIFICATION":
      return "Pending for Document Verification";
    case "REJECTED":
      return "REJECTED";
    case "DOCVERIFIED":
    case "FIELDINSPECTION":
    case "PENDING_FOR_FIELD_INSPECTION":
      return "Pending for Field Inspection";
    case "PENDING_APPROVAL_FOR_CONNECTION":
      return "Pending Approval for Connection"
    case "PENDINGPAYMENT":
    case "PENDING_FOR_PAYMENT":
      return "Pending for Payment";
    case "PAID":
    case "VERIFIED":
    case "FIELDVERIFIED":
    case "APPROVALPENDING":
    case "PENDING_FOR_APPROVAL":
    case "PENDINGAPPROVAL":
      return "Pending for Approval";
    case "PENDING_FOR_CONNECTION_ACTIVATION":
      return "Pending for Connection Activation";
    case "CONNECTION_ACTIVATED":
      return "Connnection Activated"
    case "APPROVED":
      return "Approved";
    case "FIELDINSPECTION_PENDING":
      return "Field Inspection Pending"
    default:
      return 'NA';
  }
};

const styles = (theme) => ({
  textColorPrimary: {
    color: "red",
  },
});

let localizationLabels = transformById(
  JSON.parse(getLocalization(`localization_${getLocale()}`)),
  "code"
);

class TableData extends Component {
  state = {
    businessServiceSla: {},
    searchFilter: {
      value: '',
      typing: false
    },
    filter: {
      localityFilter: {
        selectedValue: ["ALL"],
        dropdownData: [
          {
            value: "ALL",
            label: "CS_INBOX_SELECT_ALL",
          }
        ]
      },
      moduleFilter: {
        selectedValue: ["ALL"],
        dropdownData: [
          {
            value: "ALL",
            label: "CS_INBOX_SELECT_ALL",
          }
        ]
      },
      statusFilter: {
        selectedValue: ["ALL"],
        dropdownData: [
          {
            value: "ALL",
            label: "CS_INBOX_SELECT_ALL",
          }
        ]
      }
    },
    showFilter: false,
    value: 0,
    totalRowCount: 0,
    tabData: [{ label: "COMMON_INBOX_TAB_ASSIGNED_TO_ME", dynamicArray: [0] }
      , { label: "COMMON_INBOX_TAB_ALL", dynamicArray: [0] }],
    taskboardData: [{ head: 0, body: "WF_TOTAL_TASK", color: "rgb(171,211,237)", baseColor: "rgb(53,152,219)" },
    { head: 0, body: "WF_TOTAL_NEARING_SLA", color: "rgb(238, 167, 58 ,0.38)", baseColor: "#EEA73A" },
    { head: 0, body: "WF_ESCALATED_SLA", color: "rgb(244, 67, 54 ,0.38)", baseColor: "#F44336" }],
    taskboardLabel: '',
    inboxData: [{ headers: [], rows: [] }],
    initialInboxData: [{ headers: [], rows: [] }],
    moduleName: "",
    loaded: true, // UI loads immediately
    dataLoading: false, // API loading state for spinner
    showLocality: !Boolean(localStorage.getItem('disableLocality')),
    color: "rgb(53,152,219)",
    timeoutForTyping: false,
    loadLocalityForInitialData: false,
    showLoadingTaskboard: false,
    autoSyncWarningOpen: false,
    autoSyncEnabled: localStorage.getItem("wf_inbox_auto_sync") === "true"
  };

  INBOX_CACHE_KEY = "wf_inbox_data_cache";
  AUTO_SYNC_KEY = "wf_inbox_auto_sync";
  CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1 Hour
  DB_NAME = "mSevaInboxDB";
  DB_VERSION = 1;
  STORE_NAME = "inboxStore";

  localityCache = {};

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = (event) => {
        console.error("IndexedDB error:", event.target.error);
        reject("IndexedDB open failed");
      };

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME);
        }
      };
    });
  }

  async saveToIndexedDB(key, data) {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.STORE_NAME], "readwrite");
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.put(data, key);

        request.onsuccess = () => resolve();
        request.onerror = (e) => reject(e);
      });
    } catch (e) {
      console.error("Error saving to IndexedDB:", e);
    }
  }

  async getFromIndexedDB(key) {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.STORE_NAME], "readonly");
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.get(key);

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (e) => reject(e);
      });
    } catch (e) {
      console.error("Error reading from IndexedDB:", e);
      return null;
    }
  }

  getUniqueList = (list = []) => {
    let newList = [];
    list.map(element => {
      if (!JSON.stringify(newList).includes(JSON.stringify(element))) {
        newList.push(element);
      }
    })
    return newList;
  }
  checkMatch = (row, value) => {
    if (value.length <= 2) {
      return true;
    }
    if (row[5].hiddenField.length !== 6) {
      if (row[0].text.toLowerCase().includes(value.toLowerCase()) ||
        row[3].text.props.label.toLowerCase().includes(value.toLowerCase()) ||
        String(row[4].text).toLowerCase().includes(value.toLowerCase()) ||
        getLocaleLabels("", `CS_COMMON_INBOX_${row[2].text.props.label.split('_')[1]}`).toLowerCase().includes(value.toLowerCase(), localizationLabels) ||
        getLocaleLabels("", row[1].text.props.label).toLowerCase().includes(value.toLowerCase(), localizationLabels) ||
        getLocaleLabels("", row[2].text.props.label).toLowerCase().includes(value.toLowerCase(), localizationLabels)
      ) {
        return true;
      }
    }
    if (
      row[5].hiddenField[0].includes(value.toLowerCase()) ||
      row[5].hiddenField[1].includes(value.toLowerCase()) ||
      row[5].hiddenField[2].includes(value.toLowerCase()) ||
      row[5].hiddenField[3].includes(value.toLowerCase()) ||
      row[5].hiddenField[4].includes(value.toLowerCase()) ||
      row[5].hiddenField[5].includes(value.toLowerCase())

    ) {
      return true;
    }
    return false;
  }
  handleChangeSearch = (value) => {
    this.setState({
      searchFilter: { value, typing: true }
    })
  }

  checkSLA = (taskboardLabel, row) => {
    const MAX_SLA = this.state.businessServiceSla[row[2].text.props.label.split('_')[1]];
    if (taskboardLabel === '' || taskboardLabel === 'WF_TOTAL_TASK') {
      return true;
    } else if ((taskboardLabel === 'WF_TOTAL_NEARING_SLA' && row[4].text > 0 && row[4].text <= (MAX_SLA - MAX_SLA / 3))) {
      return true;
    } else if ((taskboardLabel === 'WF_ESCALATED_SLA' && row[4].text <= 0)) {
      return true;
    } else {
      return false;
    }
  }
  checkRow = (row, filter, searchFilter, taskboardLabel) => {
    if ((filter.localityFilter.selectedValue.includes('ALL') || filter.localityFilter.selectedValue.includes(row[1].text.props.label)) &&
      (filter.moduleFilter.selectedValue.includes('ALL') || filter.moduleFilter.selectedValue.includes(row[2].text.props.label.split('_')[1])) &&
      (filter.statusFilter.selectedValue.includes('ALL') || filter.statusFilter.selectedValue.includes(row[2].text.props.label.split('_')[2])) &&
      (searchFilter.value === '' || this.checkMatch(row, searchFilter.value)
      )
    ) {
      return true;
    }
    return false;
  }
  convertMillisecondsToDays = (milliseconds) => {
    return (milliseconds / (1000 * 60 * 60 * 24));
  }
  applyFilter = (inboxData) => {
    this.showLoading();
    let initialInboxData = inboxData ? cloneDeep(inboxData) : cloneDeep(this.state.initialInboxData);
    const { filter, searchFilter, taskboardLabel, totalRowCount } = this.state;
    let ESCALATED_SLA = [];
    let NEARING_SLA = [];
    let totalRows = []
    if (initialInboxData.length === 2) {
      initialInboxData.map((row, ind) => {
        row.rows = row.rows.filter((eachRow) => {
          let isValid = this.checkRow(eachRow, filter, searchFilter, taskboardLabel);
          if (isValid && ind === 1) {
            let MAX_SLA = this.state.businessServiceSla[eachRow[2].text.props.label.split('_')[1]];
            if (eachRow[4].text <= 0) {
              ESCALATED_SLA.push(eachRow[4].text);
            }
            if (eachRow[4].text > 0 && eachRow[4].text <= (MAX_SLA - MAX_SLA / 3)) {
              NEARING_SLA.push(eachRow[4].text);
            }
            totalRows.push(1);
          }
          if (isValid) {
            return this.checkSLA(taskboardLabel, eachRow);
          }
          return isValid;
        }

        )
      })
    }

    if (initialInboxData.length === 2) {
      initialInboxData.map((row, ind) => {
        row.rows = row.rows.filter((eachRow) => {
          let isValid = this.checkSLA(taskboardLabel, eachRow);
          return isValid;
        }
        )
      })
    }

    let { taskboardData, tabData, showLoadingTaskboard } = this.state;
    if (totalRows.length == totalRowCount && showLoadingTaskboard == false) {
      this.setState({ showLoadingTaskboard: true })
    }
    taskboardData[0].head = showLoadingTaskboard ? totalRows.length : totalRowCount;
    taskboardData[1].head = totalRows.length == totalRowCount || showLoadingTaskboard ? NEARING_SLA.length : 'LOADING';
    taskboardData[2].head = totalRows.length == totalRowCount || showLoadingTaskboard ? ESCALATED_SLA.length : 'LOADING';
    tabData[0].dynamicArray = [initialInboxData[0].rows.length];
    tabData[1].dynamicArray = [showLoadingTaskboard ? totalRows.length : totalRowCount];
    this.hideLoading();
    return {
      inboxData: initialInboxData,
      taskboardData,
      tabData,
    }

  }
  handleChangeFilter = (filterName, value) => {
    const filter = { ...this.state.filter }

    if (value.includes('ALL') && this.state.filter[filterName].selectedValue.includes('ALL') && value.length > 1) {
      value.shift()
    } else if (value.includes('ALL') && value.length > 1 && !this.state.filter[filterName].selectedValue.includes('ALL')) {
      value = ['ALL']
    }
    filter[filterName].selectedValue = value
    this.setState({ filter });
  }
  clearFilter = () => {
    const initialInboxData = cloneDeep(this.state.initialInboxData);
    const tempObject = cloneDeep(this.state.initialInboxData);
    const filter = {
      localityFilter: {
        selectedValue: ["ALL"],
        dropdownData: [...this.state.filter.localityFilter.dropdownData]
      },
      moduleFilter: {
        selectedValue: ["ALL"],
        dropdownData: [...this.state.filter.moduleFilter.dropdownData]
      },
      statusFilter: {
        selectedValue: ["ALL"],
        dropdownData: [...this.state.filter.statusFilter.dropdownData]
      }
    }

    this.setState({
      searchFilter: {
        value: '', typing: false
      }, filter, inboxData: initialInboxData,
      initialInboxData: tempObject
    });
  }

  prepareInboxDataRows = async (data, all, loadLocality = false) => {
    const { toggleSnackbarAndSetText } = this.props;
    const uuid = get(this.props, "userInfo.uuid");
    if (isEmpty(data)) return { allData: [], assignedToMe: [] };
    let businessServices = [];
    let businessIds = [];

    // Identify which IDs need fetching (not in cache)
    if (this.state.showLocality && loadLocality) {
      data.forEach((item) => {
        if (!this.localityCache[item.businessId]) {
          businessIds.push(item.businessId);
          businessServices.push(item.moduleName);
        }
      });
    }

    const uniqueModules = uniq(businessServices)

    if (this.state.showLocality && loadLocality && businessIds.length > 0) {
      try {
        let requestBodies = []
        let endpoints = []
        let queries = []
        uniqueModules.map((uniqueModule, ind) => {
          requestBodies.push({
            searchCriteria: {
              "referenceNumber": businessIds
            }
          })
          queries.push([])
          endpoints.push(`egov-searcher/locality/${uniqueModule}/_get`)
        })

        if (endpoints.length > 0) {
          // Call each endpoint individually to handle partial failures
          const responses = await Promise.allSettled(
            endpoints.map((endpoint, index) => 
              httpRequest(endpoint, "search", queries[index], requestBodies[index])
            )
          );
          
          // Process successful responses
          responses.forEach((result, index) => {
            if (result.status === "fulfilled") {
              const res = result.value;
              if (res && res.Localities) {
                res.Localities.forEach(loc => {
                  this.localityCache[loc.referencenumber] = loc;
                });
              } else if (res && res.Properties) {
                res.Properties.forEach(property => {
                  this.localityCache[property.acknowldgementNumber] = {
                    referencenumber: property.acknowldgementNumber,
                    locality: property.address.locality.code
                  };
                });
              }
            }
          });
        }
      } catch (e) {
        console.log('Log => ** [Inbox] Locality fetch error (non-critical):', e.message);
      }
    }

    let localityDropdownList = [];
    let moduleDropdownList = [];
    let statusDropdownList = [];

    let assignedToMe = [];
    const initialData = data.map((item) => {
      
      const locality = this.state.showLocality && this.localityCache[item.businessId];

      var sla = item.businesssServiceSla && item.businesssServiceSla / (1000 * 60 * 60 * 24);
      let row0 = { text: item.businessId, subtext: item.businessService, hiddenText: item.moduleName };
      let localityString = locality && locality.locality ? `${item.tenantId.toUpperCase().replace(/[.]/g, "_")}_REVENUE_${locality.locality.replace("-", "_")}` : "NA";
      let row1 = { text: locality ? <Label label={localityString} color="#000000" /> : <Label label={"NA"} color="#000000" /> };
      let row2 = {
        text: item.state ? (
          <Label
            label={`WF_${item.businessService.toUpperCase()}_${item.state.state}`}
            defaultLabel={`WF_${item.businessService.toUpperCase()}_${item.state.state}`}
            color="#000000"
          />
        ) : (
          "NA"
        ),
      };

      // let row3 = { text: item.assignes != null ? <Label label={item.assignes[0].name} color="#000000" /> : <Label label={"NA"} color="#000000" /> };
      let row3 = { text: item.assigner && item.assigner.name ? <Label label={item.assigner.name} color="#000000" /> : <Label label={"NA"} color="#000000" /> };
      let row4 = { text: Math.round(sla), badge: true };
      let row5 = { historyButton: true };

      let localityDropdown = { label: getLocaleLabels("", row1.text.props.label, localizationLabels), value: row1.text.props.label };
      localityDropdownList.push(localityDropdown);
      let moduleDropdown = { label: getLocaleLabels("", `CS_COMMON_INBOX_${row2.text.props.label.split('_')[1]}`, localizationLabels), value: row2.text.props.label.split('_')[1] };
      moduleDropdownList.push(moduleDropdown);
      let statusDropdown = { label: getLocaleLabels("", row2.text.props.label, localizationLabels), value: row2.text.props.label.split('_')[2] };
      statusDropdownList.push(statusDropdown);

      let dataRows = [
        row0,
        row1,
        row2,
        row3,
        row4,
        {
          ...row5, hiddenField: [row0.text.toLowerCase(),
          String(row4.text),
          getLocaleLabels("", `CS_COMMON_INBOX_${row2.text.props.label.split('_')[1]}`, localizationLabels).toLowerCase(),
          getLocaleLabels("", row1.text.props.label, localizationLabels).toLowerCase(),
          getLocaleLabels("", row2.text.props.label, localizationLabels).toLowerCase(),
          row3.text.props.label.toLowerCase()]
        }
      ];
      let assignes = get(item, 'assignes');
      if (get(assignes ? assignes[0] : {}, "uuid") === uuid) {
        assignedToMe.push([...dataRows])
      }
      return dataRows;
    });

    if (all) {
      this.setState({
        filter: {
          localityFilter: {
            selectedValue: ['ALL'],
            dropdownData: this.getUniqueList([
              {
                value: "ALL",
                label: getLocaleLabels("", "CS_INBOX_SELECT_ALL", localizationLabels),
              }, ...localityDropdownList
            ])
          },
          moduleFilter: {
            selectedValue: ['ALL'],
            dropdownData: this.getUniqueList([
              {
                value: "ALL",
                label: getLocaleLabels("", "CS_INBOX_SELECT_ALL", localizationLabels),
              }, ...moduleDropdownList
            ])
          },
          statusFilter: {
            selectedValue: ['ALL'],
            dropdownData: this.getUniqueList([
              {
                value: "ALL",
                label: getLocaleLabels("", "CS_INBOX_SELECT_ALL", localizationLabels),
              }, ...statusDropdownList
            ])
          }
        }
      });

    }
    return { allData: initialData, assignedToMe: assignedToMe };
  };

  handleChange = (event, value) => {
    this.setState({ value });
  };

  getBussinessServiceData() {
    let businessServiceData = JSON.parse(localStorageGet("businessServiceData"));
    businessServiceData = businessServiceData ? businessServiceData : this.setBusinessServiceDataToLocalStorage([{ key: "tenantId", value: getTenantId() }]);;
    return businessServiceData;
  }
  getMaxSLA() {
    const businessServiceData = this.getBussinessServiceData();
    let businessServiceSla = {}
    businessServiceData && Array.isArray(businessServiceData) && businessServiceData.map(eachRow => {
      businessServiceSla[eachRow.businessService.toUpperCase()] = this.convertMillisecondsToDays(eachRow.businessServiceSla);
    })
    this.setState({ businessServiceSla });
    return businessServiceSla;
  }
  setBusinessServiceDataToLocalStorage = async (queryObject) => {
    const { toggleSnackbarAndSetText } = this.props;
    try {
      const payload = await httpRequest("egov-workflow-v2/egov-wf/businessservice/_search", "_search", queryObject);
      localStorageSet("businessServiceData", JSON.stringify(get(payload, "BusinessServices")));
      return get(payload, "BusinessServices");
    } catch (e) {
      if (e && e.message && e.message.includes('setItem')) {

      } else {
        toggleSnackbarAndSetText(
          true,
          {
            labelName: "Not authorized to access Business Service!",
            labelKey: "ERR_NOT_AUTHORISED_BUSINESS_SERVICE",
          },
          "error"
        );
      }

    }
  };

  componentDidMount = async () => {
    this.getMaxSLA();

    // Check Sync Mode
    const autoSync = localStorage.getItem(this.AUTO_SYNC_KEY) === "true";

    if (autoSync) {
      // Auto Sync ON: Always fetch fresh data
      setTimeout(() => {
        this.loadDataInBackground();
      }, 10);
    } else {
      // Auto Sync OFF: Check Cache
      const cachedData = await this.getCachedData();
      if (cachedData) {
        console.log("Log => [Inbox] Loading from IndexedDB Cache");
        this.loadDataFromCache(cachedData);
      } else {
        console.log("Log => [Inbox] Cache miss or expired, fetching data");
        setTimeout(() => {
          this.loadDataInBackground();
        }, 10);
      }
    }
  };

  getCachedData = async () => {
    try {
      const cache = await this.getFromIndexedDB(this.INBOX_CACHE_KEY);
      if (!cache) return null;

      const now = Date.now();
      if (now - cache.timestamp < this.CACHE_EXPIRY_MS) {
        return cache.data;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  loadDataFromCache = async (data) => {
    this.showLoading();
    try {
      // We have the raw ProcessInstances in cache
      // We need to run prepareInboxDataRows to format them (and fetch locality if needed/not cached)
      // Note: localityCache is separate. prepareInboxDataRows handles it.
      // If we cached the *raw* data, we can just pass it.

      const allData = data; // Assuming data is the array of process instances

      // We treat it as if we have all data
      await this.loadLocalityForAllData(allData, false); // false to skip saving to cache again (optional, but safe to save)
      this.setState({ dataLoading: false });
    } catch (e) {
      console.error("Error loading specific cache data", e);
      this.loadDataInBackground(); // Fallback
    }
  };

  handleSyncOption = (key) => {
    switch (key) {
      case "SYNC_NOW":
        this.loadDataInBackground();
        break;
      case "AUTO_SYNC":
        this.setState({ autoSyncWarningOpen: true });
        break;
      case "OFF_SYNC":
        localStorage.setItem(this.AUTO_SYNC_KEY, "false");
        this.setState({ autoSyncEnabled: false });
        this.props.toggleSnackbarAndSetText(true, { labelName: "Auto Sync Disabled", labelKey: "INBOX_AUTO_SYNC_DISABLED" }, "info");
        break;
      default:
        break;
    }
  };

  handleAutoSyncConfirm = () => {
    localStorage.setItem(this.AUTO_SYNC_KEY, "true");
    this.setState({ autoSyncEnabled: true, autoSyncWarningOpen: false });
    this.loadDataInBackground(); // Fetch immediately when enabled
    this.props.toggleSnackbarAndSetText(true, { labelName: "Auto Sync Enabled", labelKey: "INBOX_AUTO_SYNC_ENABLED" }, "success");
  };

  handleAutoSyncCancel = () => {
    this.setState({ autoSyncWarningOpen: false });
  };

  loadDataInBackground = async () => {
    this.setState({ dataLoading: true });
    try {
      await this.loadInitialData();
    } catch (error) {
      console.error("Background data loading failed:", error);
      this.setState({ dataLoading: false });
    }
  };
  loadInitialData = async () => {
    const { toggleSnackbarAndSetText, prepareFinalObject } = this.props;
    const tenantId = getTenantId();
    let { taskboardData, tabData } = this.state;
    const inboxData = [{ headers: [], rows: [] }];
    try {
      this.showLoading();
      const requestBody1 = [{ key: "tenantId", value: tenantId }];

      let maxCount = 5000;
      // OPTIMIZATION: Reduced from 100 to 25 to improve TTI
      let limit = 25;
      let offset = 0;

      const requestBody = [{ key: "tenantId", value: tenantId }, { key: "offset", value: 0 }, { key: "limit", value: maxCount > 100 ? limit : maxCount }];
      const responseData = await httpRequest("egov-workflow-v2/egov-wf/process/_search", "_search", requestBody);
      const allData = orderBy(get(responseData, "ProcessInstances", []), ["businesssServiceSla"]);

      if (maxCount > 25) {
        this.loadRemainingData(null, responseData);
      } else {
        this.loadLocalityForAllData(allData);
        this.setState({ dataLoading: false });
      }

      const convertedData = await this.prepareInboxDataRows(allData, true, false)
      const allDataRows = convertedData.allData;
      const assignedDataRows = convertedData.assignedToMe;

      let headersList = [
        "WF_INBOX_HEADER_APPLICATION_NO",
        "WF_INBOX_HEADER_LOCALITY",
        "WF_INBOX_HEADER_STATUS",
        "WF_INBOX_HEADER_CREATED_BY",
        "WF_INBOX_HEADER_SLA_DAYS_REMAINING",
      ];
      inboxData[0].headers = headersList;
      inboxData[0].rows = assignedDataRows;

      tabData[0].dynamicArray = [assignedDataRows.length];
      tabData[1].dynamicArray = [allDataRows.length];
      inboxData.push({
        headers: headersList,
        rows: allDataRows,
      });
      let NEARING_SLA = [];
      let ESCALATED_SLA = [];
      const taskCount = allDataRows.length;
      taskboardData[0].head = taskCount;
      taskboardData[1].head = NEARING_SLA.length;
      taskboardData[2].head = ESCALATED_SLA.length;

      this.setState({
        loaded: true,
        totalRowCount: maxCount,
        inboxData, taskboardData, tabData, initialInboxData: cloneDeep(inboxData)
      });
      this.hideLoading()
    } catch (e) {
      this.hideLoading();
      this.setState({ dataLoading: false });
      toggleSnackbarAndSetText(true, { labelName: "Workflow search error !", labelKey: "ERR_SEARCH_ERROR" }, "error");
    }
    prepareFinalObject("InboxData", [...inboxData]);
    this.getMaxSLA();
  }
  loadRemainingData = async (_, initialResponse) => {
    const { toggleSnackbarAndSetText, prepareFinalObject } = this.props;
    const tenantId = getTenantId();
    try {
      // Data Optimization: Fetching up to 300 records in parallel chunks
      const limitPerRequest = 100;
      const totalTarget = 300;
      const currentCount = 25; // Already fetched

      const requests = [];
      for (let offset = currentCount; offset < totalTarget; offset += limitPerRequest) {
        const limit = Math.min(limitPerRequest, totalTarget - offset);
        const reqBody = [{ key: "tenantId", value: tenantId }, { key: "offset", value: offset }, { key: "limit", value: limit }];
        requests.push(httpRequest("egov-workflow-v2/egov-wf/process/_search", "_search", reqBody));
      }

      const responses = await Promise.all(requests);

      let allProcessInstances = [...get(initialResponse, "ProcessInstances", [])];
      responses.forEach(res => {
        allProcessInstances = [...allProcessInstances, ...get(res, "ProcessInstances", [])];
      });

      const responseData = { ProcessInstances: allProcessInstances };

      const allData = orderBy(get(responseData, "ProcessInstances", []), ["businesssServiceSla"]);

      // Delegate processing and locality fetch to the dedicated function
      // This avoids double processing/rendering which causes freezing
      await this.loadLocalityForAllData(allData);
      this.setState({ dataLoading: false });

    } catch (e) {
      console.error("Error in loadRemainingData:", e);
      this.hideLoading();
      this.setState({ dataLoading: false });
      toggleSnackbarAndSetText(true, { labelName: "Workflow search error !", labelKey: "ERR_SEARCH_ERROR" }, "error");
    }
  }
  loadLocalityForAllData = async (allData, saveToCache = true) => {
    const { toggleSnackbarAndSetText, prepareFinalObject } = this.props;
    let { taskboardData, tabData } = this.state;
    const inboxData = [{ headers: [], rows: [] }];
    try {
      const convertedData = await this.prepareInboxDataRows(allData, true, true)
      const allDataRows = convertedData.allData;
      const assignedDataRows = convertedData.assignedToMe;

      let headersList = [
        "WF_INBOX_HEADER_APPLICATION_NO",
        "WF_INBOX_HEADER_LOCALITY",
        "WF_INBOX_HEADER_STATUS",
        "WF_INBOX_HEADER_CREATED_BY",
        "WF_INBOX_HEADER_SLA_DAYS_REMAINING",
      ];
      inboxData[0].headers = headersList;
      inboxData[0].rows = assignedDataRows;

      tabData[0].dynamicArray = [assignedDataRows.length];
      tabData[1].dynamicArray = [allDataRows.length];
      inboxData.push({
        headers: headersList,
        rows: allDataRows,
      });
      let NEARING_SLA = [];
      let ESCALATED_SLA = [];
      const taskCount = allDataRows.length;
      taskboardData[0].head = taskCount;
      taskboardData[1].head = NEARING_SLA.length;
      taskboardData[2].head = ESCALATED_SLA.length;

      this.setState({
        loaded: true,
        inboxData, taskboardData, tabData, initialInboxData: cloneDeep(inboxData)
      });

      if (saveToCache) {
        try {
          const cachePayload = {
            timestamp: Date.now(),
            data: allData
          };
          await this.saveToIndexedDB(this.INBOX_CACHE_KEY, cachePayload);
        } catch (e) {
          console.warn("Failed to save Inbox cache", e);
        }
      }
    } catch (e) {
      this.hideLoading();
      toggleSnackbarAndSetText(true, { labelName: "Workflow search error !", labelKey: "ERR_SEARCH_ERROR" }, "error");
    }
    prepareFinalObject("InboxData", [...inboxData]);
    this.getMaxSLA();
  }

  onModuleFilter = (event) => {
    this.setState({ moduleName: event.target.value }, () => {
      const { InboxData } = this.props;
      let { tabData } = this.state;
      const filteredData = InboxData.map((item, index) => {
        return {
          headers: item.headers,
          rows: item.rows.filter((eachRow) => {
            return eachRow[0].subtext === this.state.moduleName;
          }),
        };
      });

      tabData[0] = { label: "COMMON_INBOX_TAB_ASSIGNED_TO_ME", dynamicArray: [filteredData[0].rows.length] };
      tabData[1] = { label: "COMMON_INBOX_TAB_ALL", dynamicArray: [filteredData[1].rows.length] };

      this.setState({
        inboxData: filteredData,
        tabData,
      });
    });
  };

  onTaskBoardClick = (baseColor, label) => {
    this.setState({
      taskboardLabel: label
    });
    this.setState({
      color: baseColor,
    });
  };
  showLoading() {
  }
  hideLoading() {
  }
  render() {
    const { value, filter, searchFilter, businessServiceSla, dataLoading } = this.state;
    const { classes } = this.props;
    const { handleChangeFilter, clearFilter, handleChangeSearch } = this;
    let { taskboardData, tabData, inboxData } = this.state;

    if (this.state.loaded) {
      const filteredData = this.applyFilter();
      taskboardData = filteredData.taskboardData;
      inboxData = filteredData.inboxData;
      tabData = filteredData.tabData;
    }
    return (
      <div className="col-md-12 col-sm-12 col-xs-12">
        <div>
          <div className="row" style={{ marginBottom: '5px', marginTop: '5px', marginLeft: '-20px' }}>
            <div className="col-md-9 col-sm-9 col-xs-12" style={{ marginTop: '5px' }}>
              <Label className="landingPageUser" label={"WF_MY_WORKLIST"} />
            </div>
            <div className="col-md-3 col-sm-3 col-xs-10 search-bar" style={{}}>
              <TextFieldIcon
                hintStyle={{ top: '6px' }}
                iconStyle={{ top: 46 }}
                hintText={getLocaleLabels("", "CS_INBOX_SEARCH", localizationLabels)}
                value={searchFilter.value}
                iconPosition="before"
                className="whiteBackground"
                onChange={(e, value) => {
                  handleChangeSearch(value);
                }}
              />
            </div>
            <div className="icon-hidden filter-icon col-xs-2" onClick={() => {
              this.setState({ showFilter: !this.state.showFilter })
            }}>
              <FilterListIcon />
            </div>
          </div>
          <Hidden only={["xs"]} implementation="css">
            <Filter handleChangeFilter={handleChangeFilter.bind(this)} clearFilter={clearFilter} filter={filter}></Filter></Hidden>
          <Hidden only={["sm", "md", "lg", "xl"]} implementation="css">
            {this.state.showFilter &&
              <Filter handleChangeFilter={handleChangeFilter.bind(this)} clearFilter={clearFilter} filter={filter}></Filter>}
          </Hidden>
        </div>
        <Taskboard data={taskboardData} onSlaClick={this.onTaskBoardClick} color={this.state.color} />
        <div className="backgroundWhite" style={{ position: 'relative' }}>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgb(211, 211, 211)", backgroundColor: "white" }}>
            <Tabs
              value={value}
              onChange={this.handleChange}
              className={`inbox-tabs-container ${classes.textColorPrimary}`}
              indicatorColor="primary"
              textColor="primary"
              style={{ borderBottom: "none", textColor: "red", backgroundColor: "white", flex: 1 }}
            >
              {tabData.map((item) => {
                return (
                  <Tab className={`inbox-tab ${classes.textColorPrimary}`} label={<Label label={item.label} dynamicArray={item.dynamicArray} />} />
                );
              })}
            </Tabs>
            <div style={{ display: "flex", alignItems: "center", paddingRight: "10px" }}>
              <div
                onClick={() => this.handleSyncOption("SYNC_NOW")}
                style={{ cursor: "pointer", display: "flex", alignItems: "center", marginRight: "15px" }}
                title="Sync Now"
              >
                <AutorenewIcon style={{
                  color: "#FE7A51",
                  animation: this.state.dataLoading ? "spin 1.5s linear infinite" : "none"
                }} />
              </div>
              <style>{
                `@keyframes spin { 
                    0% { transform: rotate(0deg); } 
                    100% { transform: rotate(360deg); } 
                }`
              }</style>
              <div style={{ display: "flex", alignItems: "center" }}>
                <Switch
                  checked={this.state.autoSyncEnabled}
                  onChange={(e) => this.handleSyncOption(e.target.checked ? "AUTO_SYNC" : "OFF_SYNC")}
                  color="primary"
                  inputProps={{ 'aria-label': 'primary checkbox' }}
                />
                <span style={{
                  color: "rgba(0, 0, 0, 0.6)",
                  fontSize: "14px",
                  fontWeight: 500
                }}>
                  <Label label="INBOX_AUTO_SYNC" />
                </span>
              </div>
            </div>
          </div>
          <div className="inbox-component-container">
            {/* {console.log("DEBUG: TableData rendering InboxData. State SLA:", businessServiceSla)} */}
            <InboxData data={inboxData[value]} businessServiceSla={businessServiceSla} loading={dataLoading} />
          </div>
        </div>
        <Dialog
          open={this.state.autoSyncWarningOpen}
          onClose={this.handleAutoSyncCancel}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">{"Enable Auto Sync?"}</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Enabling Auto Sync will fetch fresh data every time you visit this page. This may take some time to load all modules. Are you sure?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleAutoSyncCancel} color="primary">
              Cancel
            </Button>
            <Button onClick={this.handleAutoSyncConfirm} color="primary" autoFocus>
              Enable
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  const { screenConfiguration, auth } = state;
  const { userInfo } = auth;
  const { preparedFinalObject } = screenConfiguration;
  const { InboxData } = preparedFinalObject;

  return { InboxData, userInfo };
};

const mapDispatchToProps = (dispatch) => {
  return {
    prepareFinalObject: (jsonPath, value) =>
      dispatch(prepareFinalObject(jsonPath, value)),
    toggleSnackbarAndSetText: (open, message, error) =>
      dispatch(toggleSnackbarAndSetText(open, message, error)),
  };
};

export default withStyles(styles)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(TableData)
);
