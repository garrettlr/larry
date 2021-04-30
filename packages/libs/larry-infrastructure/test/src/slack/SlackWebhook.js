'use strict';
const _ = require('lodash');
const { IncomingWebhook } = require('@slack/client');

class SlackWebHook {
	/**
	 * @param {object} options - Options to be passed to all requests, local overrides can be applied
	 */
	constructor(slackWebHookUrl) {
		this._webhook = new IncomingWebhook(slackWebHookUrl);
	}
	sendMessage(text){
		return this._webhook.send(text);
	}
	sendAttachmentMessage(title,text,fieldsObj,attachmentOptions){
		let fields = [];
		for (const fieldKey in fieldsObj) {
			if (fieldsObj.hasOwnProperty(fieldKey)) {
				const fieldValue = fieldsObj[fieldKey];
				fields.push({
					'title': fieldKey,
					'value': fieldValue,
					'short': true
				});
			}
		} 
		return this._webhook.send(
			{
				'attachments': [
					{
						'fallback': _.get(attachmentOptions,'fallback',`${title} => ${text}`),
						'color': _.get(attachmentOptions,'color','#36a64f'),
						'pretext': _.get(attachmentOptions,'pretext',''),
						'author_name': _.get(attachmentOptions,'author_name',''),
						'author_link': _.get(attachmentOptions,'author_link',''),
						'author_icon': _.get(attachmentOptions,'author_icon',''),
						'title': title,
						'title_link': _.get(attachmentOptions,'title_link','https://monstermakes.tech/'),
						'text': text,
						'fields': fields,
						'image_url': _.get(attachmentOptions,'image_url',''),
						'thumb_url': _.get(attachmentOptions,'thumb_url',''),
						'footer': _.get(attachmentOptions,'footer','Larry Infrastructure'),
						'footer_icon': _.get(attachmentOptions,'footer_icon','https://monstermakes.tech/assets/larry/infrastructure/slack-message.png'),
						'ts': Date.now()/1000
					}
				]
			}
		);
	}
}
module.exports=SlackWebHook;