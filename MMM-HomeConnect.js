Module.register("MMM-HomeConnect", {
	// define variables used by module, but not in config data
	updated:  0,
	devices: [],

	// holder for config info from module_name.js
	config:null,

	// anything here in defaults will be added to the config data
	// and replaced if the same thing is provided in config
	defaults: {
        client_ID: "",
		client_Secret: "",
		BaseURL: 'https://api.home-connect.com/api',
		showDeviceIcon: true, //Show or hide the icon of the devices
		showAlwaysAllDevices: false, //if true all devices will be shown, despite if on or off
		showDeviceIfDoorIsOpen: true, //if showAlwaysAllDevices is true, the device will be shown if Door is open
		showDeviceIfFailure: true, //if showAlwaysAllDevices is true, the device will be shown if there is a failure
		showDeviceIfInfoIsAvailable: true, //if showAlwaysAllDevices is true, the device will be shown if Info is Available
		updateFrequency: 1000*60*60
	},

	init: function(){
		Log.log(this.name + " is in init!");
	},

	start: function(){
		Log.log(this.name + " is starting!");


		var timer = setInterval(()=>{
			this.sendSocketNotification("UPDATEREQUEST", null);
		}, this.config.updateFrequency);
	},

	loaded: function(callback) {
		Log.log(this.name + " is loaded!");

		callback();
	},

	// return list of other functional scripts to use, if any (like require in node_helper)
	getScripts: function() {
	return	[
			// sample of list of files to specify here, if no files,do not use this routine, or return empty list

			//'script.js', // will try to load it from the vendor folder, otherwise it will load is from the module folder.
			//'moment.js', // this file is available in the vendor folder, so it doesn't need to be available in the module folder.
			//this.file('anotherfile.js'), // this file will be loaded straight from the module folder.
			//'https://code.jquery.com/jquery-2.2.3.min.js',  // this file will be loaded from the jquery servers.
		]
	}, 

	// return list of stylesheet files to use if any
	getStyles: function() {
		return ["MMM-HomeConnect.css"];
		//return 	[
			// sample of list of files to specify here, if no files, do not use this routine, , or return empty list

			//'script.css', // will try to load it from the vendor folder, otherwise it will load is from the module folder.
			//'font-awesome.css', // this file is available in the vendor folder, so it doesn't need to be avialable in the module folder.
			//this.file('anotherfile.css'), // this file will be loaded straight from the module folder.
			//'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css',  // this file will be loaded from the bootstrapcdn servers.
		//]
	},

	// return list of translation files to use, if any
	getTranslations: function() {
		return {
			en: "translations/en.json", 
			de: "translations/de.json",
			da: "translations/da.json",
		}
	}, 



	// only called if the module header was configured in module config in config.js
	getHeader: function() {
		return "Home Connect";
	},

	// messages received from other modules and the system (NOT from your node helper)
	// payload is a notification dependent data structure
	notificationReceived: function(notification, payload, sender) {
		// once everybody is loaded up
		if(notification==="ALL_MODULES_STARTED"){
			// send our config to our node_helper
			this.sendSocketNotification("CONFIG",this.config)
		}
		if (sender) {
			//Log.log(this.name + " received a module notification: " + notification + " from sender: " + sender.name);
		} else {
			//Log.log(this.name + " received a system notification: " + notification);
		}
	},

	// messages received from from your node helper (NOT other modules or the system)
	// payload is a notification dependent data structure, up to you to design between module and node_helper
	socketNotificationReceived: function(notification, payload) {
		//Log.log(this.name + " received a socket notification: " + notification + " - Payload: " + payload);
		
		switch(notification){
			case "MMM-HomeConnect_Update":
				this.devices = payload;
				this.updateDom();
			break;
		}
	},

	// system notification your module is being hidden
	// typically you would stop doing UI updates (getDom/updateDom) if the module is hidden
	suspend: function(){

	},

	// system notification your module is being unhidden/shown
	// typically you would resume doing UI updates (getDom/updateDom) if the module is shown
	resume: function(){

	},

	// this is the major worker of the module, it provides the displayable content for this module
	getDom: function() {
		var div = document.createElement("div");
		var wrapper = "";
		_self = this;
		
		if( !this.devices || this.devices.length == 0 ){
			div.innerHTML = "<span class='deviceName'><span>"+_self.translate("LOADING_APPLIANCES")+ "...</span></span>";
			return div;
		}
		
		this.devices.forEach(function (device) {
			//Check if Device should be ignored
			var IsSkipDevice = false;	
			
			if(_self.config.showAlwaysAllDevices == false && device.PowerState != 'On' && ( device.Lighting === undefined || device.Lighting != true  ) ){

				IsSkipDevice = true;

				if(_self.config.showDeviceIfDoorIsOpen && device.DoorOpen){
					IsSkipDevice = false;
				}

				if(_self.config.showDeviceIfFailure && device.Failure){
					IsSkipDevice = false;
				}
						
				if(_self.config.showDeviceIfInfoIsAvailable && device.Failure){
					IsSkipDevice = false;
				}
			}

			if(!IsSkipDevice){
				var StatusString = "";

				var Image = device.type + ".png";

				var DeviceName = device.name;
				
				var container = "<div class='deviceContainerWithoutDeviceIcon'>"					
								+ "<div>";

				if(_self.config.showDeviceIcon){
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
					StatusString += " - "+ _self.translate("DONE_IN") + " " + new Date(device.RemainingProgramTime * 1000).toISOString().substr(11, 5);

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
		});
							
		//If there is no active devices then tell it
		if(wrapper == ""){
			wrapper = "<span class='deviceName'><span>"+ _self.translate("NO_ACTIVE_APPLIANCES") + "</span></span>";
		}

		div.innerHTML = wrapper
		return div;
	},
})
