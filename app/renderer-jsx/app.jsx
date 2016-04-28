/* global $ */
'use strict';

const lo_orderBy = require('lodash.orderby');
const lo_uniq = require('lodash.uniq');
const lo_map = require('lodash.map');
const lo_reject = require('lodash.reject');
const lo_clamp = require('lodash.clamp');
const lo_isString = require('lodash.isstring');

const React = require('react');
const ReactDOM = require('react-dom');

const RPCRenderer = require('./rpc-renderer');
const rpc = new RPCRenderer('mainwindow');
const remote = require('electron').remote;

const Ticket = require('./ticket');
const searchTicket = new Ticket();
const previewTicket = new Ticket();

import { TextField, Avatar, SelectableContainerEnhance, List, ListItem, Subheader, FontIcon } from 'material-ui';
import MuiThemeProvider from 'material-ui/lib/MuiThemeProvider';
import getMuiTheme from 'material-ui/lib/styles/getMuiTheme';
import { Notification } from 'react-notification';
import HTMLFrame from './html-frame/html-frame';

const SelectableList = SelectableContainerEnhance(List);

const SEND_INTERVAL = 30; // ms
const CLEAR_INTERVAL = 250; // ms

// HACK to speed up rendering performance
const muiTheme = getMuiTheme({
  userAgent: false
});

class AppContainer extends React.Component {
  constructor() {
    super();

    this.state = {
      query: '',
      results: [],
      selectionIndex: 0,
      toastMessage: '',
      toastOpen: false
    };
    this.toastQueue = [];
    this.lastResultTicket = -1;
  }

  processToast() {
    if (this.toastQueue.length <= 0 ||
        this.state.toastOpen || !remote.getCurrentWindow().isVisible()) {
      return;
    }
    const contents = this.toastQueue.shift();
    const message = contents.message;
    const duration = contents.duration || 2000;
    this.setState({ toastMessage: message, toastOpen: true });
    this.autoHideToast(duration);
  }

