'use strict';

const lo_get = require('lodash.get');
const lo_assign = require('lodash.assign');

const EventEmitter = require('events');

const schemaDefaults = require('../../utils/schema-defaults');
const jsonSchemaEncoder = require('../../utils/json-schema-encoder');

function makeEncryptionKey(id) {
  return `hain-pass-${id}`;
}

class PreferencesObject extends EventEmitter {
  constructor(store, id, schema) {
    super();

    this.store = store;
    this.id = id;
    this.schema = schema;

    this.model = {};
    this._isDirty = false;
    this._isValidShortcut = true;
    this.encoderOptions = {
      encryptionKey: makeEncryptionKey(id)
    };

    this.load();
  }
  get isDirty() {
    return this._isDirty;
  }
  get isValidShortcut() {
    return this._isValidShortcut;
  }
  load() {
    const defaults = schemaDefaults(this.schema);
    if (this.store) {
      const loadedData = this.store.get(this.id);
      const decodedData = jsonSchemaEncoder.decode(loadedData, this.schema, this.encoderOptions);
      this.model = lo_assign({}, defaults, decodedData);
    } else {
      this.model = lo_assign({}, defaults);
    }
  }
  get(path) {
    if (path === undefined)
      return this.model;
    return lo_get(this.model, path);
  }
  reset() {
    const defaults = schemaDefaults(this.schema);
    this.update(defaults);
    return defaults;
  }
  update(model) {
    if (!this.verify(model))
      return;
    this.model = model;
    this._isDirty = true;
  }
  verify(model) {
    this._isValidShortcut = true;
    if (model && model.customQueryShortcuts) {
      if (model.customQueryShortcuts.length > 0) {
        model.customQueryShortcuts.forEach((entry) => {
          Object.keys(entry).forEach((key) => {
            if (entry[key] === '') {
              this._isValidShortcut = false;
            }
          });
        });
      } else if (model.customQueryShortcuts.length === 0) {
        this._isValidShortcut = true;
      }
    }
    return this._isValidShortcut;
  }
  toPrefFormat() {
    return {
      id: this.id,
      schema: JSON.stringify(this.schema),
      model: this.model
    };
  }
  commit() {
    if (this._isDirty === false)
      return;
    if (this.store) {
      const encodedData = jsonSchemaEncoder.encode(this.model, this.schema, this.encoderOptions);
      this.store.set(this.id, encodedData);
    }
    const copy = lo_assign({}, this.model);
    this.emit('update', copy);
    this._isDirty = false;
  }
}

module.exports = PreferencesObject;
