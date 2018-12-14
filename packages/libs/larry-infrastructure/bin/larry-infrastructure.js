#!/usr/bin/env node
'use strict';
const larryEnv = require('../index');
const LarryCli = require('@monstermakes/larry-cli').LarryCli;

let cli = new LarryCli(larryEnv.cliModules,{prompt: 'larry>'});
cli.run();