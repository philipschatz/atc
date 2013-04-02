// Generated by CoffeeScript 1.3.3
(function() {

  define(['exports', 'jquery', 'backbone', 'bookish/media-types', 'i18n!bookish/nls/strings'], function(exports, jQuery, Backbone, MEDIA_TYPES, __) {
    var ALL_CONTENT, AllContent, BaseBook, BaseContent, CONTENT_COMPARATOR, Deferrable, DeferrableCollection;
    BaseContent = Backbone.Model.extend({
      isNew: function() {
        return !this.id || this.id.match(/^_NEW:/);
      },
      initialize: function() {
        if (!this.mediaType) {
          throw 'BUG: No mediaType set';
        }
        if (!MEDIA_TYPES.get(this.mediaType)) {
          throw 'BUG: No mediaType not registered';
        }
        if (!this.id) {
          return this.id = "_NEW:" + this.cid;
        }
      }
    });
    ALL_CONTENT = null;
    Deferrable = Backbone.Model.extend({
      loaded: function(flag) {
        var deferred,
          _this = this;
        if (flag == null) {
          flag = false;
        }
        if (flag) {
          deferred = jQuery.Deferred();
          deferred.resolve(this);
          this._promise = deferred.promise();
          this.set({
            _done: true
          });
        }
        if (!this._promise || 'rejected' === this._promise.state()) {
          this.set({
            _loading: true
          });
          this._promise = this.fetch({
            error: function(model, message, options) {
              return _this.trigger('error', model, message, options);
            }
          });
          this._promise.progress(function(progress) {
            return _this.set({
              _progress: progress
            });
          }).done(function() {
            delete _this.changed;
            return _this.set({
              _done: true
            });
          }).fail(function(error) {
            return _this.trigger('error', error);
          });
        }
        return this._promise;
      },
      toJSON: function() {
        var json;
        json = Backbone.Model.prototype.toJSON.apply(this, arguments);
        json.mediaType = this.mediaType;
        return json;
      }
    });
    DeferrableCollection = Backbone.Collection.extend({
      loaded: function(flag) {
        var deferred,
          _this = this;
        if (flag) {
          deferred = jQuery.Deferred();
          deferred.resolve(this);
          this._promise = deferred.promise();
          this._done = true;
        }
        if (!this._promise || 'rejected' === this._promise.state()) {
          this._promise = this.fetch({
            error: function(model, message, options) {
              return _this.trigger('error', model, message, options);
            }
          });
          this._promise.then(function() {
            return delete _this.changed;
          });
        }
        return this._promise;
      },
      toJSON: function() {
        var model, _i, _len, _ref, _results;
        _ref = this.models;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          model = _ref[_i];
          _results.push(model.toJSON());
        }
        return _results;
      },
      initialize: function() {
        this.on('add', function(model) {
          return ALL_CONTENT.add(model);
        });
        return this.on('reset', function(collection, options) {
          return ALL_CONTENT.add(collection.toArray());
        });
      }
    });
    AllContent = DeferrableCollection.extend({
      model: BaseContent,
      initialize: function() {
        return this.loaded(true);
      }
    });
    ALL_CONTENT = new AllContent();
    exports.FilteredCollection = Backbone.Collection.extend({
      defaults: {
        collection: null
      },
      setFilter: function(str) {
        var models,
          _this = this;
        if (this.filterStr === str) {
          return;
        }
        this.filterStr = str;
        models = this.collection.filter(function(model) {
          return _this.isMatch(model);
        });
        return this.reset(models);
      },
      isMatch: function(model) {
        var body, bodyText, found, title;
        if (!this.filterStr) {
          return true;
        }
        title = model.get('title') || '';
        found = title.toLowerCase().search(this.filterStr.toLowerCase()) >= 0;
        if (found) {
          return true;
        }
        body = model.get('body') || '';
        return bodyText = body.replace(/\<(\/?[^\\>]+)\\>/, ' ').replace(/\s+/, ' ').trim();
      },
      initialize: function(models, options) {
        var _this = this;
        this.filterStr = options.filterStr || '';
        this.collection = options.collection;
        if (!this.collection) {
          throw 'BUG: Cannot filter on a non-existent collection';
        }
        this.add(this.collection.filter(function(model) {
          return _this.isMatch(model);
        }));
        this.listenTo(this.collection, 'add', function(model) {
          if (_this.isMatch(model)) {
            return _this.add(model);
          }
        });
        this.listenTo(this.collection, 'remove', function(model) {
          return _this.remove(model);
        });
        this.listenTo(this.collection, 'reset', function(model, options) {
          _this.reset();
          return _this.add(_this.collection.filter(function(model) {
            return _this.isMatch(model);
          }));
        });
        return this.listenTo(this.collection, 'change', function(model) {
          if (_this.isMatch(model)) {
            return _this.add(model);
          } else {
            return _this.remove(model);
          }
        });
      }
    });
    BaseContent = Deferrable.extend({
      mediaType: 'application/vnd.org.cnx.module',
      defaults: {
        title: null,
        subjects: [],
        keywords: [],
        authors: [],
        copyrightHolders: [],
        language: ((typeof navigator !== "undefined" && navigator !== null ? navigator.userLanguage : void 0) || (typeof navigator !== "undefined" && navigator !== null ? navigator.language : void 0) || 'en').toLowerCase()
      }
    });
    BaseBook = Deferrable.extend({
      mediaType: 'application/vnd.org.cnx.collection',
      defaults: {
        manifest: null,
        navTreeStr: '[]'
      },
      manifestType: Backbone.Collection,
      toJSON: function() {
        var json;
        json = Deferrable.prototype.toJSON.apply(this, arguments);
        json.navTree = JSON.parse(this.get('navTreeStr'));
        return json;
      },
      parseNavTree: function(li) {
        var $a, $li, $ol, obj;
        $li = jQuery(li);
        $a = $li.children('a, span');
        $ol = $li.children('ol');
        obj = {
          id: $a.attr('href') || $a.data('id'),
          title: $a.text()
        };
        obj["class"] = $a.data('class') || $a.not('span').attr('class');
        if ($ol[0]) {
          obj.children = (function() {
            var _i, _len, _ref, _results;
            _ref = $ol.children();
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              li = _ref[_i];
              _results.push(this.parseNavTree(li));
            }
            return _results;
          }).call(this);
        }
        return obj;
      },
      initialize: function() {
        var _this = this;
        ALL_CONTENT.add(this);
        this.manifest = new this.manifestType();
        this.manifest.on('add', function(model, collection) {
          return ALL_CONTENT.add(model);
        });
        this.manifest.on('reset', function(model, collection) {
          return ALL_CONTENT.add(model);
        });
        this.manifest.on('change:id', function(model, newValue, oldValue) {
          var navTree, node, recFind;
          navTree = JSON.parse(_this.get('navTreeStr'));
          recFind = function(nodes) {
            var found, node, _i, _len;
            for (_i = 0, _len = nodes.length; _i < _len; _i++) {
              node = nodes[_i];
              if (model.id === oldValue) {
                return node;
              }
              if (node.children) {
                found = recFind(node.children);
                if (found) {
                  return found;
                }
              }
            }
          };
          node = recFind(navTree);
          if (!node) {
            return console.error('BUG: There is an entry in the tree but no corresponding model in the manifest');
          }
          node.id = newValue;
          return _this.set('navTreeStr', JSON.stringify(navTree));
        });
        this.manifest.on('change:title', function(model, newValue, oldValue) {
          var navTree, node, recFind;
          navTree = JSON.parse(_this.get('navTreeStr'));
          recFind = function(nodes) {
            var found, node, _i, _len;
            for (_i = 0, _len = nodes.length; _i < _len; _i++) {
              node = nodes[_i];
              if (model.id === node.id) {
                return node;
              }
              if (node.children) {
                found = recFind(node.children);
                if (found) {
                  return found;
                }
              }
            }
          };
          node = recFind(navTree);
          if (!node) {
            return console.error('BUG: There is an entry in the tree but no corresponding model in the manifest');
          }
          node.title = newValue;
          return _this.set('navTreeStr', JSON.stringify(navTree));
        });
        return this.on('change:navTreeStr', function(model, navTreeStr, options) {
          var recAdd;
          recAdd = function(nodes) {
            var contentModel, node, _i, _len, _results;
            _results = [];
            for (_i = 0, _len = nodes.length; _i < _len; _i++) {
              node = nodes[_i];
              if (node.id) {
                contentModel = _this.manifest.add({
                  id: node.id,
                  title: node.title,
                  mediaType: 'application/vnd.org.cnx.module'
                });
              }
              if (node.children) {
                _results.push(recAdd(node.children));
              } else {
                _results.push(void 0);
              }
            }
            return _results;
          };
          return recAdd(JSON.parse(navTreeStr));
        });
      },
      prependNewContent: function(model, mediaType) {
        var ContentType, config, navTree;
        if (model instanceof Backbone.Model) {
          this.manifest.add(model);
        } else if (mediaType) {
          config = model;
          if (!MEDIA_TYPES.get(mediaType)) {
            throw 'BUG: Media type not registered';
          }
          ContentType = MEDIA_TYPES.get(mediaType).constructor;
          model = new ContentType(config);
          model.loaded(true);
          this.manifest.add(model);
          console.warn('FIXME: Hack for new content');
        } else {
          model = new Backbone.Model(model);
        }
        navTree = JSON.parse(this.get('navTreeStr'));
        navTree.unshift({
          id: model.get('id'),
          title: model.get('title')
        });
        return this.set('navTreeStr', JSON.stringify(navTree));
      }
    });
    CONTENT_COMPARATOR = function(a, b) {
      var A, B;
      A = a.mediaType || '';
      B = b.mediaType || '';
      if (B < A) {
        return -1;
      }
      if (A < B) {
        return 1;
      }
      A = a.get('title') || a.id || '';
      B = b.get('title') || b.id || '';
      if (B < A) {
        return 1;
      }
      if (A < B) {
        return -1;
      }
      return 0;
    };
    MEDIA_TYPES.add('application/vnd.org.cnx.module', {
      constructor: BaseContent
    });
    MEDIA_TYPES.add('application/vnd.org.cnx.collection', {
      constructor: BaseBook,
      accepts: {
        'application/xhtml+xml': function(book, model) {
          return book.prependNewContent(model);
        },
        'application/vnd.org.cnx.module': function(book, model) {
          return book.prependNewContent(model);
        }
      }
    });
    exports.BaseContent = BaseContent;
    exports.BaseBook = BaseBook;
    exports.Deferrable = Deferrable;
    exports.DeferrableCollection = DeferrableCollection;
    exports.ALL_CONTENT = ALL_CONTENT;
    exports.MEDIA_TYPES = MEDIA_TYPES;
    exports.CONTENT_COMPARATOR = CONTENT_COMPARATOR;
    exports.WORKSPACE = ALL_CONTENT;
    return exports;
  });

}).call(this);
