/**
 * @jsx React.DOM
 */

var React = require('react')
var dwc = require('./lib/dwc_fields');
var _ = require('lodash');
var fields = require('../../lib/fields');
var Filters = require('./search/filters');
var Results = require('./search/results');

module.exports = React.createClass({
    showPanel: function(event){
        $('#options-menu .active').removeClass('active');
        var panel = $(event.target).addClass('active').attr('data-panel');
        $('#options .section').hide();
        $('#options #'+panel).show();
    },
    getInitialState: function(){
        return {search:{filters:[],fulltext:'',image:false,geopoint:false}};
    },
    searchChange: function(key,val){
        var search = _.cloneDeep(this.state.search);
        search[key]=val;
        this.setState({search: search});
    },
    checkClick: function(event){
        this.searchChange(event.currentTarget.name, event.currentTarget.checked);
        return true;
    },
    textType: function(event){
        this.searchChange('fulltext',event.currentTarget.value);
    },
    render: function(){

        return(
            <div id='react-wrapper'>
                <div id="top" className="clearfix">
                    <div key='fulltext' id="search" className="clearfix">
                        <div id="search-any" className="clearfix">
                            <h3><img id="search-arrow-img" src="/portal/img/arrow-green.png"/> Start Searching</h3>
                            <div className="input-group">
                                <input type="text" className="form-control" placeholder="search any field" onChange={this.textType} />
                                <a className="btn input-group-addon">Go</a>
                            </div>
                            <div className="checkbox">
                                <label>
                                    <input type="checkbox" name="image" onChange={this.checkClick} checked={this.state.search.image ? 'checked':''}/>
                                    Must have image
                                </label>
                            </div>
                            <div className="checkbox">
                                <label>
                                    <input type="checkbox" name="geopoint" onChange={this.checkClick} checked={this.state.search.geopoint ? 'checked':''}/>
                                    Must have map point
                                </label>
                            </div>
                        </div>
                        <div key='filters' id="options" className="clearfix">
                            <ul id="options-menu" onClick={this.showPanel}>
                                <li className="active" data-panel="filters">Advanced Filters</li>
                                <li data-panel="sorting">Sorting</li>
                                <li data-panel="download">Download &amp; History</li>
                            </ul>
                            <div className="section active" id="filters">
                                <Filters searchChange={this.searchChange}/>
                            </div>
                            <div className="clearfix section" id="sorting">
                                <div className="option-group">
                                    <label>Sort by</label>
                                    <select className="direction form-control">
                                        <option>Ascending</option>
                                        <option>Descending</option>
                                    </select>
                                    <select className="name form-control">
                                        <option>Scientific Name</option>
                                    </select>

                                </div>
                                <div className="option-group-add">
                                     Add another sort &nbsp;<span className="glyphicon glyphicon-plus"></span> 
                                </div>
                            </div>

                            <div className="clearfix section" id="download">
                                <label>Download Current Result Set</label>
                            </div>
                        </div>
                    </div>
                    <div id="map"></div>
                </div>
                <Results search={this.state.search} />
            </div>
        )
    }
})