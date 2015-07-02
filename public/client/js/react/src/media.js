
var React = require('react');
var dwc = require('../../lib/dwc_fields');
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
        }else if(_.has(this.props.data, 'dcterms:identifier')){
            link = this.props.data['dcterms:identifier'];
        }

        return (
            <div key={this.props.keyid} id="media-wrapper" className="clearfix">
                <a className="clearfix" target={'_'+this.props.keyid} href={link} title="click to open original media file">
                    <img className="media" src={'https://media.idigbio.org/mrlookup/'+this.props.keyid+'?size=webview'} onError={this.error}/>
                </a>
                <a href={link} download={this.props.keyid} target={'_'+this.props.keyid} className="hidden-print">
                    Download Media File
                </a>
            </div>
        );
    }
});

var Buttons = React.createClass({
    print: function(e){
        e.preventDefault();
        window.print();
    },
    render: function(){
        var el=[];
        if(_.has(this.props.data,'records')){
            var link = '/portal/records/'+this.props.data.records[0];
            el.push(
                <a className="btn button" href={link} key={link} keyid={link}>
                    Go To Record
                </a>
            )
        }else{
            el.push(
                <span className="no-assoc">Media is not associated with any record</span>
            )
        }
        var rlink = '/portal/recordsets/'+this.props.data.recordset;

        el.push(
            <a className="btn button" href={rlink} key={rlink} keyid={rlink}>
                Go To Recordset
            </a>
        );

        el.push(
            <a href="#raw" data-toggle="modal" data-target="#raw" className="btn button" key={'raw-data'}>
                View Raw Data
            </a>            
        );
        
        return (
            <div id="action-buttons" key={'buttons'}>
                {el}
                <button className="btn button" title="print this page" onClick={this.print}>
                    Print
                </button>
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
        var merged = order.concat(dif), count=0;
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
                    <tr key={count}>
                        <td className="name">{name}</td>
                        <td className="value" dangerouslySetInnerHTML={{__html: str}}></td>
                    </tr>
                );                
            }else if(_.isArray(val)){
                rows.push(
                    <tr key={count}>
                        <td className="name">{name}</td>
                        <td className="value">{val.join(', ')}</td>
                    </tr>
                );                 
            }else{
                rows.push(
                    <tr key={count}>
                        <td className="name">{name}</td>
                        <td className="value">{val}</td>
                    </tr>
                );                 
            }
            count++
        });

        return (
            <div id="meta-table">
                <table>
                    {rows}
                </table>
            </div>
        );
    }
});

var Group = React.createClass({
    error: function(event){
        $(event.currentTarget).attr('src','/portal/img/missing.svg');
    },
    render: function(){
        if(_.has(this.props.record, 'indexTerms') && this.props.record.indexTerms.mediarecords.length > 1){
            var imgs = [];
            var media = this.props.record.indexTerms.mediarecords;
            for(id in media){
                if(media[id] != this.props.keyid){
                    imgs.push(
                        <a href={'/portal/mediarecords/'+media[id]} title="click to open media record" key={media[id]} >
                            <img className="gallery-image" src={'https://media.idigbio.org/mrlookup/'+media[id]+'?size=webview'} onError={this.error} /> 
                        </a>
                    )                    
                }
            }
            return (
                <div id="other-images" className="clearfix">
                    <h4 className="title">Other Media</h4>
                    <div id="images-wrapper">
                        {imgs}
                    </div>
                </div>
            )
        }else{
            return <span/>
        }
    }
});

var Provider = require('./shared/provider');
var Raw = require('./shared/raw');
var Title = require('./shared/title');

module.exports = React.createClass({
    render: function(){
        var source = this.props.mediarecord;
        var info=[];
        
        return (
            <div className="container-fluid">
                <div className="row">
                    <div className="col-lg-12" id="container">   
                        <div id="data-container" className="clearfix">
                            <Title data={this.props.record}/>
                            <div id="data-content">
                                <Media key={source.uuid+'_media'} keyid={source.uuid} data={source.data} />
                            </div>
                            <div id="data-meta" className="clearfix">
                                <div id="actions" className="hidden-print"> 
                                    <Buttons data={source.indexTerms} />
                                </div>
                                <div id="data-table" className="clearfix">
                                    <h4 className="title">Media Metadata</h4>
                                    <Table record={source.data} />
                                </div>
                            </div>
                            <Group record={this.props.record} keyid={source.uuid}/>
                            <Provider data={this.props.mediarecord.attribution} />
                        </div>
                    </div>
                </div>
                <Raw data={source} />
            </div>
        )
    }
})
