#!/usr/bin/env node

const yargs = require("yargs");
const chalk = require("chalk");
const axios = require("axios");
var columnify = require('columnify')


const options = yargs
            .usage("Usage: -n <name>")
            .option("n", { alias: "name", describe: "Application name", type: "string", demandOption: true })
            .option("u", { alias: "user", describe: "User", type: "string", default: "tomcat:tomcat", demandOption: true })
            .option("p", { alias: "port", describe: "Port", type: "number", default: "45001", demandOption: true })
            .option("q", { alias: "query", describe: "Query", type: "boolean", demandOption: false })
            .option("t", { alias: "trim", describe: "Trim Appserver agents back by", demandOption: false })
            .option("h", { alias: "host", describe: "Host name where Apperver is running", type: "string", default: "localhost", demandOption: true })
            .argv;


const baseUrl = `http://${options.host}:${options.port}/oemanager/applications/${options.name}/`

if (options.query) {
    getAgents()
    .then(function(response) {
        console.log(columnify(response));
    });
}

function getAgents() {
    return axios.get(baseUrl + 'agents', { headers: { Authorization: `Basic ${getToken()}` } })
        .then(function(response) {
            return response.data.result.agents;
        })
        .catch(function(error) {
            console.log('GetAgents: Error on Authentication', error.toJSON());
        });
}

function getSessions() {
    return axios.get(baseUrl + 'sessions', { headers: { Authorization: `Basic ${getToken()}` } })
        .then(function(response) {
            console.log(response.data);
            return response.data.result.OEABLSession;
        })
        .catch(function(error) {
            console.log('GetSessions: Error on Authentication', error.toJSON());
        });
}
function getToken() {
    return Buffer.from(`${options.user}`).toString('base64');
}
