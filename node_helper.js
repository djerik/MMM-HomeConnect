const HomeConnect = require('home-connect-js');	
var fs = require('fs');
var NodeHelper = require("node_helper");

var devices = new Map();

module.exports = NodeHelper.create({
		
	refreshToken : null,
	hc : null, 

	init(){
		console.log("init module helper: MMM-HomeConnect");
	},

	start() {
		console.log('Starting module helper: ' + this.name);		
	},

	stop(){
		console.log('Stopping module helper: ' + this.name);
	},
	
	// handle messages from our module// each notification indicates a different messages
	// payload is a data structure that is different per message.. up to you to design this
	socketNotificationReceived(notification, payload) {

		switch(notification){
			case "CONFIG":
				// save payload config info
				this.config=payload				
				
				setConfig(payload);
				
				if (fs.existsSync('./modules/MMM-HomeConnect/refresh_token.json')) {
					this.refreshToken = fs.readFileSync('./modules/MMM-HomeConnect/refresh_token.json');
				}
				
				hc = new HomeConnect(this.config.client_ID, 
				 this.config.client_Secret
				 ,this.refreshToken);
							
				hc.on('newRefreshToken', (refresh_token) => {
					fs.writeFileSync('./modules/MMM-HomeConnect/refresh_token.json', refresh_token );					
					setTimeout(	getDevices, 5000, this);
				});
								
				hc.init({
					isSimulated: false // whether or not to use simulated instead of physical devices (for testing)
				});		
				
				
				this.sendSocketNotification("STARTUP", "<span class='deviceName'><span>Loading appliances...</span></span>");

				getUpdatedHTML(this);

				break;

			case "UPDATEREQUEST":
				getDevices(this);
				
				break;
		}
	},
});

var _config;

function setConfig(config){
	_config = config;
}

function parseEvent( event, device ){
	if( event.key == 'BSH.Common.Option.RemainingProgramTime' ){	
		device.RemainingProgramTime = event.value;
	} else if( event.key == 'BSH.Common.Option.ProgramProgress' ){
		device.ProgramProgress = event.value;
	} else if( event.key == 'BSH.Common.Status.OperationState' ){
		if( event.value == 'BSH.Common.EnumType.OperationState.Finished' ){
			device.RemainingProgramTime = 0;
		}
	} else if( event.key == 'Cooking.Common.Setting.Lighting' ){
		device.Lighting = event.value;
	} else if( event.key == 'BSH.Common.Setting.PowerState' ){
		if( event.value == 'BSH.Common.EnumType.PowerState.On' ){
			device.PowerState = 'On';
		} else if( event.value == 'BSH.Common.EnumType.PowerState.Standby' ){
			device.PowerState = 'Standby';
		} else if( event.value == 'BSH.Common.EnumType.PowerState.Off' ){
			device.PowerState = 'Off';
		}
	} else if( event.key == 'BSH.Common.Status.DoorState' ){
		if( event.value == 'BSH.Common.EnumType.DoorState.Open' ){
			device.DoorState = 'Open';
		} else if( event.value == 'BSH.Common.EnumType.DoorState.Closed' ){
			device.DoorState = 'Closed';
		} else if( event.value == 'BSH.Common.EnumType.DoorState.Locked' ){
			device.DoorState = 'Locked';
		}
	}	
}
	

function deviceEvent( data, caller ){
	var eventObj = JSON.parse( data.data );	
	eventObj.items.forEach( function( item ) {
		if( item.uri ){
			var haId = item.uri.split('/')[3];
			parseEvent( item, devices.get( haId ) );
		}
	});
	getUpdatedHTML(caller);
}
	
