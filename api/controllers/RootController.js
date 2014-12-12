module.exports = {
  /**
   * @via     HTTP
   * @method  GET
   */
  index: function(req, res) {
    var es = ExceptionService.require(req, res, { GET: true });

    var fromHost = req.host.toLowerCase();

    if(fromHost.indexOf('.dev') > -1) {
      fromHost = fromHost.replace('.dev', '');
    }

    if(req.session.authenticated) {

    } else {
      Company.findOne({ host: fromHost }).exec(es.wrap(function(e, company) {
        if(e || !company) {
          res.view({ htmlClass: "signin", noSkelJs: true, bodyClass: "signin", extraContainerClass: "signin failed", errorMessage: "No company exists under this domain." });
        } else {
          res.view('auth/signin', { companyInfo: company, htmlClass: "signin", noSkelJs: true, bodyClass: "signin", extraContainerClass: "signin" });
        }
      }));
    }
  }
};