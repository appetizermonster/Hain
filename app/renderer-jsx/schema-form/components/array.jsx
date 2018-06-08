'use strict';

import React from 'react';
import {
  Card,
  CardText,
  RaisedButton,
  IconButton,
  FontIcon
} from 'material-ui';

const schemaDefaults = require('../../../utils/schema-defaults');
const utils = require('../utils');
const componentSelector = require('../component-selector');

class ArrayComponent extends React.Component {
  handleRemove(index) {
    const { path, model, onChange } = this.props;
    const arr = model || [];
    if (arr.length <= 0) return;
    arr.splice(index, 1);
    onChange(path, arr);
  }

  handleAdd() {
    const { schema, path, model, onChange } = this.props;
    const childSchema = schema.items;
    const childDefaultValue = schemaDefaults(childSchema);
    const arr = model || [];

    arr.push(childDefaultValue);
    onChange(path, arr);
  }

  render() {
    const { schema, model, name, path, onChange, errors } = this.props;
    const arr = model || [];

    let title = schema.title || name;
    if (title) {
      title = <h2 style={{ fontWeight: '400' }}>{title}</h2>;
    }

    const description = utils.wrapDescription(schema.description);
    const help = schema.help && utils.wrapHelp(schema.help);

    const childSchema = schema.items;
    const ChildComponent = componentSelector.select(childSchema);
    if (ChildComponent === undefined) return <div>Error</div>;

    const childComponents = [];
    for (let i = 0; i < arr.length; ++i) {
      const childValue = arr[i];
      const childPath = `${path}[${i}]`;
      const childComponent = (
        <ChildComponent
          path={childPath}
          model={childValue}
          schema={childSchema}
          onChange={onChange}
          errors={errors}
        />
      );
      let wrappedComponent = null;
      if (childSchema.type === 'object') {
        wrappedComponent = (
          <div key={i}>
            <Card>
              <CardText>
                {childComponent}
                <IconButton
                  iconClassName="fa fa-remove"
                  iconStyle={{ fontSize: '12px' }}
                  style={{ width: '38px', height: '38px' }}
                  onTouchTap={this.handleRemove.bind(this, i)}
                />
              </CardText>
            </Card>
            <br />
          </div>
        );
      } else {
        wrappedComponent = (
          <div key={i}>
            <table width="100%">
              <tbody>
                <tr>
                  <td>{childComponent}</td>
                  <td width="48px">
                    <IconButton
                      iconClassName="fa fa-remove"
                      iconStyle={{ fontSize: '15px' }}
                      onTouchTap={this.handleRemove.bind(this, i)}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      }
      childComponents.push(wrappedComponent);
    }

    return (
      <div>
        {title}
        {description}
        <div key="childComponents">{childComponents}</div>
        {help}
        &nbsp;
        <div style={{ textAlign: 'left' }}>
          <RaisedButton
            primary={true}
            onTouchTap={this.handleAdd.bind(this)}
            style={{ minWidth: 50 }}
          >
            <FontIcon
              className="fa fa-plus"
              style={{ fontSize: '15px', color: 'white' }}
            />
          </RaisedButton>
        </div>
      </div>
    );
  }
}

module.exports = ArrayComponent;
