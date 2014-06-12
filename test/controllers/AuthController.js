var assert = require('assert');
var sinon = require('sinon');
var AuthController = require('../../api/controllers/AuthController');

describe('AuthController', function() {
  describe('viewing /main/signin', function() {
    it('should render the view', function() {
      var spy = sinon.spy();

      AuthController.signin({
        session: { authenticated: false }
      }, {
        view: spy
      });

      assert.ok(spy.called);
      assert.equal(false, spy.firstCall.args[0].authenticated);
    });
  });

  describe('posting to /main/do_signin', function() {
    it('should return "bad" on empty email', function() {
      var spy = sinon.spy();

      AuthController.do_signin({
        param: function(p) {
          if(p == 'password')
            return 'greenleaf';
          else
            return undefined;
        }
      }, {
        send: spy
      });

      assert.ok(spy.called);
      assert.equal('bad', spy.firstCall.args[0]);
    });

    it('should return "bad" on empty password', function() {
      var spy = sinon.spy();

      AuthController.do_signin({
        param: function(p) {
          if(p == 'email')
            return 'test@test.com';
          else
            return undefined;
        }
      }, {
        send: spy
      });

      assert.ok(spy.called);
      assert.equal('bad', spy.firstCall.args[0]);
    });
  });

  describe('viewing /main/signout', function() {
    it('should render the view and reset session vars', function() {
      var spy = sinon.spy();
      var req = { session: { authenticated: true, userinfo: true } };

      AuthController.signout(req, {
        redirect: spy
      });

      assert.ok(spy.called);
      assert.equal(false, req.session.authenticated);
      assert.equal(undefined, req.session.userinfo);
      assert.ok(spy.firstCall.calledWith('/auth/signin'));
    });
  });
});