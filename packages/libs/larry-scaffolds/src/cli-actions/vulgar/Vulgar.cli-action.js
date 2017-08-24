'use strict';
const CliAction = require('@monstermakes/larry-cli').CliAction;
const player = require('play-sound')({});
const glob = require('glob');
const _ = require('lodash');

const getRandomNoise = ()=>{
	let fileNames = glob.sync(`${__dirname}/mp3s/**/*`,{});
	return _.sample(fileNames);
};

class VulgarCli extends CliAction {
	constructor(vorpalInstance){
		super(vorpalInstance);
		this._init();
	}
	_init(){
		//setup midnight prompt
		this.$prompt = this._vorpalInstance.chalk.blue('8====>');

		//expose ripper
		this._vorpalInstance
			.command('pbbbt [mp3]', 'Who farted?')
			.action((args, callback) => {
				let mp3ToPlay;
				if(args.mp3){
					mp3ToPlay = args.mp3;
				}
				else{
					mp3ToPlay = getRandomNoise();
				}
				if(mp3ToPlay){
					player.play(mp3ToPlay, (err)=>{
						if (err) {
							this._vorpalInstance.log(this._vorpalInstance.chalk.red(`Failed to pbbbt... ${err}`));
						}
						callback();
					});
				}
				else{
					callback();
				}
			});
	}
}
module.exports = VulgarCli;