function getDevices(caller){
		hc.command('appliances', 'get_home_appliances')
				.then(result => {							
						result.body.data.homeappliances.forEach( function (device) {
							devices.set( device.haId, device );
							if( device.connected == true ){
								hc.command('status', 'get_status', device.haId).then(status_result => {
									status_result.body.data.status.forEach( 								
										function( event ){
											parseEvent( event, device );
										}
									);
									getUpdatedHTML(caller);
								});
								
								hc.command('settings', 'get_settings', device.haId).then(settings_result => {
									settings_result.body.data.settings.forEach( 								
										function( event ){
											parseEvent( event, device );
										}
									);
									getUpdatedHTML(caller);
								});
							}								
						});
						hc.subscribe( 'NOTIFY',  function(e) {
											deviceEvent(e,caller);											
						});				
						hc.subscribe( 'STATUS',  function(e) {
											deviceEvent(e,caller);											
						});	
						hc.subscribe( 'EVENT',  function(e) {
											deviceEvent(e,caller);											
						});
						let array = [...devices.entries()];
						sortedArray = array.sort((a, b) => (a[1].name > b[1].name) ? 1 : -1);
						devices = new Map(sortedArray);
						getUpdatedHTML(caller);
				});
}

function getUpdatedHTML(self) {
		updateHomeConnectInfos(function waitForHTML(html) {
			self.sendSocketNotification("MMM-HomeConnect_Update", html);
		});	
}

function updateHomeConnectInfos(callback) {
	var err;
	var wrapper = "";
	
	devices.forEach(function (value, key, map) {			
		wrapper = generateDeviceContainerHTML(wrapper, value);
	});
			 
	//If there is no device then tell it
	if(wrapper == ""){
		wrapper = "<span class='deviceName'><span>No active devices</span></span>";
	}

	callback(wrapper);
}

function generateDeviceContainerHTML(wrapper, device){
	//Check if Device should be ignored
	var IsSkipDevice = false;
	
	if(_config.showAlwaysAllDevices == false && device.PowerState != 'On' && ( device.Lighting === undefined || device.Lighting != true  ) ){

		IsSkipDevice = true;

		if(_config.showDeviceIfDoorIsOpen && device.DoorOpen){
			IsSkipDevice = false;
		}

		if(_config.showDeviceIfFailure && device.Failure){
			IsSkipDevice = false;
		}
				
		if(_config.showDeviceIfInfoIsAvailable && device.Failure){
			IsSkipDevice = false;
		}
	}

	if(!IsSkipDevice){
		var StatusString = "";

		var Image = device.type + ".png";

		var DeviceName = device.name;
		
		var container = "<div class='deviceContainerWithoutDeviceIcon'>"					
						+ "<div>";

		if(_config.showDeviceIcon){
			container = "<div class='deviceContainer'>"
						  + "<img src='/modules/MMM-HomeConnect/Icons/" + Image + "' />"
					  + "<div>";
		}		

		if(device.PowerState == 'On' || device.PowerState == 'Standby'){
			container += "<div>"
						+"<img class='deviceStatusIcon' src='/modules/MMM-HomeConnect/Icons/Status/" + device.PowerState +".png' />"
					  +"</div>";
		}

		if(device.DoorState == 'Open'){
			container += "<div>"
						+"<img class='deviceStatusIcon' src='/modules/MMM-HomeConnect/Icons/Status/Status_DoorOpen.png' />"
					  +"</div>";
		}

		if(device.Lighting == true){
			container += "<div>"
					  +"<img class='deviceStatusIcon' src='/modules/MMM-HomeConnect/Icons/Status/Status_LightOn.png' />"
					  +"</div>";
		}
		
		container +="</div>"
					+"<div>"
						+"<div>"
							+"<span class='deviceName'>" + DeviceName + "</span>"
						+"</div>"
						+"<div>"
							+"<span Class='deviceStatus'>${Status}</span>"
						+"</div>";

		//Add Timebar if there is remaining Time
		if(device.RemainingProgramTime > 0){
			StatusString += " - done in " + new Date(device.RemainingProgramTime * 1000).toISOString().substr(11, 5);

			if( device.ProgramProgress ){
				container+="<div>"
					+"<div Class='deviceProgress_Base'>"
						+"<div Class='deviceProgress' style='width:" + device.ProgramProgress + "%'></div>"
					+"</div>"
				+"</div>";
			}
		}

		container+="</div>"
				 +"</div>";

		container = container.replace("${Status}", StatusString);

		if(wrapper == ""){
			wrapper=container;
		}
		else{
			wrapper+=container;
		}
	}
	return wrapper;
}
