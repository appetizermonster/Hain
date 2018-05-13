'use strict';

const lo_isEqual = require('lodash.isequal');
const lo_cloneDeep = require('lodash.clonedeep');
const lo_findIndex = require('lodash.findindex');

const React = require('react');
const ReactDOM = require('react-dom');

import { LeftNav, List, ListItem, Subheader, RaisedButton } from 'material-ui';
import { SelectableContainerEnhance } from 'material-ui/lib/hoc/selectable-enhance';
import SchemaForm from './schema-form/schema-form';
import injectTapEventPlugin from 'react-tap-event-plugin';

injectTapEventPlugin();
const SelectableList = SelectableContainerEnhance(List);

const ipc = require('electron').ipcRenderer;
const RpcChannel = require('../main/shared/rpc-channel');
const rpc = RpcChannel.createWithIpcRenderer('#prefWindow', ipc);

class Preferences extends React.Component {
  constructor() {
    super();
    this.state = {
      selectedPrefId: null,
      prefItems: [],
      schema: null,
      model: {},
      modelCopy: {}
    };
    this.commitTimers = {};
  }
  onModelChange(newModel) {
    // Do not commit if nothing changed
    if (lo_isEqual(newModel, this.state.modelCopy)) return;

    this.commitChanges(this.state.selectedPrefId, lo_cloneDeep(newModel));
  }
  commitChanges(prefId, model) {
    const timer = this.commitTimers[prefId];
    clearTimeout(timer);
    this.commitTimers[prefId] = setTimeout(() => {
      rpc.call('updatePreferences', { prefId, model });
      this.setState({
        model,
        modelCopy: lo_cloneDeep(model)
      });
    }, 150);
  }
  componentDidMount() {
    this.refreshAllPreferences();
    document.getElementById('spinner').remove();
  }
  refreshAllPreferences() {
    rpc.call('getPrefItems').then((prefItems) => {
      this.setState({ prefItems });

      if (prefItems.length <= 0) return;

      let activeIndex = 0;
      // Parse location.hash first
      if (location.hash.length > 0) {
        const selectedPrefId = location.hash.substring(1);
        activeIndex = lo_findIndex(prefItems, (x) => x.id === selectedPrefId);
        if (activeIndex < 0) activeIndex = 0;
      }
      this.selectPref(prefItems[activeIndex].id);
    });
  }
  selectPref(prefId) {
    rpc.call('getPreferences', { prefId }).then((result) => {
      const { schema, model } = result;
      this.setState({
        selectedPrefId: prefId,
        schema: JSON.parse(schema),
        model: model,
        modelCopy: lo_cloneDeep(model)
      });
    });
  }
  handleUpdateSelection(evt, value) {
    this.selectPref(value);
  }
  handleResetAll(evt) {
    const prefId = this.state.selectedPrefId;
    rpc
      .call('resetPreferences', { prefId })
      .then(() => this.selectPref(prefId));
  }
  render() {
    const listItems = [];
    const selectedPrefId = this.state.selectedPrefId;

    let lastPrefGroup = null;
    for (const prefItem of this.state.prefItems) {
      const prefId = prefItem.id;
      const prefGroup = prefItem.group;

      if (prefGroup !== lastPrefGroup) {
        const groupHeader = (
          <Subheader
            key={prefGroup}
            style={{ lineHeight: '32px', fontSize: 13 }}
          >
            {prefGroup}
          </Subheader>
        );
        listItems.push(groupHeader);
        lastPrefGroup = prefGroup;
      }

      const menuItem = (
        <ListItem key={prefId} value={prefId} primaryText={prefId} />
      );
      listItems.push(menuItem);
    }

    let schemaForm = null;
    if (this.state.schema) {
      schemaForm = (
        <SchemaForm
          schema={this.state.schema}
          model={this.state.model}
          title={selectedPrefId}
          onChange={this.onModelChange.bind(this)}
        />
      );
    }

    return (
      <div>
        <LeftNav>
          <SelectableList
            valueLink={{
              value: selectedPrefId,
              requestChange: this.handleUpdateSelection.bind(this)
            }}
          >
            {listItems}
          </SelectableList>
        </LeftNav>

        <div style={{ paddingLeft: '265px', paddingTop: '5px' }}>
          <div style={{ padding: '5px', paddingTop: '0px' }}>
            {schemaForm}
            <br />
            <div style={{ textAlign: 'right' }}>
              <RaisedButton
                label="Reset to Default"
                secondary={true}
                onTouchTap={this.handleResetAll.bind(this)}
              />
              <br />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<Preferences />, document.getElementById('app'));
