'use strict';

const lo_set = require('lodash.set');
const lo_trimStart = require('lodash.trimstart');

import React from 'react';
import { CardTitle, CardText } from 'material-ui';
import { Validator } from 'jsonschema';

const validator = new Validator();
const componentSelector = require('./component-selector');

componentSelector.inject((schema) => schema.enum !== undefined, require('./components/enum'));
componentSelector.inject('object', require('./components/object'));
componentSelector.inject('array', require('./components/array'));
componentSelector.inject('string', require('./components/string'));
componentSelector.inject('integer', require('./components/number'));
componentSelector.inject('number', require('./components/number'));
componentSelector.inject('boolean', require('./components/boolean'));
componentSelector.inject('password', require('./components/password'));

class SchemaForm extends React.Component {
  constructor(props) {
    super();
    this.state = this.convertToState(props);
  }

  convertToState(props) {
    return {
      title: props.title,
      schema: props.schema,
      model: props.model
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this.convertToState(nextProps));
  }

  handleChange(path, val) {
    const model = this.state.model;
    lo_set(model, lo_trimStart(path, '.'), val);
    this.setState({ model });
    this.props.onChange(model);
  }

  render() {
    const { title, schema, model } = this.state;
    const FormComponent = componentSelector.select(schema);
    const errors = validator.validate(model, schema).errors;

    let headerComponent = null;

    if (title) {
      headerComponent = (<CardTitle title={title} />);
    }

    return (
      <div>
        {headerComponent}
        <CardText>
          <FormComponent path="" title={title} schema={schema} model={model}
                        onChange={this.handleChange.bind(this)}
                        errors={errors} />
        </CardText>
      </div>
    );
  }
}

module.exports = SchemaForm;
