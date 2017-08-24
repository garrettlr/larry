'use strict';
const _ = require('lodash');

const mainSectionElem = document.querySelector('.main-section');
mainSectionElem.innerHTML = `
	<p>The current time is <span class="current-time"></span></p>
`;
const currentTimeElem = mainSectionElem.querySelector('.current-time');
setInterval(()=>{
	currentTimeElem.innerText = (new Date(_.now())).toString();
},1000);

document.querySelector('.current-year').innerText = (new Date(_.now())).getFullYear();