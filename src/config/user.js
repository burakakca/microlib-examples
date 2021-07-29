"use strict";

import { validateModel } from "../domain/mixins";
import { userFactory, userMixins } from "../domain/user";
import { uuid } from "../lib/utils";

/**
 * @type {import('../models').ModelSpecification}
 */
export const User = {
  modelName: "user",
  endpoint: "users",
  dependencies: { uuid },
  factory: userFactory,
  mixins: userMixins,
  validate: validateModel,
  relations: {
    customer: {
      foreignKey: "customerId",
      type: "oneToOne",
      modelName: "customer",
    },
  },
};
