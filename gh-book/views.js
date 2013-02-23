// Generated by CoffeeScript 1.3.3
(function() {

  define(['underscore', 'backbone', 'marionette', 'atc/controller', 'atc/models', 'epub/models', 'atc/auth', 'atc/views', 'hbs!gh-book/sign-in-out', 'hbs!gh-book/fork-book-item', 'css!atc'], function(_, Backbone, Marionette, Controller, AtcModels, EpubModels, Auth, Views, SIGN_IN_OUT, FORK_BOOK_ITEM) {
    return Views.AuthView = Marionette.ItemView.extend({
      template: SIGN_IN_OUT,
      events: {
        'click #sign-in': 'signIn',
        'click #sign-out': 'signOut',
        'click #save-settings': 'saveSettings',
        'click #save-content': 'saveContent',
        'click #fork-book': 'forkBook',
        'click .other-books': 'otherBooks'
      },
      initialize: function() {
        var disableSave,
          _this = this;
        this.listenTo(AtcModels.ALL_CONTENT, 'change', function() {
          var $save;
          $save = _this.$el.find('#save-content');
          $save.removeClass('disabled');
          return $save.addClass('btn-primary');
        });
        disableSave = function() {
          var $save;
          $save = _this.$el.find('#save-content');
          $save.addClass('disabled');
          return $save.removeClass('btn-primary');
        };
        this.listenTo(AtcModels.ALL_CONTENT, 'sync', disableSave);
        return this.listenTo(AtcModels.ALL_CONTENT, 'reset', disableSave);
      },
      onRender: function() {
        var _this = this;
        this.$el.find('*[title]').tooltip();
        return this.listenTo(this.model, 'change', function() {
          return _this.render();
        });
      },
      signIn: function() {
        return this.model.set({
          username: this.$el.find('#github-username').val(),
          password: this.$el.find('#github-password').val()
        });
      },
      signOut: function() {
        return this.model.signOut();
      },
      forkBook: function() {
        var $fork, forkHandler;
        if (!this.model.get('password')) {
          return alert('Please log in to fork or just go to the github page and fork the book!');
        }
        $fork = this.$el.find('#fork-book-modal');
        forkHandler = function(org) {
          return function() {
            return Auth.getRepo().fork(function(err, resp) {
              $fork.modal('hide');
              if (err) {
                throw "Problem forking: " + err;
              }
              alert('Thanks for forking!\nThe current repo (in settings) has been updated to point to your fork. \nThe next time you click Save the changes will (hopefully) be saved to your forked book.\nIf not, refresh the page and change the Repo User in Settings.');
              return setTimeout(function() {
                return Auth.set('repoUser', org || Auth.get('username'));
              }, 30000);
            });
          };
        };
        return Auth.getUser().orgs(function(err, orgs) {
          var $item, $list;
          $list = $fork.find('.modal-body').empty();
          $item = this.$(FORK_BOOK_ITEM({
            login: Auth.get('username')
          }));
          $item.find('button').on('click', forkHandler(null));
          $list.append($item);
          _.each(orgs, function(org) {
            $item = this.$(FORK_BOOK_ITEM({
              login: "" + org.login + " (Organization)"
            }));
            $item.addClass('disabled');
            return $list.append($item);
          });
          return $fork.modal('show');
        });
      },
      otherBooks: function(evt) {
        var $config, $save, rootPath;
        $config = this.$(evt.target);
        rootPath = $config.data('rootPath');
        if (rootPath && rootPath[rootPath.length - 1] !== '/') {
          rootPath += '/';
        }
        $save = this.$el.find('#save-settings-modal');
        $save.modal('hide');
        return this.model.set({
          repoUser: $config.data('repoUser'),
          repoName: $config.data('repoName'),
          branch: $config.data('branch'),
          rootPath: rootPath
        });
      },
      saveSettings: function() {
        var rootPath;
        rootPath = this.$el.find('#github-rootPath').val();
        if (rootPath && rootPath[rootPath.length - 1] !== '/') {
          rootPath += '/';
        }
        return this.model.set({
          repoUser: this.$el.find('#github-repoUser').val(),
          repoName: this.$el.find('#github-repoName').val(),
          branch: this.$el.find('#github-branch').val(),
          rootPath: rootPath
        });
      },
      saveContent: function() {
        var $alertError, $errorBar, $label, $save, $saving, $successBar, allContent, errorCount, finished, recSave, total;
        if (!Auth.get('password')) {
          return alert('You need to sign (and probably fork this book) before you can save to github');
        }
        $save = this.$el.find('#save-progress-modal');
        $saving = $save.find('.saving');
        $alertError = $save.find('.alert-error');
        $successBar = $save.find('.progress > .bar.success');
        $errorBar = $save.find('.progress > .bar.error');
        $label = $save.find('.label');
        allContent = AtcModels.ALL_CONTENT.filter(function(model) {
          return model.hasChanged();
        });
        total = allContent.length;
        errorCount = 0;
        finished = false;
        recSave = function() {
          var model, saving;
          $successBar.width(((total - allContent.length - errorCount) * 100 / total) + '%');
          $errorBar.width((errorCount * 100 / total) + '%');
          if (allContent.length === 0) {
            if (errorCount === 0) {
              finished = true;
              AtcModels.ALL_CONTENT.trigger('sync');
              AtcModels.ALL_CONTENT.each(function(model) {
                return delete model.changed;
              });
              return $save.modal('hide');
            } else {
              return $alertError.removeClass('hide');
            }
          } else {
            model = allContent.shift();
            $label.text(model.get('title'));
            saving = model.save(null, {
              success: recSave,
              error: function() {
                return errorCount += 1;
              }
            });
            if (!saving) {
              console.log("Skipping " + model.id + " because it is not valid");
              return recSave();
            }
          }
        };
        $alertError.addClass('hide');
        $saving.removeClass('hide');
        $save.modal('show');
        recSave();
        return setTimeout(function() {
          if (total && (!finished || errorCount)) {
            $save.modal('show');
            $alertError.removeClass('hide');
            return $saving.addClass('hide');
          }
        }, 5000);
      }
    });
  });

}).call(this);
