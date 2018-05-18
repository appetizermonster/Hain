'use strict';

import React from 'react';
import { SelectField, MenuItem } from 'material-ui';

const utils = require('../utils');

class EnumComponent extends React.Component {
  handleChange(evt, idx, val) {
    const { onChange, path } = this.props;
    onChange(path, val);
  }

  render() {
    const { schema, model, name } = this.props;
    const items = [];

    let title = schema.title || name;
    if (title !== undefined) {
      title = <h5 style={{ marginBottom: '2px' }}>{title}</h5>;
    }

    const description = utils.wrapDescription(schema.description);

    let help;
    if (schema.help) {
      help = utils.wrapHelp(schema.help);
    }

    for (const itemData of schema.enum) {
      const item = <MenuItem primaryText={itemData} value={itemData} />;
      items.push(item);
    }

    return (
      <div>
        {title}
        {description}
        <SelectField
          name="text"
          value={model}
          fullWidth={true}
          style={{ marginTop: '-2px' }}
          onChange={this.handleChange.bind(this)}
        >
          {items}
        </SelectField>
        {help}
      </div>
    );
  }
}

module.exports = EnumComponent;
