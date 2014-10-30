/**
 * @jsx React.DOM
 */

var React = require('react');
var dwc = require('./lib/dwc_fields');
var _ = require('lodash');

var Media = React.createClass({
    error: function(event){
        $(event.currentTarget).attr('src','/portal/img/missing.svg');
    },
    render: function(){
        var link='';
        if(_.has(this.props.data,'ac:accessURI')){
            link = this.props.data['ac:accessURI'];
        }else if(_.has(this.props.data,'ac:bestQualityAccessURI')){
            link = this.props.data['ac:bestQualityAccessURI'];
        }

        return (
            <div key={this.props.key} id="media-wrapper" className="clearfix">
                <a className="clearfix" target={'_'+this.props.key} href={link} title="click to open original media file">
                    <img className="media" src={'//api.idigbio.org/v1/mediarecords/'+this.props.key+'/media?quality=webview'} onError={this.error}/>
                </a>
                <a href={link} download={this.props.key} target={'_'+this.props.key}>
                    Download Media File
                </a>
            </div>
        );
    }
});

var Buttons = React.createClass({
    render: function(){
        var el=[];
        if(_.has(this.props.links,'record')){
            var rid = this.props.links.record[0].split('/');
            var link = '/portal/records/'+rid[rid.length-1];
            el.push(
                <a className="btn button" href={link} key={link}>
                    Go To Specimen Record
                </a>
            )
        }else{
            el.push(
                <span className="no-assoc">Media is not associated with any record</span>
            )
        }

        var rsid = this.props.links.recordset[0].split('/');
        var rlink = '/portal/recordsets/'+rsid[rsid.length-1];

        el.push(
            <a className="btn button" href={rlink} key={rlink}>
                Go To Recordset
            </a>
        );

        el.push(
            <a href="#raw" data-toggle="modal" className="btn button" key={'raw-data'}>
                View Raw Data
            </a>            
        );
        
        return (
            <div id="action-buttons" key={'buttons'}>
                {el}
            </div>
        );
    }
});

var Table = React.createClass({
    render: function(){
        var order=[],rows=[],self=this;

        //make ordered name keys
        _.each(dwc.order.media,function(val){
            if(_.has(self.props.record, val)){
                order.push(val);
            }
        });
        //add unknown keys to end of list
        var dif = _.difference(Object.keys(this.props.record),order);
        var merged = order.concat(dif);
        var regex = /(\bhttps?:\/\/(\S|\w)+)/;
        _.each(order,function(key){
            var name = _.isUndefined(dwc.names[key]) ? key: dwc.names[key];
            var val = self.props.record[key];
            if(_.isString(val)){
                var str;
                if(val.indexOf('<a')===0){
                    str = val;
                }else{
                    str = val.replace(regex, "<a href=\"$1\">$1</a>");
                }
                rows.push(
                    <tr key={key}>
                        <td className="name">{name}</td>
                        <td className="value" dangerouslySetInnerHTML={{__html: str}}></td>
                    </tr>
                );                
            }else if(_.isArray(val)){
                rows.push(
                    <tr key={key}>
                        <td className="name">{name}</td>
                        <td className="value">{val.join(', ')}</td>
                    </tr>
                );                 
            }else{
                rows.push(
                    <tr key={key}>
                        <td className="name">{name}</td>
                        <td className="value">{val}</td>
                    </tr>
                );                 
            }
        });

        return (
            <table>
                {rows}
            </table>
        );
    }
});

var Group = React.createClass({
    error: function(event){
        $(event.currentTarget).attr('src','/portal/img/missing.svg');
    },
    render: function(){
        if(_.has(this.props.record, '_source') && this.props.record._source.mediarecords.length > 1){
            var imgs = [];
            var media = this.props.record._source.mediarecords;
            for(id in media){
                if(media[id] != this.props.key){
                    imgs.push(
                        <a href={'/portal/mediarecords/'+media[id]} title="click to open media record" key={media[id]}  >
                            <img className="gallery-image" src={'//api.idigbio.org/v1/mediarecords/'+media[id]+'/media?quality=webview'} onError={this.error} /> 
                        </a>
                    )                    
                }
            }
            return (
                <div id="other-images" className="clearfix">
                    <h4 className="title">Other Media</h4>
                    {imgs}
                </div>
            )
        }else{
            return <span/>
        }
    }
});

var Provider = require('./shared/provider');
var Raw = require('./shared/raw');

module.exports = React.createClass({
    render: function(){
        var source = this.props.mediarecord._source;
        var name ='';
        if(_.has(this.props.record, '_source')){
            var data = this.props.record._source['data']['idigbio:data'];
            var title = '';
            //build title
            if(_.has(data,'dwc:scientificName')) { 
                title = data['dwc:scientificName'] ;
            }else if(_.has(data, 'dwc:genus')){
                title = data['dwc:genus'];
                if(_.has(data, 'dwc:specificEpithet')){
                    title += data['dwc:specificEpithet'];
                }
            }
            if(_.isEmpty(title)){
                title = 'No Name';
            } 
            var author = '';
            if(_.has(data,'dwc:scientificNameAuthorship')){
                author = ', '+data['dwc:scientificNameAuthorship'];
            }
            name = '<em>'+title+'</em>'+author;             
        }

        return (
            <div className="container-fluid">
                <div className="row-fluid">
                    <div className="span12" id="container">   
                        <div id="title" className="clearfix">
                            <h1 className="title">Media Record:&nbsp; 
                                <span dangerouslySetInnerHTML={{__html: name}}></span>
                            </h1>
                        </div>
                        <div id="data-container" className="clearfix">
                            <div id="data-content">
                                <Media key={source.uuid} data={source.data['idigbio:data']} />

                            </div>
                            
                            <div id="data-meta" className="clearfix">
                                <div id="actions">
                                    <Buttons links={source.data['idigbio:links']} />
                                </div>
                                <div id="data-table" className="clearfix">
                                    <h4 className="title">Media Metadata</h4>
                                    <Table record={source.data['idigbio:data']} />
                                </div>
                                
                            </div>
                            <Group record={this.props.record} key={source.uuid}/>
                            <div id="collection" className="clearfix">
                                <Provider data={this.props.provider} />
                            </div>
                        </div>
                    </div>
                </div>
                <Raw data={source.data['idigbio:data']} />
            </div>
        )
    }
})