  autoHideToast(duration) {
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.setState({ toastOpen: false });
    }, duration);
  }

  componentDidMount() {
    this.refs.query.focus();
    rpc.connect();
    rpc.on('on-toast', (evt, msg) => {
      const { message, duration } = msg;
      this.toastQueue.push({ message, duration });
    });
    rpc.on('on-log', (evt, msg) => {
      console.log(msg);
    });
    rpc.on('set-query', (evt, args) => {
      this.setQuery(args);
    });
    rpc.on('on-result', (evt, msg) => {
      const { ticket, type, payload } = msg;
      if (searchTicket.current !== ticket)
        return;

      let results = this.state.results;
      let selectionIndex = this.state.selectionIndex;
      if (this.lastResultTicket !== ticket) {
        results = [];
        selectionIndex = 0;
        this.lastResultTicket = ticket;
      }

      if (type === 'add') {
        results = results.concat(payload);
        results = lo_orderBy(results, ['score'], ['desc']);

        // Grouping results
        const groups = lo_uniq(lo_map(results, x => x.group));
        const groupedResults = [];
        for (const x of groups) {
          for (const k of results) {
            if (k.group !== x)
              continue;
            groupedResults.push(k);
          }
        }
        results = groupedResults;
      } else if (type === 'remove') {
        const _id = payload.id;
        results = lo_reject(results, (x) => {
          return (x.id === _id && x.pluginId === payload.pluginId);
        });
      }

      this.setState({ results, selectionIndex });
    });
    rpc.on('on-render-preview', (evt, msg) => {
      const { ticket, html } = msg;
      if (previewTicket.current !== ticket)
        return;
      if (this.state.previewHtml == html)
        return;
      this.setState({ previewHtml: html });
    });
    setInterval(this.processToast.bind(this), 200);
    this.setQuery('');
  }

  componentDidUpdate(prevProps, prevState) {
    this.updatePreview();
  }

  setQuery(args) {
    this.setState({ query: args, selectionIndex: 0 });
    this.refs.query.focus();
    this.search(args);
  }

  scrollTo(selectionIndex) {
    const listItem = this.refs[`item.${selectionIndex}`];
    const header = this.refs[`header.${selectionIndex}`];
    const target = header || listItem;
    if (target) {
      const target_dom = ReactDOM.findDOMNode(target);
      const listContainer_dom = ReactDOM.findDOMNode(this.refs.listContainer);

      const rect = target_dom.getBoundingClientRect();
      const parentRect = listContainer_dom.getBoundingClientRect();
      const isOutside = ((rect.bottom - rect.height) <= parentRect.top || (rect.top + rect.height) >= parentRect.bottom);

      if (isOutside) {
        $(listContainer_dom).scrollTo(target_dom);
      }
    }
  }

  search(query) {
    const ticket = searchTicket.newTicket();

    clearTimeout(this.lastSearchTimer);
    this.lastSearchTimer = setTimeout(() => {
      rpc.send('search', { ticket, query });
    }, SEND_INTERVAL);
    clearTimeout(this.lastClearTimer);
    this.lastClearTimer = setTimeout(() => {
      if (this.lastResultTicket === ticket)
        return;
      this.setState({ results: [], selectionIndex: 0 });
    }, CLEAR_INTERVAL);
  }

  execute(item) {
    if (item === undefined)
      return;
    if (item.redirect) {
      this.setQuery(item.redirect);
      return;
    }

    const params = {
      pluginId: item.pluginId,
      id: item.id,
      payload: item.payload
    };
    rpc.call('execute', params);
  }

  updatePreview() {
    const selectionIndex = this.state.selectionIndex;
    const selectedResult = this.state.results[selectionIndex];
    if (selectedResult === undefined || !selectedResult.preview) {
      this._renderedPreviewHash = null;
      return;
    }

    const pluginId = selectedResult.pluginId;
    const id = selectedResult.id;
    const payload = selectedResult.payload;
    const previewHash = `${pluginId}.${id}`;

    if (previewHash === this._renderedPreviewHash)
      return;
    this._renderedPreviewHash = previewHash;

    const ticket = previewTicket.newTicket();
    rpc.send('renderPreview', { ticket, pluginId, id, payload });
  }

  handleSelection(selectionDelta) {
    const results = this.state.results;
    const upperSelectionIndex = results.length - 1;

    let newSelectionIndex = this.state.selectionIndex + selectionDelta;
    newSelectionIndex = lo_clamp(newSelectionIndex, 0, upperSelectionIndex);

    if (this.state.selectionIndex === newSelectionIndex)
      return;

    this.setState({ selectionIndex: newSelectionIndex });
    this.scrollTo(newSelectionIndex);
  }

  handleEsc() {
    const query = this.state.query;
    if (query === undefined || query.length <= 0) {
      rpc.call('close');
      return;
    }
    this.setQuery('');
  }

  handleEnter() {
    const results = this.state.results;
    const selectionIndex = this.state.selectionIndex;
    this.execute(results[selectionIndex]);
  }

  handleTab() {
    const results = this.state.results;
    const selectionIndex = this.state.selectionIndex;
    const item = results[selectionIndex];
    if (item && item.redirect)
      this.setQuery(item.redirect);
  }

  handleKeyDown(evt) {
    const key = evt.key;
    const keyHandlers = {
      Escape: this.handleEsc.bind(this),
      ArrowUp: this.handleSelection.bind(this, -1),
      ArrowDown: this.handleSelection.bind(this, 1),
      PageUp: this.handleSelection.bind(this, -5),
      PageDown: this.handleSelection.bind(this, 5),
      Enter: this.handleEnter.bind(this),
      Tab: this.handleTab.bind(this)
    };
    const selectedHandler = keyHandlers[key];
    if (selectedHandler !== undefined) {
      selectedHandler();
      evt.preventDefault();
    }
  }

  handleChange(evt) {
    const query = this.refs.query.getValue();
    this.setState({ query });
    this.scrollTo(0);
    this.search(query);
  }

  handleUpdateSelectionIndex(evt, index) {
    this.setState({ selectionIndex: index });
  }

  handleItemClick(i, evt) {
    this.execute(this.state.results[i]);
  }

  handleKeyboardFocus(evt) {
    this.refs.query.focus();
  }

  parseIconUrl(iconUrl) {
    if (!lo_isString(iconUrl)) {
      return null;
    }
    if (iconUrl.startsWith('#')) {
      const iconClass = iconUrl.substring(1);
      return <Avatar key="icon" icon={<FontIcon className={iconClass} />} />;
    }
    return <Avatar key="icon" src={iconUrl} />;
  }

  render() {
    const results = this.state.results;
    const selectionIndex = this.state.selectionIndex;
    const selectedResult = results[selectionIndex];

    const list = [];
    let lastGroup = null;
    for (let i = 0; i < results.length; ++i) {
      const result = results[i];
      const avatar = this.parseIconUrl(result.icon);
      if (result.group !== lastGroup) {
        const headerId = `header.${i}`;
        list.push(
          <div key={headerId} ref={headerId}>
            <Subheader key="header" style={{ lineHeight: '32px', fontSize: 13 }}>{ result.group }</Subheader>
          </div>
        );
        lastGroup = result.group;
      }
      const itemId = `item.${i}`;
      list.push(
        <ListItem
          key={itemId}
          ref={itemId}
          value={i}
          onKeyboardFocus={this.handleKeyboardFocus.bind(this)}
          style={{ fontSize: 15, lineHeight: '13px' }}
          primaryText={<div dangerouslySetInnerHTML={{ __html: result.title }} />}
          secondaryText={<div style={{ fontSize: 13 }} dangerouslySetInnerHTML={{ __html: result.desc }} />}
          onClick={this.handleItemClick.bind(this, i)}
          onKeyDown={this.handleKeyDown.bind(this)}
          leftAvatar={avatar}
          />
      );
    }

    // nothing yet
    if (list.length === 0) {
      list.push(
        <ListItem primaryText="Sorry, No Results"
                  secondaryText="It may takes some time to show results"
                  leftAvatar={<Avatar icon={<FontIcon className="fa fa-heart" />} />} />
      );
    }

    const containerStyles = { overflowX: 'hidden', transition: 'width 0.35s cubic-bezier(0.23, 1, 0.32, 1)',
                              overflowY: 'auto', width: '100%', height: '440px' };
    let previewBox = null;
    if (selectedResult && selectedResult.preview) {
      const previewStyle = { float: 'left', boxSizing: 'border-box',
                             overflowX: 'hidden', overflowY: 'hidden',
                             padding: '10px', paddingRight: '0px', width: '470px', height: '440px' };
      containerStyles.float = 'left';
      containerStyles.width = '300px';

      previewBox = (
        <div style={previewStyle}>
          <HTMLFrame html={this.state.previewHtml}
                     sandbox="allow-forms allow-popups allow-same-origin allow-scripts"
                     style={{ width: '100%', height: '100%', border: '0' }} />
        </div>
      );
    }

    return (
      <MuiThemeProvider muiTheme={muiTheme}>
      <div>
        <div key="queryWrapper" style={{ position: 'fixed', height: '40px', 'zIndex': 1000, top: 0, width: '776px' }}>
          <TextField
            key="query"
            ref="query"
            style={{ fontSize: '20px' }}
            hintText="Enter your command!"
            fullWidth={true}
            value={this.state.query}
            onKeyDown={this.handleKeyDown.bind(this)}
            onChange={this.handleChange.bind(this)}
            />
        </div>
        <div key="containerWrapper">
          <div key="container" ref="listContainer" style={containerStyles}>
            <SelectableList key="list" style={{ paddingTop: '0px', paddingBottom: '0px' }}
                            valueLink={{ value: selectionIndex, requestChange: this.handleUpdateSelectionIndex.bind(this) }}>
              {list}
            </SelectableList>
          </div>
          {previewBox}
        </div>
        <Notification key="notification" isActive={this.state.toastOpen}
                      message={<div dangerouslySetInnerHTML={{ __html: this.state.toastMessage }} />} />
      </div>
      </MuiThemeProvider>
    );
  }
}

const appContainer = ReactDOM.render(<AppContainer />, document.getElementById('app'));
