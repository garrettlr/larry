'use strict';
const chai = require('chai');
const should = chai.should(); // eslint-disable-line 
const expect = chai.expect; // eslint-disable-line 

const TEST_NAME = 'Environment spec';
const CLOUD_FORMATION_DIR = __dirname + '/mocks';

const Environment = require('../../../src/lib/environment/Environment');
const InquirerPromptAssertions = require('../../../util/InquirerPromptAssertions');

describe(TEST_NAME, () => {
	it('should load prompts from the parameters from a valid template file', () => {
		let env = new Environment(TEST_NAME,CLOUD_FORMATION_DIR,{cloudFormationTemplatePattern:'vpc.yml'});
		return env.loadEnvironmentParametersAsPrompts()
			.then((prompts) => {
				prompts.should.exist;
				prompts.length.should.be.eql(4);
				prompts[0].name.should.be.eql('VpcCIDR');
				prompts[0].default.should.be.eql('10.10.0.0/16');
				prompts[0].type.should.be.eql('String');

				prompts[1].name.should.be.eql('EnvironmentName');
				expect(prompts[1].default).to.be.undefined;
				prompts[1].type.should.be.eql('String');

				prompts[2].name.should.be.eql('SubnetOffset');
				prompts[2].default.should.be.eql('8');
				prompts[2].type.should.be.eql('String');


				prompts[3].name.should.be.eql('NumberOfSubnets');
				prompts[3].default.should.be.eql('6');
				prompts[3].type.should.be.eql('String');
			});
	});
	it('should load all the parameter types as prompts', () => {
		let env = new Environment(TEST_NAME,CLOUD_FORMATION_DIR,{cloudFormationTemplatePattern:'all-the-types.yml'});
		return env.loadEnvironmentParametersAsPrompts()
			.then((prompts) => {
				prompts.should.exist;
				prompts.length.should.be.eql(7);
				InquirerPromptAssertions.sames(prompts, [
					{'type':'String','name':'VpcCIDR','default':'172.19.0.0/16','message':'Please enter a String for VpcCIDR => ','description':'VPC CIDR'},				
					{'type':'Number','name':'NodeCount','default':1,'message':'Please enter a Number for NodeCount => ','description':'NodeCount is a Number.'},
					{'type':'Number','name':'DatabaseCount','message':'Please enter a Number for DatabaseCount => ','description':'DatabaseCount is a Number.'},
					{'type':'String','name':'Username','default':'usprod','message':'Please enter a String for Username => ','description':'Username is a String.'},
					{'type':'String','name':'Encrypted','default':'true','message':'Please enter a String for Encrypted => ','description':'Encrypted is a String.'},
					{'type':'String','name':'Environment','message':'Please enter a String for Environment => ','description':'Environment Name'},
					{'type':'String','name':'Password','message':'Please enter a String for Password => ','description':'Password is a String.'}
				]);
			});
	});
	it('should load all ssm parameter types via directory', () => {
		let env = new Environment(TEST_NAME,CLOUD_FORMATION_DIR,{cloudFormationTemplatePattern:'vpc_ssm_params.yml'});
		return env.loadEnvironmentParametersAsPrompts()
			.then((prompts) => {
				prompts.should.exist;
				prompts.length.should.be.eql(4);
				InquirerPromptAssertions.sames(prompts,[
					{'type':'String','name':'VpcCIDR','default':'172.19.0.0/16','message':'Please enter a String for VpcCIDR => ','description':'VPC CIDR'},
					{'type':'String','name':'EnvironmentName','message':'Please enter a String for EnvironmentName => ','description':'Environment Name'},
					{'type':'Number','name':'SubnetOffset','default':10,'message':'Please enter a Number for SubnetOffset => ','description':'Offset of the subnet from the VPC CIDR'},
					{'type':'Number','name':'NumberOfSubnets','default':4,'message':'Please enter a Number for NumberOfSubnets => ','description':'Number of Subnets to create'}
				]);
			});
	});
	it('should load the parameters from multiple valid template files in a directory and dedupe them', () => {
		let env = new Environment(TEST_NAME,CLOUD_FORMATION_DIR,{cloudFormationTemplatePattern:'*pc.yml'});
		return env._loadCloudFormationParams()
			.then((params) => {
				params.should.exist;
				params.should.be.eql([
					{
						'ParameterKey': 'VpcCIDR',
						'DefaultValue': '10.10.0.0/16',
						'NoEcho': false,
						'Description': 'VPC CIDR',
						'ParameterConstraints': {},
						'ParameterType': 'String',
						_meta:{
							'_retrievedFrom': 'simple-vpc.yml'
						}
					},
					{
						'ParameterKey': 'EnvironmentName',
						'NoEcho': false,
						'Description': 'Environment Name',
						'ParameterConstraints': {},
						'ParameterType': 'String',
						_meta:{
							'_retrievedFrom': 'simple-vpc.yml'
						}
					},
					{
						'ParameterKey': 'NumberOfSubnets',
						'DefaultValue': '6',
						'NoEcho': false,
						'Description': 'Number of Subnets to create',
						'ParameterConstraints': {},
						'ParameterType': 'String',
						_meta:{
							'_retrievedFrom': 'simple-vpc.yml'
						}
					},
					{
						'ParameterKey': 'SubnetOffset',
						'DefaultValue': '8',
						'NoEcho': false,
						'Description': 'Offset of the subnet from the VPC CIDR',
						'ParameterConstraints': {},
						'ParameterType': 'String',
						_meta:{
							'_retrievedFrom': 'vpc.yml'
						}
					}
				]);
			});
	});
});