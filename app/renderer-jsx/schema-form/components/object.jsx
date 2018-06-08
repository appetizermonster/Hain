'use strict';

import React from 'react';

const utils = require('../utils');
const componentSelector = require('../component-selector');

class ObjectComponent extends React.Component {
  render() {
    const { schema, model, name, path, onChange, errors } = this.props;
    const properties = schema.properties;
    const childComponents = [];
    const obj = model || {};
    let title = schema.title || name;
    const description = utils.wrapDescription(schema.description);

    if (title) title = <h2 style={{ fontWeight: '400' }}>{title}</h2>;

    for (const childName in properties) {
      const property = properties[childName];
      const Component = componentSelector.select(property);
      if (Component === undefined) continue;

      const childModel = obj[childName];
      const childPath = `${path}.${childName}`;

      childComponents.push(
        <div key={childName}>
          <Component
            key={childName}
            name={childName}
            path={childPath}
            schema={property}
            model={childModel}
            onChange={onChange}
            errors={errors}
          />
          <br />
        </div>
      );
    }

    return (
      <div>
        {title}
        {description}
        {childComponents}
      </div>
    );
  }
}

module.exports = ObjectComponent;
