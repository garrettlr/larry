#!/usr/bin/env node
'use strict';
const LarryBnd = require('../index');
const BnDCookbook = LarryBnd.cookbook.BnDCookbook;

const cookbook = new BnDCookbook(process.cwd());
(async function (){
    await cookbook.resetProject();
})();