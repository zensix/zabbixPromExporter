module.exports = class zbxPromExport {
    constructor(meta_name,help,type) {
        this.meta_name = meta_name;
        this.help = help;
        this.type = type;
        this.accumulator="# HELP "+meta_name+' '+help+'\n# TYPE '+meta_name+' '+type+'\n'
    }
    addmetric(host,item){ 
        var self=this
        return new Promise((resolve, reject) => {
            var meta_name=this.meta_name
            if( item.value_type == 0 || item.value_type==3){
                self.accumulator+=(meta_name+'{name="'+item.name+'",host="'+host.name+'",value_type="'+item.value_type+'"} '+item.lastvalue+' '+item.lastclock+'\n')
                resolve("add")
            } 
        })
    }
    generatemetric(host,item){
        var self=this
        var meta_name=this.meta_name
        return new Promise((resolve, reject) =>{
         if( item.value_type == 0 || item.value_type==3){
            resolve(meta_name+'{name="'+item.name+'",host="'+host.name+'",value_type="'+item.value_type+'"} '+item.lastvalue+' '+item.lastclock+'\n')
         } else {
            reject(meta_name+'{name="'+item.name+'",host="'+host.name+'",value_type="'+item.value_type+'"} '+item.lastvalue+' '+item.lastclock+'\n')
         }
        })
    }

    promline(){
        var self=this
        return new Promise((resolve, reject) => { 
            resolve(self.accumulator)
        })
    }

}