# App use expose zabbix data to prometheus 

## How it work

[ZBX SRV] <--Rest api-- [zbxPromExporter] <--Prom target-- [PROMETHEUS]

## API 

/api/status : get status of zbxPromExporter 

if ok result is:

    {"status":1,"zbxcon":1} : if zbxcon:0 you should verify you zabbix configuration

/api/metrics/prometheus: Prometheus formated zabbix items and problems

# Installation
## Get the branch 

     git checkout main 

### Build Docker image 

If necessary change docker listen port 

Edit Dockerfile

    ENV PORT=3000  <- zbxpromexporter Listen Port

Then build image

    docker build -t zensix/zbxpromexporter .

## Docker compose

Edit docker-compose.yml file and change port and networks

    version: "3"
    services:
        zbx_exporter:
            container_name: zbxpromexporter  
            build: . 
            image:  zensix/zbxpromexporter 
            volumes:
            - ${PWD}/config.json:/usr/src/app/config.json

            ports:
                - "3001:3000"  <-- adapt port to you configuration
    networks:
        default:
            external:
                name: traefik_default   <-- change with you docker networks
### Setup 

Create configuration file based on config.json.model

    cp config.json.model config.json

Set zbx values

    cat config.json
    {
        "version": "0.1",
        "zbx":{
            "url": "http://zabbix.domain.org",
            "user": "zabxapi",
            "password": "zabxapi"
        },
        "exporter":{
            "hostlist": []
        }
    }

Note: You can change configuration in application but you must restart the container if you change zabbix configuration 
(The connection is for the moment made at the initiation )

### Run container 
    for example :
    docker run -d -p 3001:3000 -v /path/config.json:/usr/src/app/config.json --name zbxpromexporter zensix/zbxpromexporter

    or run docker-compose
    docker-compose build
    docker-compose start -d

### In zbxPromExporter 
 - Go to the configuration page
 - In Exported hosts you should view list of zabbix hosts, Select the ones you want to export
 - Go to the Prometheus Exporter page (url:/api/metrics/prometheus)
 - if ok should view zabbix data has prometheus format
  
### Add zbxPromExporter to prometheus configuration

Add target in your prometheus.yml like this

    ...
    scrape_configs:
    # The job name is added as a label `job=<job_name>` to any timeseries scraped from this config.
    - job_name: 'prometheus'
    ...
    ...

    - job_name: zabbix_exporter
        scrape_interval: 30s
        scrape_timeout:  20s
        metrics_path: "/api/metrics/prometheus"

        static_configs:
        - targets: ['<ip zbxpromexporter>:<port-zbxpromexporter>']

Two metrics are exported:
- zabbix_problem: value is problem severity
- zabbix_items: value is item lastvalue

Sample export

        # HELP zabbix_problem problem zabbix
        # TYPE zabbix_problem gauge
        zabbix_problem{name="/: Disk space is low (used > 80%)",objectid="18424"} 2
        zabbix_problem{name="High swap space usage (less than 50% free)",objectid="18302"} 2
        # HELP zabbix_item item zabbix
        # TYPE zabbix_item gauge
        zabbix_item{name="Zabbix agent ping",host="devserver.stef.local",value_type="3"} 1
        zabbix_item{name="Maximum number of open file descriptors",host="devserver.stef.local",value_type="3"} 174214
        zabbix_item{name="Maximum number of processes",host="devserver.stef.local",value_type="3"} 131072
        zabbix_item{name="Interface ens34: Inbound packets discarded",host="devserver.stef.local",value_type="3"} 0
        zabbix_item{name="Interface ens34: Inbound packets with errors",host="devserver.stef.local",value_type="3"} 0
        zabbix_item{name="Interface ens34: Bits received",host="devserver.stef.local",value_type="3"} 17672
        zabbix_item{name="Interface ens34: Outbound packets discarded",host="devserver.stef.local",value_type="3"} 0
        zabbix_item{name="Interface ens34: Outbound packets with errors",host="devserver.stef.local",value_type="3"} 0
        zabbix_item{name="Interface ens34: Bits sent",host="devserver.stef.local",value_type="3"} 29392
        zabbix_item{name="Number of processes",host="devserver.stef.local",value_type="3"} 296
        ...
        