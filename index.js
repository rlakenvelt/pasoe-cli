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

if (options.trim > 0) {
    getStatus()
    .then(status => {
        deleteSessions(status.agents[0].agentId, status.sessions);
        // showStatus();
      });
} else
if (options.query) {
    showStatus();
}

function getAgents() {
    return axios.get(baseUrl + '/agents', { headers: { Authorization: `Basic ${getToken()}` } })
        .then(response => {
            return response.data.result.agents;
        })
        .catch(error => {
            console.log('GetAgents: Error');
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
            console.log('GetSessions: Error');
        });
}
function deleteSessions(agent, sessions) {
    console.log(sessions);
    const promises = [];
    sessions.forEach(session=> {
        promises.push(deleteSession(agent, session.SessionId));
    })
    Promise.all(promises).then(res => console.log(res));
}
function deleteSession(agentId, sessionId) {
    const url = `${baseUrl}/agents/${agentId}/sessions/${sessionId}`;
    console.log(url);
    return axios.delete(url, { headers: { Authorization: `Basic ${getToken()}` } })
        .then(function(response) {
            console.log(`SESSION ${sessionId} DELETED`);
        })
        .catch(function(error) {
            console.log('Delete Session: Error');
        });
}
async function getStatus() {
    let agents = await getAgents().then(response => {return response});
    let sessions = await getSessions(agents[0].agentId).then(response => {return response});
    return {agents: agents, sessions: sessions};
}
function showStatus() {
    getStatus()
    .then(status => {
        console.log(chalk.yellow.bold('\nAGENTS\n'), columnify(status.agents));
        console.log(chalk.yellow('\nSESSIONS\n'), columnify(status.sessions));
      });
}

function getToken() {
    return Buffer.from(`${options.user}`).toString('base64');
}