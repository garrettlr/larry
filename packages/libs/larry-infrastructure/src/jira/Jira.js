'use strict';
const _ = require('lodash');
const axios = require('axios');
class Jira {
	/**
	 * @param {object} options - Options to be passed to all requests, local overrides can be applied
	 */
	constructor(jiraBaseUrl, user, pass, options={}) {
		this._options = options;
		let basicAuth = Buffer.from(`${user}:${pass}`, 'binary').toString('base64');
		this._axiosClient = axios.create({
			baseURL: jiraBaseUrl,
			timeout: 5000,
			headers: { 'Authorization': `Basic ${basicAuth}` }
		});
	}

	createIssue(projectId,issuetypeId,summary,assigneeName,requestOpts) {
		let request = _.defaults(
			{
				fields:{
					project: {
						id: _.get(this._options,'projectId',projectId)
					},
					summary: summary,
					assignee: {
						name: assigneeName
					},
					issuetype: { 
						id: issuetypeId 
					}
				}
			},
			requestOpts
		);
		return this._axiosClient.request({
			url: '/rest/api/3/issue',
			method: 'post',
			data: request
		});
	}
	getIssue(issueIdOrKey){
		return this._axiosClient.request({
			url: `/rest/api/3/issue/${issueIdOrKey}`,
			method: 'get'
		});
	}
	deleteIssue(issueIdOrKey) {
		return this._axiosClient.request({
			url: `/rest/api/3/issue/${issueIdOrKey}`,
			method: 'delete'
		});
	}
	getAllTranisitonsForAnIssue(issueIdOrKey){
		return this._axiosClient.request({
			url: `/rest/api/3/issue/${issueIdOrKey}/transitions`,
			method: 'get'
		});
	}
	moveIssue(issueIdOrKey,statusId) {
		return this._axiosClient.request({
			url: `/rest/api/3/issue/${issueIdOrKey}/transitions`,
			method: 'post',
			data: {
				transition: {
					id: statusId
				}
			}
		});
	}
}
module.exports = Jira;