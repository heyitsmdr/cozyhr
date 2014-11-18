function ValidationResponse() {
  this.paramList = [];
};

ValidationResponse.prototype.addParam = function(paramName, paramValue) {
  this.paramList.push({ param: paramName, value: paramValue });
};

ValidationResponse.prototype.setParamError = function(paramName, paramError) {
  this.paramList.forEach(function(p) {
    if(p.param = paramName) {
      p.error = paramError);
    }
  });
}

ValidationResponse.prototype.getParam = function(paramName) {
  this.paramList.forEach(function(p) {
    if(p.param = paramName) {
      if(!p.error) {
        return p.value;
      } else {
        return false;
      }
    }
  });

  return false;
};

ValidationResponse.prototype.hasErrors = function() {
  this.paramList.forEach(function(p) {
    if(p.error) {
      return true;
    }
  });

  return false;
};

module.exports = {
  /* Checks */
  NOT_EMPTY: 'NOT_EMPTY',

  /* Responses */
  PARAM_NOT_PRESENT: 'PARAM_NOT_PRESENT',
  WAS_NOT_EMPTY: 'WAS_NOT_EMPTY',

  validateParams: function(req, paramList) {
    var validationResponse = new ValidationResponse();

    paramList.forEach(function(param) {
      var paramValue = req.param(param.param);

      validationResponse.addParam(param.param, paramValue);

      if(!paramValue) {
        validationResponse.setParamError(parma.param, alidationService.PARAM_NOT_PRESENT);
      } else {
        if(param.checks.indexOf(ValidationService.NOT_EMPTY) >= 0) {
          if(paramValue.length == 0) {
            validationResponse.setParamError(parma.param, alidationService.WAS_NOT_EMPTY);
          }
        }
      }
    });

    return validationResponse;
  }
};