//required Global libs bundle
window.$ = jQuery = require('jquery');
require('jquery-ui-browserify');
window.url = require('./js/lib/url');
window._ = require('lodash');
window.helpers = require('./js/lib/helpers');
window.fields = require('./js/lib/fields');
window.dwc = require('./js/lib/dwc_fields');
window.queryBuilder = require('./js/lib/querybuilder');
window.async = require('async');
var SearchHistory = require('./js/lib/history');
window.searchHistory = new SearchHistory;
require('bootstrap');
require('tablesorter');
require('materialize-css');
require('es5-shim');
require('cs3');
