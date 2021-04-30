module.exports = {
	type:'String',
	name:'environmentName',
	message:'Provide the name of the environment => ',
	description:'The name of the environment.',
	validate: (input)=>{
		const allowedPattern = /^[0-9a-z-]*$/;
		let result = true;
		if(input){
			if(!input.match(allowedPattern)){
				result = `Invalid format, must be kebab-case with lower case letters and numbers (${allowedPattern}).`;
			}
		}
		else{
			result = 'Invalid format, a value must be supplied.';
		}
		return result;
	}
};