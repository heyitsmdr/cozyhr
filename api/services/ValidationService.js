function ValidationResponse() {
  this.paramList = [];
  this.errorCount = 0;
};

ValidationResponse.prototype.addParam = function(paramName, paramValue) {
  this.paramList.push({ param: paramName, value: paramValue });
};

ValidationResponse.prototype.setParamError = function(paramName, paramError) {
  this.paramList.forEach(function(p) {
    if(p.param = paramName) {
      p.error = paramError;
    }
  });
  this.errorCount++;
}

ValidationResponse.prototype.get = function(paramName) {
  var foundVal = false;
  this.paramList.forEach(function(p) {
    if(p.param == paramName) {
      foundVal = p.value;
    }
  });

  return foundVal;
};

ValidationResponse.prototype.hasErrors = function() {
  if(this.errorCount === 0) {
    return false;
  } else {
    return true;
  }
};

function ValidationObject(variable) {
  this.variable = variable;
  this.errors = [];
}

ValidationObject.prototype.notEmpty = function() {
  if(!this.variable || this.variable.length === 0) {
    this.errors.push('IS_EMPTY');
  }

  return this;
};

ValidationObject.prototype.get = function() {
  if(this.errors.length >= 1) {
    throw ExceptionService.error('Validation error.');
  } else {
    return this.variable;
  }
}

module.exports = {
  /* Checks */
  NOT_EMPTY: 'NOT_EMPTY',
  IS_EMAIL: 'IS_EMAIL',

  /* Responses */
  PARAM_NOT_PRESENT: 'PARAM_NOT_PRESENT',
  WAS_NOT_EMPTY: 'WAS_NOT_EMPTY',
  INVALID_EMAIL: 'INVALID_EMAIL',

  validateParams: function(req, paramList) {
    var validationResponse = new ValidationResponse();

    paramList.forEach(function(param) {
      var paramValue = req.param(param.param);

      validationResponse.addParam(param.param, paramValue);

      if(!paramValue) {
        validationResponse.setParamError(param.param, ValidationService.PARAM_NOT_PRESENT);
      } else {
        // NOT_EMPTY
        if(param.checks.indexOf(ValidationService.NOT_EMPTY) >= 0) {
          if(paramValue.length == 0) {
            validationResponse.setParamError(param.param, ValidationService.WAS_NOT_EMPTY);
          }
        }
        // IS_EMAIL
        if(param.checks.indexOf(ValidationService.IS_EMAIL) >= 0) {
          if(paramValue.indexOf('@') == -1 || paramValue.indexOf('.') == -1) {
            validationResponse.setParamError(param.param, ValidationService.INVALID_EMAIL);
          }
        }
      }
    });

    return validationResponse;
  },

  validate: function(validationVar) {
    return new ValidationObject(validationVar);
  }
};