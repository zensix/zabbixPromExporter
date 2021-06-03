const { profileEnd } = require('console');
var express = require('express');
var router = express.Router();
const fs = require('fs');


const gethosts = (zbxcli,param) => { 
    return new Promise((resolve, reject) => {
      zbxcli.hosts(param,(data) => {
          resolve(data.result)
        })
    })
  }

const getproblems = (zbxcli,param) => { 
    return new Promise((resolve, reject) => {
      zbxcli.problems(param,(data) => {
          resolve(data.result)
        })
     })
  }

function zbx_pb_to_prometheus(zbxcli,params) {
  return new Promise((resolve, reject) => {
    meta_name="zabbix_problem"
    lines="# HELP "+meta_name+' problem zabbix\n# TYPE '+meta_name+' gauge'+'\n'
    output=lines
    
    getproblems(zbxcli,params,{"output":"extend"})
    .then(function(problems)  {
        let i=0
        if(problems){
          for(i=0 ;i < problems.length;i++){
            output+=meta_name+'{name="'+problems[i].name+'",objectid="'+problems[i].objectid+'"} '+problems[i].severity+'\n'
          }   
        }
        resolve(output)
      });
        
    })
  }

  function zbx_items_to_prometheus(zbxcli,params) {
    return new Promise((resolve, reject) => {
      meta_name1="zabbix_item"
      lines1="# HELP "+meta_name1+' item zabbix\n# TYPE '+meta_name1+' gauge'+'\n'
      output1=lines1
      gethosts(zbxcli,params)
      .then((hosts) => {
        (async function loop() {
          console.log(hosts)
          if(hosts){
            for( let i=0 ;i < hosts.length;i++){
              await getitems(zbxcli,{hostids: hosts[i].hostid}).then(items => {
                items.forEach(function(item){ 
                  if( item.value_type == 0 || item.value_type==3){             
                    output1+=(meta_name1+'{name="'+item.name+'",host="'+hosts[i].name+'",value_type="'+item.value_type+'"} '+item.lastvalue+'\n')
                  }
                })
              })
              if(i=== hosts.length-1 ){
                resolve(output1)
              }
            }
          } else {
            resolve(output1)
          }
        })();
    })
  })
}
  
const getitems = (zbxcli,param) => { 
  return new Promise((resolve, reject) => {
    zbxcli.items(param,(data) => {
        resolve(data.result) 
      })
  })
}


/* GET home page. */
router.get('/zbx/hosts', function(req, res, next) {
  res.locals.zbxcon.hosts({"output":["name","hostid"]}, function(data){
    res.json(data)
  })
})

router.get('/zbx/problems', function(req, res, next) {
  res.locals.zbxcon.problems({"output":"extend"}, function(data){
    res.json(data)
  })
})

router.get('/status', function(req, res, next) {
    res.json({status:res.locals.applis.status ,zbxcon:res.locals.zbxcon.status })
  });

router.get('/config', function(req, res, next) {
    res.json(res.locals.config)
})
router.get('/setting', function(req, res, next) {
    res.json(res.locals.applis)
})
router.post('/config', function(req, res, next) {
    exporter=res.locals.config.exporter
    res.locals.config.zbx=req.body
    res.locals.config.exporter= exporter
    let data = JSON.stringify(res.locals.config,null,2);
    fs.writeFileSync(res.locals.applis.RootPath+'/config.json', data);
    res.json({"status":"ok","message":"Config updated"})
})


router.post('/config/host/add', function(req, res, next) {
  console.log(req.body.hostname)
  if(res.locals.config.exporter.hostlist.includes(req.body.hostname)){
    message=req.body.hostname+" is already exported"
    res.json({"status":"ok","message":message})
  } else {
    console.log(res.locals.config.exporter.hostlist)
    res.locals.config.exporter.hostlist.push(req.body.hostname)
    let data = JSON.stringify(res.locals.config,null,2);
    fs.writeFileSync(res.locals.applis.RootPath+'/config.json', data);
    res.json({"status":"ok","message":"Config updated"})

  }
})

router.post('/config/host/remove', function(req, res, next) {
  console.log(req.body.hostname)
  if(res.locals.config.exporter.hostlist.includes(req.body.hostname)){
    console.log(res.locals.config.exporter.hostlist)
    const result = res.locals.config.exporter.hostlist.filter(p => p!=req.body.hostname);

    res.locals.config.exporter.hostlist=result
    let data = JSON.stringify(res.locals.config,null,2);
    fs.writeFileSync(res.locals.applis.RootPath+'/config.json', data);
    res.json({"status":"ok","message":"Config updated"})
  } else {
    message=req.body.hostname+" is already not exported"
    res.json({"status":"ok","message":message})
  }
})


router.post('/config/hosts', function(req, res, next) {
    res.locals.config.exporter.hostlist=req.body
    let data = JSON.stringify(res.locals.config,null,2);
    fs.writeFileSync(res.locals.applis.RootPath+'/config.json', data);
    res.json({"status":"ok","message":"Config updated"})
})
  



router.get('/metrics/prometheus', function(req, res, next) {
    if(res.locals.config.exporter.hostlist.length>0){
      funcs=[zbx_pb_to_prometheus(res.locals.zbxcon,{}), zbx_items_to_prometheus(res.locals.zbxcon,{"filter": {"name": res.locals.config.exporter.hostlist},"output":["name","hostid"]})]
    }else{
      funcs=[zbx_pb_to_prometheus(res.locals.zbxcon,{})]
    }
    const result =  Promise.all(funcs).then(values => {
      res.set('Content-Type', 'text/plain');
      for(i=0 ;i < values.length;i++){
        res.write(values[i])
      }
      res.end()
    });
})

module.exports = router;
