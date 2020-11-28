# MMM-HomeConnect

This is a module for the [MagicMirror²](https://github.com/MichMich/MagicMirror/) and the module displays your Home Connect devices on your mirror.

*The module is not released by the Bosch group*

I copied from the [Miele@Home Module](https://github.com/SAR71/MMM-MieleAtHome) abd used this repro for the API [home-connect-js](https://github.com/artcom/home-connect-js).

## Install guide

login to your rapberry pi, cd into the modules folder and execute
```
git clone https://github.com/djerik/MMM-HomeConnect
cd MMM-HomeConnect
npm install
```

- You need to have a registred Home Connect Account with eMail and password with connected Home Connect devices. 
- You also need to register for a Home Connect Developer Account [Home Connect Registration](https://developer.home-connect.com/user/register).
- You also need to register an Application in the developer portal to get a Client ID and a Client Secret. These info are needed in the config of the module. When registering the application, choose Authorization Code Grant Flow as OAuth Flow. And the Redirect URIs must be http://localhost:3000/o2c

To include this module in your Magic Mirror, add the following configuration block to the modules array in the `config/config.js` file:
```js
var config = {
    modules: [
        {
            module: "MMM-HomeConnect",
            position: "top_left",
            config: {
                client_ID: "",
                client_Secret: "",
            }
        },
    ]
}
```

Upon the first start of MagicMirror, it will start a browser and show the authorization screen. This is only necessary the first time, the access token will be refreshed automatically afterward.

## Configuration options

| Option                            | Default                            | Description
|-----------------------------------|:----------------------------------:|---------------------------------------------------------------------
| `client_ID`                       | ''                                 | *Required* 
| `client_Secret`                   | ''                                 | *Required* 
| `BaseURL`                         | 'https://api.home-connect.com/api' | *Optional* Url to the Miele API
| `showDeviceIcon`                  | true                               | *Optional* Show or hide the icon of the devices
| `showAlwaysAllDevices`            | false                              | *Optional* If you alway want to see al devices on the mirror even if the device is off
| `showDeviceIfDoorIsOpen`          | true                               | *Optional* if showAlwaysAllDevices is true, a device will be shown if Door is open
| `showDeviceIfFailure`             | true                               | *Optional* if showAlwaysAllDevices is true, the device will be shown if there is a failure
| `showDeviceIfInfoIsAvailable`     | true                               | *Optional* if showAlwaysAllDevices is true, the device will be shown if info is aAvailable
| `ignoreDevices`                   | []                                 | *Optional* array with DeviceIDs which should be ignored
| `updateFrequency`                 | 1000x60x60                         | *Optional* Update Frequency in ms

### Example configuration:
```js
var config = {
    modules: [
        {
            module: "MMM-HomeConnect",
            position: "top_left",
            config: {
                client_ID: "long value",
                client_Secret: "another long value",
            }
        },      
    ]
}
```
## Updating

To update the module to the latest version, use your terminal to go to your MMM-HomeConnect module folder and type the following command:

````
git pull
```` 

If you haven't changed the modules, this should work without any problems. 
Type `git status` to see your changes, if there are any, you can reset them with `git reset --hard`. After that, git pull should be possible.


## Example Screen:
[![Home-Connect-Hood-Screenshot.png](https://i.postimg.cc/vZgw7pn8/Home-Connect-Hood-Screenshot.png)](https://postimg.cc/rDkHMZg7)
