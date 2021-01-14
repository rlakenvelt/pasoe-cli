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


const baseUrl = `http://${options.host}:${options.port}/oemanager/applications/${options.name}`

if (options.query) {
    let agents;
    let sessions;
    Promise.all([
        getAgents()
        .then(response => {
            agents = columnify(response);
        }),
        getSessions('fS2xfn5NS76QjUBnp1wC1w')
        .then(response => {
            sessions = columnify(response);
        })
    ])
    .then((values) => {
        console.log(chalk.yellow.bold('\nAGENTS\n'), agents);
        console.log(chalk.yellow('\nSESSIONS\n'), sessions);
      });
}

function getAgents() {
    return axios.get(baseUrl + '/agents', { headers: { Authorization: `Basic ${getToken()}` } })
        .then(response => {
            return response.data.result.agents;
        })
        .catch(error => {
            console.log('GetAgents: Error on Authentication');
        });
}

function getSessions(agentId) {
    const url = (agentId ? `${baseUrl}/agents/${agentId}/sessions` : `${baseUrl}/agents`);
    return axios.get(url, { headers: { Authorization: `Basic ${getToken()}` } })
        .then(function(response) {
            if (response.data.result.AgentSession) {
                return response.data.result.AgentSession;
            }
            else {
                return response.data.result.OEABLSession;
            }
        })
        .catch(function(error) {
            console.log('GetSessions: Error on Authentication');
        });
}
function getToken() {
    return Buffer.from(`${options.user}`).toString('base64');
}
