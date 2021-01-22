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
            .option("t", { alias: "trim", describe: "Trim Appserver agents", type: "boolean", demandOption: false })
            .option("h", { alias: "host", describe: "Host name where Apperver is running", type: "string", default: "localhost", demandOption: true })
            .argv;


const baseUrl = `http://${options.host}:${options.port}/oemanager/applications/${options.name}`

if (options.trim) {
    deleteAgents();
} else
if (options.query) {
    showStatus();
}

function getAgents() {
    return axios.get(baseUrl + '/agents', getHttpOptions())
        .then(response => {
            return response.data.result.agents;
        })
        .catch(error => {
            // console.log(chalk.red('GetAgents: Error'));
        });
}

function getSessions(agentId) {
    const url = (agentId ? `${baseUrl}/agents/${agentId}/sessions` : `${baseUrl}/agents`);
    return axios.get(url, getHttpOptions())
        .then(function(response) {
            if (response.data.result.AgentSession) {
                return response.data.result.AgentSession;
            }
            else {
                return response.data.result.OEABLSession;
            }
        })
        .catch(function(error) {
            // console.log(chalk.red('GetSessions: Error'));
        });
}

async function deleteAgents() {
    let agents = await getAgents().then(response => {return response});
    if (!agents || agents.length === 0) return [];
    const promises = [];
    
    agents.forEach(agent=> {
        promises.push(deleteAgent(agent.agentId)
            .then(response => {return agent.agentId}));
    })
    Promise.all(promises)
        .then(res => {
            if (res.length === 0) {
                console.log(' No agents trimmed');
            }
            else {
                console.log(`${res.length} agent(s) trimmed`);
                showStatus();
            }
        });       
}
function deleteAgent(agentId) {
    const url = `${baseUrl}/agents/${agentId}?waitToFinish=120000`;
    return axios.delete(url, getHttpOptions());
}

async function getStatus() {
    let agents = await getAgents().then(response => {return response});
    if (!agents || agents.length === 0) return [];
    const promises = [];
    agents.forEach(agent=> {
        promises.push(getSessions(agent.agentId)
            .then(response => {return {agent, sessions: response}}));
    })
    return Promise.all(promises);     
}
function showStatus() {
    getStatus()
    .then(status => {
        status.forEach(agent => {
            console.log(chalk.yellow('\nAGENT'));            
            console.log(columnify(agent.agent, {
                showHeaders: false
              }));
            console.log('');  
            console.log(columnify(agent.sessions));
        });
      });
}

function getHttpOptions() {
    return { headers: { Authorization: `Basic ${Buffer.from(`${options.user}`).toString('base64')}`, 'Content-Type': 'application/vnd.progress+json' } }
}