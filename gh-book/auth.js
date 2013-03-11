// Generated by CoffeeScript 1.3.3
(function() {

  define(['github', 'backbone'], function(Github, Backbone) {
    var AuthModel, github, repo;
    github = null;
    repo = null;
    AuthModel = Backbone.Model.extend({
      defaults: {
        username: 'philschatz',
        password: '',
        auth: 'basic',
        repoUser: 'philschatz',
        repoName: 'github-book',
        branch: 'sample-book',
        rootPath: ''
      },
      _update: function() {
        var credentials, json,
          _this = this;
        credentials = {
          username: this.get('username'),
          password: this.get('password'),
          token: this.get('token'),
          auth: this.get('auth')
        };
        github = new Github(credentials);
        repo = null;
        json = this.toJSON();
        if (json.repoUser && json.repoName) {
          repo = github.getRepo(json.repoUser, json.repoName);
        }
        return github.onRateLimitChanged(function(remaining, limit) {
          return _this.set({
            rateRemaining: remaining,
            rateLimit: limit
          });
        });
      },
      initialize: function() {
        this._update();
        this.on('change:username', this._update);
        this.on('change:password', this._update);
        this.on('change:token', this._update);
        this.on('change:auth', this._update);
        this.on('change:repoUser', this._update);
        return this.on('change:repoName', this._update);
      },
      authenticate: function(credentials) {
        return this.set(credentials);
      },
      setRepo: function(repoUser, repoName) {
        return this.set({
          repoUser: repoUser,
          repoName: repoName
        });
      },
      getRepo: function() {
        return repo;
      },
      getUser: function() {
        return github != null ? github.getUser() : void 0;
      },
      signOut: function() {
        github = null;
        repo = null;
        return this.set({
          username: 'philschatz',
          password: ''
        });
      },
      sync: function(method, model, options) {
        this._update();
        return options != null ? typeof options.success === "function" ? options.success() : void 0 : void 0;
      }
    });
    return new AuthModel();
  });

}).call(this);
