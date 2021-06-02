const axios = require('axios').default;

const { UV_FS_O_FILEMAP } = require('constants');
// const { setMaxListeners } = require('../app');
module.exports = class ZabbixApi {
    constructor(url,usr,pass) {
        this.url = url+'/api_jsonrpc.php';
        this.usr = usr;
        this.pass = pass;
        this.token = null;
        this.lastaccessdate = null;
        this.accesscontrolmaxage = null;
        const request = require('request');
        this.status=0;

    }
    
    hosts(params,cb){
        this.getinfo("host.get",params,cb)
    }

    problems(params,cb){
        this.getinfo("problem.get",params,cb)
    }

    getinfo(method,params,cb){
        var self=this
            axios({
                method:'post',
                url: self.url,
                headers: {"content-type": "application/json"},
                responseType: 'json',
                data: {
                    jsonrpc: "2.0",
                    method: method,
                    params: params,
                    id: 1,
                    auth: self.token
                }
            }).then(function( response){
                cb(response.data)
            })
    }   

    connect(cb) {
        var self=this
        axios({
            method:'post',
            url: self.url,
            headers: {'content-type': 'application/json'},
            responseType: 'json',
            data: {
                jsonrpc: "2.0",
                method: "user.login",
                params: {
                    "user": self.usr,
                    "password": self.pass,
                },
                id: 1,
                auth: self.token
            }
        }).then(function( response){
           self.token = response.data.result
           self.lastaccessdate=response.headers['date']
           self.accesscontrolmaxage= response.headers['access-control-max-age']
           self.status = 1
           cb(response)
        })
    }
    status(){
        return this.status
    }
    items(params,cb){
        this.getinfo("item.get",params,cb)
    }

    dump() {
        return(JSON.stringify(this))
    }
}
