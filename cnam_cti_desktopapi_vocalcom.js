/*
* Global variable
*/
var auto_callId
var auto_agentId
var auto_phoneNumber
var cBuffer = new CircularBuffer(20);
var InfoLevel = "Info";
var LogLevel = "Log";
var ErrorLevel = "Error";
var logmessage = "";
var pushconsolelogstopega = false;

/*
@public - Prototype definition for pega.cti.desktopApi.vocalcom
*/
pega.cti.desktopApi.vocalcom = function() {
    this.heartbeatIntervalId = '';
    this.heartbeatHTTPFailures = 0;
    this.maxHeartbeatHTTPFailures = 0;
    this.sQuiesceActivationDelay = 5;
    this.sStartActivationRequests = 0;
    this.name = "Vocalcom";
    this.implementationVersion = "1";
    this.Logger = new pega.cti.Logger();
};
/*
@public - Error object definition supported by Pega Call
*/
pega.cti.desktopApi.errorObject = function() {
    var errCode = null;
    var errMessage = null;
}
pega.cti.desktopApi.vocalcom.prototype = {
        /*
        @api - Initalize the object from link definition
        @param $Function$success – Callback function for success with message object
        @param $Function$failure – Callback function for failure with message object
        */
        initialize: function(agentId, agentPwd, extension, linkDef, options, callback) {
            this.agentId = agentId;
            this.agentPwd = agentPwd;
            this.extension = extension;
            this.linkDef = linkDef;
            this.options = options;
            this.pyJWTString = options.pyJWTString;
            this.vocalcomHost = linkDef.pyPrimaryHost;
            this.vocalcomPort = linkDef.pyPrimaryPort;
            this.proxyHost = linkDef.ProxyServerHost;
            this.proxyPort = linkDef.ProxyServerPort;
            this.proxyVer = linkDef.ProxyServerVersion;
            this.proxyHub = linkDef.ProxyConnectionHubURL;
            this.proxyCntlr = linkDef.ProxyEmbeddedClientURL;
            this.siteID = linkDef.pySiteID;
            var urlList = [
			this.proxyHub
		];
            var index = 0;
            var loadScript = function(url, func) {
                $.getScript(url).done(function(script, textStatus) {
                    //console.log((new Date()).getTime() +" function initialise start chargement du script " + url + "  : " +textStatus);
                    logmessage = (new Date()).getTime() +" : Initialize : function getScripts : start chargement du script " + url + "  : " +textStatus+ "Success"; 
                    SetConsoleLogMsg(logmessage,InfoLevel);
                    func();
                }).fail(function(jqxhr, settings, exception) {
                    //console.log((new Date()).getTime() + "echec chargement du script " + url +" : " + exception.message);
                    logmessage = (new Date()).getTime() + " : Initialize : function getScripts : echec chargement du script " + url +" : " + exception.message+ "Failed";
                    SetConsoleLogMsg(logmessage,InfoLevel);
                });
            }
            var loadNextScript = function() {
                if (index < urlList.length) {
                    loadScript(urlList[index], loadNextScript);
                    ++index;
                } else {
                    callback();
                }
            }
            loadNextScript();
        },
        /*
        @api - Log agent into the Vocalcom server. used login function, and connect function.
        @param $String$agentId – The Agent's ACD ID.
        @Param $String$agentPwd - The Agent's ACD Password
        @Param $String$extension - The Agent's ACD extension/Position
        @Param $String$linkDef - The CTILink definition as configured
        @param $String$options – String format of JSON object of optional Parameters
        @param $Function$success – Callback function for success with message object
        @param $Function$failure – Callback function for failure with message object
        @param $Function$forwardEvent – Callback function for forwarding asyncronus events from server
        */
        login: function(agentId, agentPwd, extension, linkDef, options, success, failure) {
            //console.log((new Date()).getTime() + " : function LOGIN start");
            setMyState("LoggingIn");
            if (extension == "" || undefined) {
                extension == linkDef.pyExtension;
            }
            if (agentPwd == "" || undefined) {
                agentPwd == linkDef.pyAgentPwd;
            }
            if (agentId == "" || undefined) {
                agentId == linkDef.pyAgentId;
            }
            pushconsolelogstopega = options.PushLogsToServer;
            // console.log((new Date()).getTime() + " ==> Pega CTI Login : Connecting to CTI link: " + linkDef.pyLabel +" with id center: " + agentId + " and extension :" + extension);
            logmessage =(new Date()).getTime() +" : Login : Connecting to CTI link: " + linkDef.pyLabel +" with id center: " + agentId + " and extension :" + extension;
            SetConsoleLogMsg(logmessage,InfoLevel);
            // Create object ProxyHermes
            this.initialize(agentId, agentPwd, extension, linkDef, options, function() {
                //console.log((new Date()).getTime() + " ==> Pega CTI Connection url: " + linkDef.ProxyServerHost +":" + linkDef.ProxyServerPort + ":" + linkDef.pySiteID);
                logmessage = (new Date()).getTime() + " : Login : CTI Connection url: " + linkDef.ProxyServerHost +":" + linkDef.ProxyServerPort + ":" + linkDef.pySiteID;
                SetConsoleLogMsg(logmessage,InfoLevel);
                //console.log((new Date()).getTime() + " ==> Pega CTI Version: " + linkDef.ProxyServerVersion);
                logmessage = (new Date()).getTime() + " : Login : CTI Version: " + linkDef.ProxyServerVersion;
                SetConsoleLogMsg(logmessage,InfoLevel);
                //console.log((new Date()).getTime() + " ==> Pega CTI Hub: " + linkDef.ProxyConnectionHubURL);
                logmessage = (new Date()).getTime() + " : Login : CTI Hub: " + linkDef.ProxyConnectionHubURL;
                SetConsoleLogMsg(logmessage,InfoLevel);
                //console.log((new Date()).getTime() + " ==> Pega CTI ActiveX controller: " + linkDef.ProxyClientEmbeddedURL);
                logmessage = (new Date()).getTime() + " : Login : CTI ActiveX controller: " + linkDef.ProxyClientEmbeddedURL;
                SetConsoleLogMsg(logmessage,InfoLevel);
                // initialize all needed to communicate with vocalcom, especially library
                // Create object ProxyHermes 
                ph = new ProxyHermesService(linkDef.ProxyServerHost, linkDef.ProxyServerPort, linkDef.ProxyServerVersion,linkDef.pySiteID, linkDef.ProxyConnectionHubURL);
                ph.onAdditionalData = function(objectCall) {
                    //console.log((new Date()).getTime() +" event onAdditionalData (call transfered) start");
                    logmessage = (new Date()).getTime() +" : Login : Event onAdditionalData (call transfered) start";
                    SetConsoleLogMsg(logmessage,LogLevel);
                    var parsedJSON = JSON.parse(objectCall);
                    var phoneNumber = managePhonePrefix(parsedJSON.Contact.PhoneNumberDetail);
                    var campaignId = parsedJSON.campaignId;
                    var waitingTime = parsedJSON.waitingTime;
                    var idSession = parsedJSON.SessionID;
                    var interactionId = parsedJSON.interactionId;
                    var customerId = parsedJSON.customerId;
                    var campaignType = parsedJSON.CampaignType;
                    var campaignName = parsedJSON.Campaign;
                    if (campaignType === "1") {
                        // When campaign type = 1 mean inboundCall
                        var pCallType = "INBOUND";
                        var pDirection = 1
                    } else {
                        // Else,  when campaign type = 2, mean outbound call
                        var pCallType = "OUTBOUND";
                        var pDirection = 2;
                    }
                    var siteId = this.siteID;
                    var recording = parsedJSON.recording;
                    if (recording == "9") {
                        recording = "false";
                    } else {
                        recording = "true";
                    }
                    var departmentCode = parsedJSON.departmentCode;
//                    setMyState("OnCallReceived", idSession, "", phoneNumber, recording);
                      /*console.log((new Date()).getTime() +
                        " : function star pop up with below param: phoneNumber " + phoneNumber +
                        " -- pCallType " + pCallType + " -- campaignId " + campaignId +
                        " -- waitingTime " + waitingTime + " -- idSession " + idSession +
                        " -- interactionId " + interactionId + " -- customerId " + customerId +
                        " -- campaignType " + campaignType + " -- campaignName " + campaignName +
                        " -- siteId " + siteId + " -- recording " + recording +
                        " -- departmentCode " + departmentCode + " start");*/
//                   pega.cpm.menuActions.demoScreenPop(phoneNumber, pCallType, campaignId, waitingTime,
//                        idSession, interactionId, customerId, campaignType, campaignName, siteId,
//                        recording, departmentCode, pDirection);
//                    // Send status on call received to pega  
//                    var dateTime = new Date();
//                    dateTime = new Date(dateTime.getTime() + dateTime.getTimezoneOffset() * 60000);
//                    dateTime = dateTime.customFormat("#DD#/#MM#/#YYYY# #hhhh#:#mm#:#ss#");
//                    console.log((new Date()).getTime() + " : --------------   Date du Call recu: " +dateTime);
//                    setDateTimeVocalcom(dateTime, "OnCallReceived");
//                    setClickToCall(false);
                }
                ph.onCall = function(phoneNumber) {
                    //console.log((new Date()).getTime() + " : event OnCall start with: " + phoneNumber);
                    logmessage = (new Date()).getTime() + " : Login : Event OnCall started with: " + phoneNumber;
                    SetConsoleLogMsg(logmessage,LogLevel);
                }
                ph.onCallReceived = function(objectCall) {
                    //console.log((new Date()).getTime() + " : event OnCallReceived start");
                    logmessage = (new Date()).getTime() + " : Login : Event OnCallReceived started";
                    SetConsoleLogMsg(logmessage,LogLevel);
                    var parsedJSON = JSON.parse(objectCall);
                    var phoneNumber = managePhonePrefix(parsedJSON.phoneNumber);
                    var campaignId = parsedJSON.campaignId;
                    var waitingTime = parsedJSON.waitingTime;
                    var idSession = parsedJSON.idSession;
                    var interactionId = parsedJSON.interactionId;
                    var customerId = parsedJSON.customerId;
                    //console.log((new Date()).getTime() + " : CustomerCallReceived : " + customerId);
                    logmessage = (new Date()).getTime() + " : Login : Event OnCallReceived with Customer : " + customerId;
                    SetConsoleLogMsg(logmessage,LogLevel);
                    //console.log((new Date()).getTime() + " : PhoneNumberCallReceived : " + phoneNumber);
                    logmessage = (new Date()).getTime() + " : Login : Event OnCallReceived With PhoneNumber : " + phoneNumber;
                    SetConsoleLogMsg(logmessage,LogLevel);
                    var campaignType = parsedJSON.campaignType;
                    var campaignName = parsedJSON.campaignName;
                    if (campaignType === "1") {
                        // When campaign type = 1 mean inboundCall
                        var pCallType = "INBOUND";
                        var pDirection = 1;
                    } else {
                        // Else,  when campaign type = 2, mean outbound call
                        var pCallType = "OUTBOUND";
                        var pDirection = 2;
                    }
                    var siteId = this.siteID;
                    var recording = parsedJSON.recording;
                    if (recording == "9") {
                        recording = "false";
                    } else {
                        recording = "true";
                    }
                    var departmentCode = parsedJSON.departmentCode;
                  
                    /* Set global variable for check auto record */
                    auto_callId = idSession;
                    auto_phoneNumber = phoneNumber;
                    auto_agent = extension;
                  
                    setMyState("OnCallReceived", idSession, "", phoneNumber, recording);
                    /*console.log((new Date()).getTime() +
                        " : function star pop up with below param: phoneNumber " + phoneNumber +
                        " -- pCallType " + pCallType + " -- campaignId " + campaignId +
                        " -- waitingTime " + waitingTime + " -- idSession " + idSession +
                        " -- interactionId " + interactionId + " -- customerId " + customerId +
                        " -- campaignType " + campaignType + " -- campaignName " + campaignName +
                        " -- siteId " + siteId + " -- recording " + recording +
                        " -- departmentCode " + departmentCode);*/
                    logmessage = (new Date()).getTime() + " : function start demopopup with below parameters : phoneNumber " + phoneNumber +" -- pCallType " + pCallType + " -- campaignId " + campaignId +" -- waitingTime " + waitingTime + " -- idSession " + idSession +" -- interactionId " + interactionId + " -- customerId " + customerId +" -- campaignType " + campaignType + " -- campaignName " + campaignName +" -- siteId " + siteId + " -- recording " + recording +" -- departmentCode " + departmentCode;
                    SetConsoleLogMsg(logmessage,LogLevel);
                  
                    pega.cpm.menuActions.demoScreenPop(phoneNumber, pCallType, campaignId, waitingTime,idSession, interactionId, customerId, campaignType, campaignName, siteId,recording, departmentCode, pDirection);
                    // Send status on call received to pega  
                    var dateTime = new Date();
                    dateTime = new Date(dateTime.getTime() + dateTime.getTimezoneOffset() * 60000);
                    //console.log((new Date()).getTime() + " : event OnCallReceived start");
                    //logmessage = (new Date()).getTime() + " : event OnCallReceived start";
                    //SetConsoleLogMsg(logmessage,InfoLevel);
                    dateTime = dateTime.customFormat("#DD#/#MM#/#YYYY# #hhhh#:#mm#:#ss#");
                    //console.log((new Date()).getTime() + " : --------------   Date du Call recu: " +dateTime);
                    logmessage = (new Date()).getTime() + " : Login : Event OnCallReceived : Date du Call recu: " +dateTime;
                    SetConsoleLogMsg(logmessage,LogLevel);
                    setDateTimeVocalcom(dateTime, "OnCallReceived");
                    setClickToCall(false);
                  
                    checkAutoRecord(campaignName);
                }
                
                ph.onPostCall = function(phoneNumber) {
                    // Qualification need to be done to end post call status. Send available status
                    setMyState("PostCall");
                    sethangupProcessing(false);
                    var dateTime = new Date();
                    dateTime = new Date(dateTime.getTime() + dateTime.getTimezoneOffset() * 60000);
                    dateTime = dateTime.customFormat("#DD#/#MM#/#YYYY# #hhhh#:#mm#:#ss#");
                    //console.log((new Date()).getTime() + " : --------------   Date du postCall : " +dateTime);
                    logmessage = (new Date()).getTime() + " : Login : Event OnPostCall : Date du Call recu: " +dateTime;
                    SetConsoleLogMsg(logmessage,LogLevel);
                    setDateTimeVocalcom(dateTime, "PostCall");
                }
                ph.onSessionEnd = function() {
                    //console.log((new Date()).getTime() + " : event onSessionEnd start");
                    logmessage = (new Date()).getTime() + " : Login : Event OnSessionEnd started";
                    SetConsoleLogMsg(logmessage,LogLevel);
                    setClickToCall(true);
                }
                ph.onPause = function() {
                    //console.log((new Date()).getTime() + " : event onPause start");
                    logmessage = (new Date()).getTime() + " : Login : Event onPause started";
                    SetConsoleLogMsg(logmessage,LogLevel);
                    // on succes, propagate data in pega and refresh ui
                    setMyState("Unavailable");
                }
                ph.onReady = function() {
                        //console.log((new Date()).getTime() + " : event onReady start");
                        logmessage = (new Date()).getTime() + " : Login : Event onReady started";
                        SetConsoleLogMsg(logmessage,LogLevel);
                        // on succes, refresh ui pega with propagation of data 
                        setMyState("Available");
                        sethangupProcessing(false);
                    }
                    // Retrieve manual camapign code. Not used for now. If needed.         
                ph.getManualCampaigns = function(campaigns) {
                    //console.log((new Date()).getTime() +" : event getManualCampaign start. Remove page CTI.CampaignManualList");
                    logmessage = (new Date()).getTime() +" : Login : event getManualCampaign started and Removing page CTI.CampaignManualList";
                    SetConsoleLogMsg(logmessage,LogLevel);
                    var id = "CampaignManualList";
                    removePage(id);
                    for (var i = 0; i < campaigns.length; i++) {
                        var campaignData = campaigns[i];
                        //console.log((new Date()).getTime() + " : CampaignID: " + campaignData.id +" & CampaignName: " + campaignData.description);
                      // 16/11/2022 the code below did a popup error message to end user due to a bad concatenation
                        //logmessage = (new Date()).getTime() + " : Login : event getManualCampaging : CampaignID: " + campaignData.id +" & CampaignName: " + campaignData.description;
                       // SetConsoleLogMsg(logmessage,LogLevel);
                        // call function to set data in pega. Manage by pega_cti_VocalcomCTIControlPanel JS file
                        setManualCampaigns(campaignData.id, campaignData.description);
                        setClickToCall(true, true);
                    }
                };
                // Retrieve camapign code. Not used for now. If needed, // TODO: same that pausecode or qualificationcode
                ph.getCampaigns = function(campaigns) {
                    //console.log((new Date()).getTime() +" : event getCamapigns start. Remove page CTI.CampaignList");
                    logmessage = (new Date()).getTime() +" : Login : event getCamapigns started and Removing page CTI.CampaignList";
                    SetConsoleLogMsg(logmessage,LogLevel);
                    var id = "CampaignList";
                    removePage(id);
                    for (var i = 0; i < campaigns.length; i++) {
                        var campaignData = campaigns[i];
                         //console.log((new Date()).getTime() + " : CampaignID: " + campaignData.id +" & CampaignName: " + campaignData.description);
                      // 16/11/2022 the code below did a popup error message to end user due to a bad concatenation
                        //logmessage = (new Date()).getTime() + " : Login : event getCamapigns : CampaignID: " + campaignData.id +" & CampaignName: " + campaignData.description;
                        //SetConsoleLogMsg(logmessage,LogLevel);
                        // call function to set data in pega. Manage by pega_cti_VocalcomCTIControlPanel JS file
                        setCampaigns(campaignData.id, campaignData.description);
                    }
                };
              
                //Retrieve all qualification code (used to qualify a call when it's finish)
                ph.getQualificationCodes = function(qualificationCodes) {
                    //console.log((new Date()).getTime() + " : event getQualificationCode start.");
                    logmessage = (new Date()).getTime() + " : Login : event getQualificationCode started";
                    SetConsoleLogMsg(logmessage,LogLevel);
                    //console.log((new Date()).getTime() + " : qualificationCodes : " + qualificationCodes);
                    logmessage = (new Date()).getTime() + " : Login : event qualificationCodes With Objects: " + qualificationCodes;
                    SetConsoleLogMsg(logmessage,InfoLevel);
                    setListeCode(qualificationCodes, "SetQualificationCode");
                };
              
                // Retrieve all pauses codes (used to specify pause status)
                ph.getPauseCodes = function(pauseCodes) {
                  
                  //console.log((new Date()).getTime() + " : event getPauseCodes start.");
                  logmessage = (new Date()).getTime() + " : Login : event getPauseCodes started";
                  SetConsoleLogMsg(logmessage,LogLevel);
                  //console.log((new Date()).getTime() + " : pauseCodes : " + pauseCodes);  
                  logmessage = (new Date()).getTime() + " : Login : event getpauseCodes with Objects: " + pauseCodes;
                  SetConsoleLogMsg(logmessage,InfoLevel);
                  setListeCode(pauseCodes, "SetPauseCode");
                  console.info("Pause code objects with json stringfy"+JSON.stringify(pauseCodes));
                  
                };
              
                $(ph.handler).one(ph.handler.events.onStarted, function() {
                    pega.cti.API.Logger.debug("Pega CTI Login : ProxHermess Object Created");
                    // create deffere to do a success/error callback with primary function
                    var deferred = new $.Deferred();
                    var IsSoftPhoneStation;
                    pega.cti.API.Logger.debug("JWT Token::" + options.pyJWTString);
                    var Albi = 1;
                    var AlbiCenter = Albi.toString();
                    var Lille = 2;
                    var LilleCenter = Lille.toString();
                    var Nice = 4;
                    var NiceCenter = Nice.toString();
                    var SaintEtienne = 6;
                    var SaintEtienneCenter = SaintEtienne.toString();
                    if (linkDef.CenterNumber == AlbiCenter || linkDef.CenterNumber == LilleCenter ||
                        linkDef.CenterNumber == NiceCenter || linkDef.CenterNumber ==
                        SaintEtienneCenter) {
                        //console.log((new Date()).getTime() + " : soft phone is enable");
                        logmessage = (new Date()).getTime() + " : Login : Softphone handler : enable";
                        SetConsoleLogMsg(logmessage,LogLevel);
                        IsSoftPhoneStation = "true";
                        ph.connect(deferred, options.pyJWTString, extension, IsSoftPhoneStation,
                            agentPwd, linkDef.pyPrimaryHost, linkDef.pyPrimaryPort, linkDef.ProxyClientEmbeddedURL,
                            linkDef.RealName);
                    } else {
                        IsSoftPhoneStation = "false";
                        //console.log((new Date()).getTime() + " : soft phone is disable");
                        logmessage = (new Date()).getTime() + " : Login : Softphone handler : disable";
                        SetConsoleLogMsg(logmessage,LogLevel);
                        ph.connect(deferred, options.pyJWTString, extension, IsSoftPhoneStation)
                    }
                    // when success
                    deferred.done(function(value) {
                            //console.log((new Date()).getTime() +" : Connection to Vocalcom success: " + value);
                            logmessage = (new Date()).getTime() +" : Login : Handler : Connection to Vocalcom success: " + value;
                            SetConsoleLogMsg(logmessage,LogLevel);
                            // callback succes, so call Function to Update state in Pega and update UI because propagate data 
                            setMyState("Available");
                            var source = source + (new Date()).getTime() +" : Login : Handler : Connection to Vocalcom success after call back from pega : " + value; 
                            logmessage = source;
                            SetConsoleLogMsg(logmessage,LogLevel);
                            SendCTIMsgLogToPega(source,"LogIn");
                            success();
                            if (IsSoftPhoneStation == "true") {
                                setSoftPhoneDB(extension);
                            }
                        })
                        // when failure
                        .fail(function(value) {
                            //console.log((new Date()).getTime() +" : Connection to Vocalcom failed: " + value);
                            logmessage = (new Date()).getTime() +" : Login : Connection to Vocalcom failed: " + value;
                            SetConsoleLogMsg(logmessage,LogLevel);
                            var source = source + (new Date()).getTime() +" : Login : Handler : Connection to Vocalcom failed: " + value; 
                            SendCTIMsgLogToPega(source,"LogIn");
                            if (value === "Timeout on login") {
                                pega.cti.API.Logger.Error("************** disconnect*************");
                                //ph.logout();
                            }
                            pega.cpm.menuActions.launchToasterScreen(value, "ERROR", "LoggingPopup");
                            var logoutdeferred = new $.Deferred();
                            ph.logout(logoutdeferred);
                            logoutdeferred.done(function(value) {
                              //console.log((new Date()).getTime() + " : Login : Handler : Logout success: " + value);
                              logmessage =  (new Date()).getTime() + " : Login : Handler : Logout success: " + value;
                              SetConsoleLogMsg(logmessage,LogLevel);
                              setMyState("Logout");
                            })
                            // when failure
                            .fail(function(value) {
                              //console.log((new Date()).getTime() + " : Login : Handler : Logout failed " + value);
                              logmessage = (new Date()).getTime() + " : Login : Handler : Logout failed " + value;
                              SetConsoleLogMsg(logmessage,ErrorLevel);
                              // TODO: display error message with log of the error for not log out
                            });
                            var errResponse = new pega.cti.desktopApi.errorObject();
                            errResponse.errCode = "OPENCTI_ERR_PASS";
                            errResponse.errMessage = value;
                            failure(errResponse);
                      
                        })
                        // on progress (notifications)
                        .progress(function(value) {
                            //console.log((new Date()).getTime() + " : Connection to Vocalcom: wip = " + value);
                            logmessage = (new Date()).getTime() +" : Login : Handler : Progress : Connection to Vocalcom: wip = " + value;
                            SetConsoleLogMsg(logmessage,LogLevel);
                        });
                })
            });
        },
        /*
        @api - Log agent out
        @param $Function$success – Callback function for success with message object
        @param $Function$failure – Callback function for failure with message object
        */
        logout: function(agentId) {
            //console.log((new Date()).getTime() + " : function Logout start - Initalized for agent: " + agentId);
            logmessage = (new Date()).getTime() + " : Logout : function Start: Initalized from agent: " + agentId;
            SetConsoleLogMsg(logmessage,LogLevel);
       
            // create deffere to do a success/error callback with primary function
            var deferred = new $.Deferred();
            ph.logout(deferred);
            // When success
            deferred.done(function(value) {
                    setClickToCall(false, false);
                    //console.log((new Date()).getTime() + " : Logout : success: " + value);
                    logmessage = (new Date()).getTime() + " : Logout : function start : success: " + value;
                    SetConsoleLogMsg(logmessage,LogLevel);
                    setMyState("Logout");
                    var source = source + (new Date()).getTime() +" : Logout : function start : success : After call back from pega " + value; 
                    SendCTIMsgLogToPega(source,"LogOut");

                })
                    
                // when failure
                .fail(function(value) {
                    //console.log((new Date()).getTime() + " : Logout failed " + value);
                    logmessage = (new Date()).getTime() + " : Logout : function failed " + value;
                    SetConsoleLogMsg(logmessage,ErrorLevel);  
                    // TODO: display error message with log of the error for not log out
                  var source = source + (new Date()).getTime() +" : Logout : function : failed : " + value; 
                  SendCTIMsgLogToPega(source,"LogOut");      
                });
        },
        /*
        @api - Hang up a call
        @param $Function$callId – callId references the id of current call
        */
        hangUpCallClosureSearchMember: function(callId, source) {
            pega.cti.API.Logger.info((new Date()).getTime() + " : HangUpCallClosureSearchMember : function : Initialization from " + source + " to hang up call for: " + callId);
            var hangupmsg = (new Date()).getTime() + " : HangUpCallClosureSearchMember : function : Initalization from " + source + " to hang up call for: " + callId;
            SetConsoleLogMsg(hangupmsg,ErrorLevel); 
            //console.log(hangupmsg);
            sethangupProcessing(true,hangupmsg);
            setTimeout(function() {
              //console.log((new Date()).getTime() + " : Initalizing the hangupprocessing to false");
              logmessage = (new Date()).getTime() + " : HangUpCallClosureSearchMember : function : Initalizing the hangupprocessing to false";
              SetConsoleLogMsg(logmessage,LogLevel);
              sethangupProcessing(false);
              deferred.done(function(value) {
                    //console.log((new Date()).getTime() + " : success = " + value);
                    logmessage = (new Date()).getTime() + " : HangUpCallClosureSearchMember : function : success : " + value;
                    SetConsoleLogMsg(logmessage,LogLevel);
                    
                })
                // when failure
                .fail(function(value) {
                    //console.log((new Date()).getTime() + " : error = " + value);
                    logmessage = (new Date()).getTime() + " : HangUpCallClosureSearchMember : function : error : " + value;
                    SetConsoleLogMsg(logmessage,ErrorLevel);
                });
            }, 1000);
            var deferred = new $.Deferred();
            ph.hangUp(deferred);
            deferred.done(function(value) {
                    //console.log((new Date()).getTime() + " : success = " + value);
                    logmessage = (new Date()).getTime() + " : HangUpCallClosureSearchMember : function : success : " + value;
                    SetConsoleLogMsg(logmessage,LogLevel);
                })
                // when failure
                .fail(function(value) {
                    //console.log((new Date()).getTime() + " : error = " + value);
                    logmessage = (new Date()).getTime() + " : HangUpCallClosureSearchMember : function : error : " + value;
                    SetConsoleLogMsg(logmessage,ErrorLevel);
                });
              setTimeout(function() {
              pega.cti.API.Logger.info((new Date()).getTime() + " : Launch sendQualification for : " + callId + " with value 91 as qualificationCode");
              //console.log((new Date()).getTime() + " : Launch sendQualification for : " + callId + " with value 91 as qualificationCode");
              logmessage = (new Date()).getTime() + " : HangUpCallClosureSearchMember : function : Launch sendQualification for : " + callId + " with value 91 as qualificationCode";
              SetConsoleLogMsg(logmessage,LogLevel);
              sendQualificationCode(91, callId,source);
              deferred.done(function(value) {
                    //console.log((new Date()).getTime() + " : success = " + value);
                    logmessage = (new Date()).getTime() + " : HangUpCallClosureSearchMember : function : success : " + value;
                    SetConsoleLogMsg(logmessage,LogLevel);
                })
                // when failure
                .fail(function(value) {
                    //console.log((new Date()).getTime() + " : error = " + value);
                    logmessage = (new Date()).getTime() + " : HangUpCallClosureSearchMember : function : error = " + value;
                    SetConsoleLogMsg(logmessage,ErrorLevel);
                });
            }, 2000);
        },
        /*
          @api - Hang up a call
          @param $Function$callId – callId references the id of current call
        */
        hangUpCurrentCall: function(callId, source) {
            pega.cti.API.Logger.info((new Date()).getTime() + " : HangUpCurrentCall : Function :Initalization from " + source + " to hang up call for: " + callId);
            // create deffere to do a success/error callback with primary function
            var hangupmsg = (new Date()).getTime() + " : HangUpCurrentCall : Function :Initalization from " + source + " to hang up call for: " + callId;
            //console.log(hangupmsg);
            SetConsoleLogMsg(hangupmsg,LogLevel); 
            sethangupProcessing(true,hangupmsg);
            setTimeout(function() {
              //console.log((new Date()).getTime() + " : Initalizing the hangupprocessing to false");
              logmessage = (new Date()).getTime() + " : HangUpCurrentCall : Function : Initalizing to false";
              SetConsoleLogMsg(logmessage,LogLevel);
              sethangupProcessing(false);
              deferred.done(function(value) {
                    //console.log((new Date()).getTime() + " : success = " + value);
                    logmessage = (new Date()).getTime() + " : HangUpCurrentCall : Function : success : " + value;
                    SetConsoleLogMsg(logmessage,LogLevel);
                })
                // when failure
                .fail(function(value) {
                    //console.log((new Date()).getTime() + " : error = " + value);
                    logmessage = (new Date()).getTime() + " : HangUpCurrentCall : Function : error :" + value;
                    SetConsoleLogMsg(logmessage,ErrorLevel);
                });
            }, 1000);
            var deferred = new $.Deferred();
            ph.hangUp(deferred);
            deferred.done(function(value) {
                    //console.log((new Date()).getTime() + " : success = " + value);
                    logmessage = (new Date()).getTime() + " : HangUpCurrentCall : Function : success : " + value;
                    SetConsoleLogMsg(logmessage,LogLevel);
                })
                // when failure
                .fail(function(value) {
                    //console.log((new Date()).getTime() + " : error = " + value);
                    logmessage = (new Date()).getTime() + " : HangUpCurrentCall : Function : success : " + value;
                    SetConsoleLogMsg(logmessage,ErrorLevel);
                });
        },
        /*
        @api - Place a new call
        @param $String$destination – the number used to place an outbound call
        @param $Function$option – native pega; not used
        */
        makeOutboundCall: function(destination, campaignId, campaignName, customerId, extension) {
            //in any case the agent need to be ready to do a call
            readyAgent();
            //console.log((new Date()).getTime() +" : function makeOutboundCall start. Initalization of outbound call for number: " + destination +" -- on campaign id : " + campaignId);
            logmessage = (new Date()).getTime() +" : MakeOutboundCall : function : start. Initalization of outbound call for number: " + destination +" -- on campaign id : " + campaignId;
            SetConsoleLogMsg(logmessage,LogLevel);
            // create deffere to do a success/error callback with primary function
            var deferred = new $.Deferred();
            var recording = "true";
            setMyState("OnCall", "", "", destination, recording);
            // create automatically an outbound interaction from CTI header only
            var phoneNumber = destination;
            var pCallType = "OUTBOUND";
            var waitingTime;
            var idSession;
            var interactionId;
            if (customerId) var pCustomerId = customerId;
            var campaignType = "2";
            if (campaignId) var pCampaignId = campaignId;
            if (campaignName) var pCampaignName = campaignName;
            var siteId = this.siteID;
            var departmentCode;
            var pDirection = "3";
          
            ph.manualCall(deferred, phoneNumber, pCampaignId);
            deferred.done(function(value) {
                    //console.log((new Date()).getTime() + " : succes  appelle sortant vers : " + phoneNumber);
                    logmessage = (new Date()).getTime() + " : Manual call : function : succes  appelle sortant vers : " + phoneNumber;
                    SetConsoleLogMsg(logmessage,LogLevel);
                    var recording = "true";
                    setMyState("OnCall", "", "", destination, recording);
                    // create automatically an outbound interaction from CTI header only
                    pega.cpm.menuActions.demoScreenPop(destination, pCallType, pCampaignId, waitingTime,
                        idSession, interactionId, pCustomerId, campaignType, pCampaignName, siteId,
                        recording, departmentCode, pDirection);
                    var dateTime = new Date();
                    dateTime = new Date(dateTime.getTime() + dateTime.getTimezoneOffset() * 60000);
                    dateTime = dateTime.customFormat("#DD#/#MM#/#YYYY# #hhhh#:#mm#:#ss#");
                    //console.log((new Date()).getTime() + " : --------------   Date du outbound call : " +dateTime);
                    logmessage = (new Date()).getTime() + " : Manual call : function :  Date du outbound call : " +dateTime;
                    SetConsoleLogMsg(logmessage,LogLevel);
                    setDateTimeVocalcom(dateTime, "OutboundCall");
                    setClickToCall(false);
                })
                // when failure
                .fail(function(value) {
                    //console.log((new Date()).getTime() + " : error = " + value);
                    logmessage = (new Date()).getTime() + " : Manual call : function :  error :" + value;
                    SetConsoleLogMsg(logmessage,ErrorLevel);
                    pega.cpm.menuActions.launchToasterScreen(value, "ERROR", "ManualCallPopup");
                });
        },
        /*
        @api - Place a call on hold
        @param $Function$callId – callId which references id ofr current call
        */
        holdCurrentCall: function(callId, calltreatment, phoneNumber, recording) {
            //console.log((new Date()).getTime() +" : function holdCurrentCall start. Initalization of Hold for call: " + callId);
            logmessage = (new Date()).getTime() +" : function holdCurrentCall start. Initalization of Hold for call: " + callId;
            SetConsoleLogMsg(logmessage,LogLevel);
            // create deffere to do a success/error callback with primary function
            var deferred = new $.Deferred();
            ph.hold(deferred);
            deferred.done(function(value) {
                    setMyState("OnCall", callId, calltreatment, phoneNumber, recording);
                    //console.log((new Date()).getTime() + " : success = " + value);
                    logmessage = (new Date()).getTime() + " : holdCurrentCall : function : success : " + value;
                    SetConsoleLogMsg(logmessage,LogLevel);
                })
                // when failure
                .fail(function(value) {
                    //console.log((new Date()).getTime() + " : error = " + value);
                    logmessage = (new Date()).getTime() + " : holdCurrentCall : function : error : " + value;
                    SetConsoleLogMsg(logmessage,ErrorLevel);
                });
        },
        /*
        @api - Retrieve an hold call
        @param $Function$CallId – id of current call
        */
        retrieveHoldCall: function(callId, calltreatment, phoneNumber, recording) {
            //console.log((new Date()).getTime() +" : function retrieveHoldCall start. Initalization of Holding call retrievial for callId: " +callId);
            logmessage = (new Date()).getTime() +" : function retrieveHoldCall start. Initalization of Holding call retrievial for callId: " + callId;
            SetConsoleLogMsg(logmessage,LogLevel);
            // create deffere to do a success/error callback with primary function
            var deferred = new $.Deferred();
            ph.retrieve(deferred);
            deferred.done(function(value) {
                    setMyState("OnCall", callId, calltreatment, phoneNumber, recording);
                    //console.log((new Date()).getTime() + " : success = " + value);
                    logmessage = (new Date()).getTime() + " : RetrieveHoldCall : function : success : " + value;
                    SetConsoleLogMsg(logmessage,LogLevel);
                })
                // when failure
                .fail(function(value) {
                    //console.log((new Date()).getTime() + " : error = " + value);
                    logmessage = (new Date()).getTime() + " : RetrieveHoldCall : function : error : " + value;
                    SetConsoleLogMsg(logmessage,ErrorLevel);
                });
        },
        /*
        @api - Record a call
        @param $Function$CallId – id of current call
        @param $Function$agentId – id of agent which launch this function
        */
        startRecord: function(callId, agentId, calltreatment, phoneNumber, recording) {
            //console.log((new Date()).getTime() +" : function startRecord start. Initalization of Recording call retrievial for callId: " +callId + " for agent : " + agentId);
            logmessage = (new Date()).getTime() +" : function startRecord start. Initalization of Recording call retrievial for callId: " + callId + " for agent : " + agentId;
            SetConsoleLogMsg(logmessage,LogLevel);
            // create deffere to do a success/error callback with primary function
            var deferred = new $.Deferred();
            ph.startRecord(deferred, agentId);
            deferred.done(function(value) {
                    setMyState("OnCall", callId, calltreatment, phoneNumber, recording);
                    //console.log((new Date()).getTime() + " : success = " + value);
                    logmessage = (new Date()).getTime() + " : StartRecord : function : success : " + value;
                    SetConsoleLogMsg(logmessage,LogLevel);
                })
                // when failure
                .fail(function(value) {
                    //console.log((new Date()).getTime() + " : error " + value);
                    logmessage = (new Date()).getTime() + " : StartRecord : function : error : " + value;
                    SetConsoleLogMsg(logmessage,ErrorLevel);
                });
        },
        /*
        @api - Stop recording a call
        @param $Function$CallId – id of current call
        */
        stopRecord: function(callId, calltreatment, phoneNumber, recording) {
            //console.log((new Date()).getTime() +" : function stopRecord start. Turn off of Recording call retrievial for callId: " + callId);
            logmessage = (new Date()).getTime() +" : function stopRecord start. Turn off of Recording call retrievial for callId: " + callId;
            SetConsoleLogMsg(logmessage,LogLevel);
            // create deffere to do a success/error callback with primary function
            var deferred = new $.Deferred();
            ph.stopRecord(deferred);
            deferred.done(function(value) {
                    setMyState("OnCall", callId, calltreatment, phoneNumber, recording);
                    //console.log((new Date()).getTime() + " : Start Record : Function : success : " + value);
                    logmessage = (new Date()).getTime() + " : Start Record : Function : success : " + value;
                    SetConsoleLogMsg(logmessage,LogLevel);
                    var source = " success : " + value; 
                    SendCTIMsgLogToPega(source,"StopRecord");    

                })
                // when failure
                .fail(function(value) {
                    //console.log((new Date()).getTime() + " : Start Record : Function : error " + value);
                    logmessage = (new Date()).getTime() + " : error = " + value;
                    SetConsoleLogMsg(logmessage,ErrorLevel);
                    var source = "Failure : " + value;  
                    SendCTIMsgLogToPega(source,"StopRecord");    
                });
        },
        /*
        @api - Make the agent ready
        */
        readyAgent: function() {
            //console.log((new Date()).getTime() +" : function readyAgent start. State Ready initialized for the agent");
            logmessage = (new Date()).getTime() +" : function readyAgent start. State Ready initialized for the agent";
            SetConsoleLogMsg(logmessage,LogLevel);
            // The deffered below to do a success/error callback depricated in ProxyHermesService...
            var deferred = new $.Deferred();
            ph.ready(deferred);
            deferred.done(function(value) {
                    setMyState("Available");
                    //console.log((new Date()).getTime() + " : ready succes: " + value)
                    logmessage = (new Date()).getTime() + " : ReadyAgent : function : succes: " + value;
                    SetConsoleLogMsg(logmessage,LogLevel);
                    var source = source + (new Date()).getTime() +" : ReadyAgent : function : succes: " + value; 
                    SendCTIMsgLogToPega(source,"Ready");
                })
                // when failure
                .fail(function(value) {
                    //console.log((new Date()).getTime() + " : ready failed: " + value)
                    logmessage = (new Date()).getTime() + " : ReadyAgent : function : failed: " + value;
                    SetConsoleLogMsg(logmessage,ErrorLevel);
                    var source = source + (new Date()).getTime() +" : ReadyAgent : function : failed: " + value;
                    SendCTIMsgLogToPega(source,"Ready");
                });
        },
        /*
        @api - Make the agent not ready
        @param $String$pauseCode – pause code used to declare to vocalcom the pause used by agent
        */
        pauseCodeAgent: function(pauseCode) {
            //console.log((new Date()).getTime() +" : function pauseCode start. State Pause initialized for the agent with state: " + pauseCode);
            logmessage = (new Date()).getTime() +" : function pauseCode start. State Pause initialized for the agent with state: " + pauseCode;
            SetConsoleLogMsg(logmessage,LogLevel);
            // The deffered below to do a success/error callback depricated in ProxyHermesService...
            var deferred = new $.Deferred();
            ph.pause(deferred, pauseCode);
            deferred.done(function(value) {
                    setMyState("Unavailable");
                    //console.log((new Date()).getTime() + " : pause succes: " + value)
                    logmessage = (new Date()).getTime() + " : pauseCodeAgent : Function : succes: " + value;
                    SetConsoleLogMsg(logmessage,LogLevel);
                })
                // when failure
                .fail(function(value) {
                    //console.log((new Date()).getTime() + " : pause failed: " + value)
                    logmessage = (new Date()).getTime() + " : PauseCodeAgent : Function : failed: " + value;
                    SetConsoleLogMsg(logmessage,ErrorLevel);
                });
        },
        /*
        @api - Qualification used to send to vocalcom the reason of the call. Send it at the end of the interaction, during postcall status
        @param $Function$callId – callId which references the id of current call
        @param $String$qualificationCode – qualification code used to declare to vocalcom the qualification of the call after it'ds done.
        */
        sendQualificationCode: function(qualificationCode, callId, source) {
            pega.cti.API.Logger.info((new Date()).getTime() + " : sendQualification started for : " + callId + " with " + qualificationCode + " as qualificationCode");
            //console.log((new Date()).getTime() +" : function sendQualification start. Status qualification initialized for the agent with state: " +qualificationCode);
            logmessage = (new Date()).getTime() +" : function sendQualification start. Status qualification initialized for the agent with state: " + qualificationCode;
            SetConsoleLogMsg(logmessage,LogLevel);
            // create deffere to do a success/error callback with primary function
            var deferred = new $.Deferred();
            ph.qualify(deferred, qualificationCode);
            source = source + " With Qualification code :"+qualificationCode;
            SendCTIMsgLogToPega(source,"SendQualification");
            setMyState("Qualify");
            // When succes
            deferred.done(function(value) {
                    pega.cti.API.Logger.debug(value);
                    pega.cti.API.Logger.info((new Date()).getTime() + " : sendQualification OK for : " + callId + " with " + qualificationCode + " as qualificationCode");
                    //console.log((new Date()).getTime() +" : Qualification send to vocalcom properly, with value: " + qualificationCode);
                    logmessage = (new Date()).getTime() +" : Qualification send to vocalcom properly, with value: " + qualificationCode;
                    SetConsoleLogMsg(logmessage,LogLevel);
                })
                // when failure
                .fail(function(value) {
                    pega.cti.API.Logger.info((new Date()).getTime() + " : sendQualification KO/FAIL for : " + callId + " with " + qualificationCode + " as qualificationCode");
                    //console.log((new Date()).getTime() + " :  error = " + value);
                    logmessage = (new Date()).getTime() + " :  error = " + value;
                    SetConsoleLogMsg(logmessage,ErrorLevel);
                    if(value.includes("END OF FILE 180s Before Starting")){
                      //console.log("Do Nothing when the End of File 180s Before Starting");
                      logmessage = "Do Nothing when the End of File 180s Before Starting";
                      SetConsoleLogMsg(logmessage,ErrorLevel);
                    }else{
                      pega.cpm.menuActions.launchToasterScreen(value, "ERROR", "SendQualificationPopup");
                    }
                 });
        },
        /*
        @api - transfer current phone call to another center. Go to waiting queue
        @param $Function$callId – callId which references the id queue to send current phone call
        */
        transferPhoneCall: function(callId) {
            //console.log((new Date()).getTime() +" : function transferPhoneCall start. Transfer phone call initialized with id queue : " + callId
            logmessage = (new Date()).getTime() +" : function transferPhoneCall start. Transfer phone call initialized with id queue : " + callId;
            SetConsoleLogMsg(logmessage,LogLevel);
            // create deffere to do a success/error callback with primary function
            var deferred = new $.Deferred();
            ph.transfer(deferred, callId);
            // When succes
            deferred.done(function(value) {
                    //console.log((new Date()).getTime() +" : transferPhoneCall :function :Qualification send to vocalcom properly, with value: " + value);
                    logmessage = (new Date()).getTime() +" : TransferPhoneCall : function : Qualification send to vocalcom properly, with value: " + value;
                    SetConsoleLogMsg(logmessage,LogLevel);
                    //setMyState("Available");
                })
                // when failure
                .fail(function(value) {
                    //console.log((new Date()).getTime() + " : error = " + value);
                    logmessage = (new Date()).getTime() + " : TransferPhoneCall : function : error = " + value;
                    SetConsoleLogMsg(logmessage,ErrorLevel);
                });
        },
        // After this line, native function. Not used now, and if needed to implemente other function, need to change/create function with other name that used below.
        /*
        @api - Send DTMF Tones
        @param $String$callId – The callId of the call to send tones to
        @param $String$Digits – The String of tones to be sent
        @param $String$options – String format of JSON object of optional Parameters
        @param $Function$success – Callback function for success with message object
        @param $Function$failure – Callback function for failure with message object
        */
        sendDTMF: function(callId, digits, options, success, failure) {},
        /*
        @api - Answer a ringing call
        @param $String$callId – The callId of the call answer
        @param $String$options – String format of JSON object of optional Parameters
        @param $Function$success – Callback function for success with message object
        @param $Function$failure – Callback function for failure with message object
        */
        answerCall: function(callId, options, success, failure) {},
        /*
        @api - Blind Transfer the call
        @param $String$callId – The Active Call Id
        @param $String$destination – The dialed digits of the destination party
        @param $String$options – String format of JSON object of optional Parameters
        @param $Function$success – Callback function for success with message object
        @param $Function$failure – Callback function for failure with message object
        */
        blindTransfer: function(callId, destination, options, success, failure) {},
        /*
        @api - Initiate a (warm/attended) Transfer
        @param $String$callId – The Call Id of the call
        @param $String$destination – The dialed digits of the transfer destination
        @param $String$options – String format of JSON object of optional Parameters
        @param $Function$success – Callback function for success with message object
        @param $Function$failure – Callback function for failure with message object
        */
        transferInitiate: function(callId, destination, options, success, failure) {},
        /*
        @api - Transfer the call
        @param $String$heldcallId – The Call Id of the held party
        @param $String$activecallId – The call Id of the active (consulted/destination) call
        @param $String$options – String format of JSON object of optional Parameters
        @param $Function$success – Callback function for success with message object
        @param $Function$failure – Callback function for failure with message object
        */
        transferComplete: function(heldcallId, activecallId, options, success, failure) {},
        /*
        @api - Place a consultation call
        @param $String$callId – The callId of the active call
        @param $String$destination – The dialed digits of the party to be consulted
        @param $String$options – String format of JSON object of optional Parameters
        @param $Function$success – Callback function for success with message object
        @param $Function$failure – Callback function for failure with message object
        */
        consulationCall: function(callId, destination, options, success, failure) {},
        /*
        @api - Initiate a conference
        @param $String$callId – The callId of the active call
        @param $String$destination – if of agent 
        @param $String$options – String format of JSON object of optional Parameters
        @param $Function$success – Callback function for success with message object
        @param $Function$failure – Callback function for failure with message object
*/
        conferenceInitiate: function(callId, destination, options, success, failure) {},
        /*
        @api - Complete a conference
        @param $String$activecallId – The Call Id of the active call
        @param $String$heldcallId – The Call Id of the held call
        @param $String$options – String format of JSON object of optional Parameters
        @param $Function$success – Callback function for success with message object
        @param $Function$failure – Callback function for failure with message object
        */
        conferenceComplete: function(heldcallId, activecallId, options, success, failure) {},
        /*
        @api - Drop party from a Conference
        @param $String$callId – The callId of the call from which party is to be dropped
        @param $String$party – The party to be dropped
        @param $String$options – String format of JSON object of optional Parameters
        @param $Function$success – Callback function for success with message object
        @param $Function$failure – Callback function for failure with message object
        */
        dropparty: function(callId, party, options, success, failure) {},
        /*
        @api - Complete a Alternate Call
        @param $String$heldcallId – The Call Id of the held call
        @param $String$activecallId – The Call Id of the active call
        @param $String$options – String format of JSON object of optional Parameters
        @param $Function$success – Callback function for success with message object
        @param $Function$failure – Callback function for failure with message object
        */
        alternateCall: function(heldcallId, activecallId, options, success, failure) {},
        /*
        @api - Get the logger attached to this object
        */
        getLogger: function() {
            return this.Logger;
        },
    }
    /*
    @api - Hang up a Call From Closure Button on Search Member screen
    @param $String$destination – number to used to do an outbound call
    */
function hangUpCallClosureSearchMember(callId,source) {
    // pega.cti.API.Logger.info("Initialized outbound call");
    pega.cti.API.hangUpCallClosureSearchMember(callId,source);
}
    /*
    @api - Make an outbound call
    @param $String$destination – number to used to do an outbound call
    */
function hangUpCurrentCall(callId,source) {
    // pega.cti.API.Logger.info("Initialized outbound call");
    pega.cti.API.hangUpCurrentCall(callId,source);
}
/*
@api - Make an outbound call
@param $String$destination – number to used to do an outbound call
*/
function makeOutboundCall(destination, campaignId, campaignName, customerId) {
    // pega.cti.API.Logger.info("Initialized outbound call");
    pega.cti.API.makeOutboundCall(destination, campaignId, campaignName, customerId);
}
/*
    @api - Make an outbound call
    @param $String$destination – number to used to do an outbound call
    */
function holdCurrentCall(callId, calltreatment, phoneNumber, recording) {
    // pega.cti.API.Logger.info("Initialized outbound call");
    pega.cti.API.holdCurrentCall(callId, calltreatment, phoneNumber, recording);
}
/*
    @api - Make an outbound call
    @param $String$destination – number to used to do an outbound call
    */
function retrieveHoldCall(callId, calltreatment, phoneNumber, recording) {
    // pega.cti.API.Logger.info("retrieve current call for call id: " + callId);
    pega.cti.API.retrieveHoldCall(callId, calltreatment, phoneNumber, recording);
}
/*
@api - function to set agent to available status
*/
function readyAgent() {
    // pega.cti.API.Logger.info("Initialized Ready state for agent");
    pega.cti.API.readyAgent();
}
/*
@api - function used to do a break by agent.
@param $String$pauseCode – pauseCode used to send the id of pause to vocalcom
*/
function pauseCodeAgent(pauseCode) {
    // pega.cti.API.Logger.info("Initialized Break state for agent with state below: " + pauseCode);
    pega.cti.API.pauseCodeAgent(pauseCode);
}
/*
@api - function used to start a recording of current call.
@param $String$callId – id of the current call
@param $String$agentId – id of the current agent
*/
function startRecord(callId, agentId, calltreatment, phoneNumber, recording) {
    // pega.cti.API.Logger.info("Initialized recording call for agent: " + agentId + " with call id below: " + callId);
    pega.cti.API.startRecord(callId, agentId, calltreatment, phoneNumber, recording);
}
/*
@api - function used to stop a recording of current call.
@param $String$callId – id of the current call
*/
function stopRecord(callId, calltreatment, phoneNumber, recording) {
    // pega.cti.API.Logger.info("Initialized STOP/END/REMOVE for recording call for agent with call id below: " + callId);
    pega.cti.API.stopRecord(callId, calltreatment, phoneNumber, recording);
}
/*
@api - function used to send qualification of the current call to vocalcom: Finish the post call status of the agent
@param $String$callId – id of the current call
@param $String$qualificationCode – id of the qualification
*/
function sendQualificationCode(qualificationCode, callId, source) {
    // pega.cti.API.Logger.info(
    //    "Initialized ending of postcall status by sending qualification of current call for agent with call id below: " +
    //    callId + " and qualification code below: " + qualificationCode);
    pega.cti.API.sendQualificationCode(qualificationCode, callId, source);
}
/*
@api - function used to send qualification of the current call to vocalcom: Finish the post call status of the agent
@param $String$callId – id of the current call
@param $String$qualificationCode – id of the qualification
*/
function transferPhoneCall(callId) {
    // pega.cti.API.Logger.info("Initialized transfert current call for agent for queue id below: " + callId);
    pega.cti.API.transferPhoneCall(callId);
}
/*
@api - function used to set enable the clic to call to current agent .Called when connection / log in to vocalcom is ok && when log out is ok
@param $Boolean$isClicktoCallEnabled – true or false. To (dis)enable the click to call to make an outbound call
@param $Boolean$isManualCampaign – true or false. To store if manual campaign exist
*/
function setClickToCall(isClicktoCallEnabled, isManualCampaign) {
    if (isManualCampaign === true) {
        //console.log((new Date()).getTime() + " : function setClicToCall start. Set to true!!");
        logmessage = (new Date()).getTime() + " : SetClickToCall :function : start. Set to true";
        SetConsoleLogMsg(logmessage,LogLevel);
        this.old_isManualCampaign = true;
    } else if (isManualCampaign === false) {
        //console.log((new Date()).getTime() + " : function setClicToCall start. Set to fase!!");
        logmessage = (new Date()).getTime() + " : SetClickToCall :function : start. Set to false";
        SetConsoleLogMsg(logmessage,LogLevel);
        this.old_isManualCampaign = false;
    }
    if (this.old_isManualCampaign === true) {
        var postData = new SafeURL();
        var activityUrl = new SafeURL("ChannelServices-Device-Phone-UI.SetClickToCall");
        activityUrl.put("ClickToCall", isClicktoCallEnabled);
        postData.put("pzPrimaryPageName", "CTIPhone");
        pega.u.d.asyncRequest("POST", activityUrl, {
            success: function(oResponse) {
                //console.log((new Date()).getTime() + " : Click to Call flag sucesfully set to : " +isClicktoCallEnabled);
                logmessage = (new Date()).getTime() + " : SetClickToCall : function : flag sucesfully set to : " +isClicktoCallEnabled;
                SetConsoleLogMsg(logmessage,LogLevel);
                
            },
            failure: function(oResponse) {
                //console.log((new Date()).getTime() + " : Failed to set click to call flag");
                logmessage = (new Date()).getTime() + " : SetClickToCall : function : Failed to set click to call flag";
                SetConsoleLogMsg(logmessage,ErrorLevel);
              
            },
            scope: this
        }, postData);
    }
}
/*
@api - Function calling an activity to store data into the clipboard and refresh ui with them
@param $String$status - The agent status : available, unavailable, logout, etc
@param $String$callId - The id of the current Call if there is one
@param $String$callTreatment - The status/treatment of the current Call if there is one (used for refresh ui with hold and retrieve function for ui)
@param $String$phoneNumber - propagate the phone number which used to make an outbound called / received a call to page CTI
@param $String$recording - to enable/disable the possibility to do a recording of current call. Send by Vocalcom.
*/
function setMyState(status, callId, callTreatment, phoneNumber, recording) {
    //console.log((new Date()).getTime() + " : Start setMyState function");
    logmessage = (new Date()).getTime() + " : Start setMyState function";
    SetConsoleLogMsg(logmessage,LogLevel);
    logmessage = (new Date()).getTime() + " : setMyState actual: " + status + "  for session id   : " + callId +"     with treatment : " + callTreatment;
    SetConsoleLogMsg(logmessage,LogLevel);
    logmessage = (new Date()).getTime() + " : old_setMyState: "+this.old_status+"for old_session id:"+this.old_callId +"with old_treatment:" +this.old_callTreatment;
    SetConsoleLogMsg(logmessage,LogLevel);
    // We need to update the values if they changed
    if (status !== this.old_status || (callId !== (this.old_callId)) || (callTreatment !== (this.old_callTreatment)) ||
        (recording !== this.old_recording)) {
        if (status === "Available" && this.old_status === "OnCall") {
            // do nothing, issue to be updated by @LML into JS Vocalcom
        } else {
            var agentStateCallId = "";
            if (callId !== ("" || undefined)) agentStateCallId = callId;
            var agentStateCallTreat = "";
            if (callTreatment !== ("" || undefined)) agentStateCallTreat = callTreatment;
            var options = {
                name: "SetAgentState",
                parameters: [
                    {
                        name: "AgentState",
                        value: status,
                        isProperty: false
                },
                    {
                        name: "CallId",
                        value: agentStateCallId,
                        isProperty: false
                },
                    {
                        name: "CallTreatment",
                        value: agentStateCallTreat,
                        isProperty: false
                },
                    {
                        name: "PhoneNumber",
                        value: phoneNumber,
                        isProperty: false
                },
                    {
                        name: "Recording",
                        value: recording,
                        isProperty: false
                }
            ],
                contextPage: "CTIPhone"
            };
            logmessage = (new Date()).getTime() + " : Calling DT: SetAgentState with AgentState: " + status +" and callid: " + agentStateCallId;
            SetConsoleLogMsg(logmessage,LogLevel);
            logmessage = (new Date()).getTime() + " : with Add Params with callTreatment: " + agentStateCallTreat + " and phnum : " + phoneNumber;
            SetConsoleLogMsg(logmessage,LogLevel);
            logmessage = (new Date()).getTime() + " : with Add Params SetAgentState with recording is enable ? : " + recording;
            SetConsoleLogMsg(logmessage,LogLevel);
            try {
                pega.api.ui.actions.runDataTransform(options);
                setTimeout(function() {
                    // reload function 100ms after udpate CTIPhone page to be sure to not doing during propagation data
                    var recentSection = pega.u.d.getSectionByName("PegaCallControlPanelAdaptor");
                    pega.u.d.reloadSection(recentSection);
                    //console.log((new Date()).getTime() +" : *******reloaded PegaCallControlPanelAdaptor section******");
                    logmessage = (new Date()).getTime() +" : Reloaded PegaCallControlPanelAdaptor section";
                    SetConsoleLogMsg(logmessage,LogLevel);
                    
                }, 100);
                setTimeout(function() {
                    // reload function 100ms after udpate CTIPhone page to be sure to not doing during propagation data
                    var recentSection2 = pega.u.d.getSectionByName("PegaCallContainer");
                    pega.u.d.reloadSection(recentSection2);
                    //console.log((new Date()).getTime() + " : *******reloaded PegaCallContainer section******");
                    logmessage = (new Date()).getTime() + " : Reloaded PegaCallContainer section";
                    SetConsoleLogMsg(logmessage,LogLevel);
                }, 100);
                // Store the callid and statut to used inside the if to reload or not section (and call DT)
                this.old_callId = callId;
                this.old_status = status;
                this.old_callTreatment = callTreatment;
                this.old_recording = recording;
            } catch (e) {
                //console.log((new Date()).getTime() + " : Error during PegaCallControlPanelAdaptor section reload: " + e);
                logmessage = (new Date()).getTime() + " : Error loading PegaCallControlPanelAdaptor section : " + e;
                SetConsoleLogMsg(logmessage,ErrorLevel);
            }
        }
    } else {
        //console.log((new Date()).getTime() + " : not update of status or callID, no need to update");
        logmessage = (new Date()).getTime() + " : not update of status or callID, no need to update";
        SetConsoleLogMsg(logmessage,LogLevel);
    }
}
/*
@api - Function calling an activity to store data into the clipboard. Used to propagate pausecode status in ui pega and cache data
@param $String$codes - The pause code used to identify the pause status used
@param $String$consumed - ???
@param $String$description - The label of the pause
@param $String$group - The group of the pause
*/
function setPauseCode(code, consumed, description, group) {
    var pauseCode = code;
    var isConsumed = "";
    var pauseDesc = description;
    var pauseGroup = "";
    if (consumed !== ("" || undefined)) {
        isConsumed = consumed;
    }
    if (group !== ("" || undefined)) {
        pauseGroup = group;
    }
    var options = {
        name: "SetPauseCode",
        parameters: [
            {
                name: "Code",
                value: pauseCode,
                isProperty: falseSetPauseCode
            },
            {
                name: "Consumed",
                value: isConsumed,
                isProperty: false
            },
            {
                name: "Description",
                value: pauseDesc,
                isProperty: false
            },
            {
                name: "Group",
                value: pauseGroup,
                isProperty: false
            }
                ],
        contextPage: "CTIPhone"
    };
    pega.cti.API.Logger.info("Calling SetPauseCode data transform....");
    try {
        pega.api.ui.actions.runDataTransform(options);
        //console.log((new Date()).getTime() + " : Call SetPauseCode data transform success");
        logmessage = (new Date()).getTime() + " : Call SetPauseCode data transform success";
        SetConsoleLogMsg(logmessage,LogLevel);
    } catch (e) {
        //console.log((new Date()).getTime() + " : Error during SetPauseCode data transform: " + e);
        logmessage = (new Date()).getTime() + " : Error during SetPauseCode data transform: " + e;
        SetConsoleLogMsg(logmessage,ErrorLevel);
    }
}

function getRandomNum(min, max) {
  return Math.random() * (max - min) + min;
}

function callbackFunc(resultJSON){
  if(resultJSON.pxResultCount >= 1) {
    var random = getRandomNum(1,100);
    if (random <=  resultJSON.pxResults[0].CallRatio) {
      startRecord(auto_callId, auto_agentId, '', auto_phoneNumber, "OnRecord");
    }
  }
}

function checkAutoRecord(campaignName) {  
            var options = {
                name: "D_CTIRecordingTriggers",
                parameters: [{name: "CampaignName", value: campaignName, isProperty: false}],
                callback: callbackFunc,
            };

            pega.api.ui.actions.getDataPage(options);       
}

/*
@api - Function calling an activity to store data into the clipboard -
@param $String$liste - Liste of qualification or pause.
@param $String$source - Name of the data transform that need to be called to fill the list (SetQualificationCode or SetPauseCode)
*/
function setListeCode(liste, source) {
    var qQualif = liste;
    var options = {
        name: source,
        parameters: [   
            {
                name: "jsonData",
                value: JSON.stringify(qQualif),
                isProperty: false
            },
            {
                name: "executionMode",
                value: "DESERIALIZE",
                isProperty: false
            }
                ],
        contextPage: "CTIPhone"
    };
    //console.log((new Date()).getTime() + " : Calling " + source + " data transform....");
    logmessage = (new Date()).getTime() + " : Calling " + source + " data transform....";
    SetConsoleLogMsg(logmessage,LogLevel);
    try {
        pega.api.ui.actions.runDataTransform(options);
        //console.log((new Date()).getTime() + " : Call " + source + " data transform success");
        logmessage = (new Date()).getTime() + " : Call " + source + " data transform success";
        SetConsoleLogMsg(logmessage,LogLevel);
    } catch (e) {
        //console.log((new Date()).getTime() + " : Error during " + source + " data transform: " + e);
        logmessage = (new Date()).getTime() + " : Error during " + source + " data transform: " + e;
        SetConsoleLogMsg(logmessage,ErrorLevel);
    }
}
//*** This code is copyright 2002-2016 by Gavin Kistner, !@phrogz.net
//*** It is covered under the license viewable at http://phrogz.net/JS/_ReuseLicense.txt
/*
@api - Function to custom the date format of string
@param $String$formatString - forma tto used
*/
Date.prototype.customFormat = function(formatString) {
    var YYYY, YY, MMMM, MMM, MM, M, DDDD, DDD, DD, D, hhhh, hhh, hh, h, mm, m, ss, s, ampm, AMPM, dMod, th;
    YY = ((YYYY = this.getFullYear()) + "").slice(-2);
    MM = (M = this.getMonth() + 1) < 10 ? ('0' + M) : M;
    MMM = (MMMM = ["January", "February", "March", "April", "May", "June", "July", "August", "September",
            "October",
        "November", "December"][M - 1]).substring(0, 3);
    DD = (D = this.getDate()) < 10 ? ('0' + D) : D;
    DDD = (DDDD = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][this.getDay()]).substring(
        0, 3);
    th = (D >= 10 && D <= 20) ? 'th' : ((dMod = D % 10) == 1) ? 'st' : (dMod == 2) ? 'nd' : (dMod == 3) ? 'rd' :
        'th';
    formatString = formatString.replace("#YYYY#", YYYY).replace("#YY#", YY).replace("#MMMM#", MMMM).replace("#MMM#",
        MMM).replace("#MM#", MM).replace("#M#", M).replace("#DDDD#", DDDD).replace("#DDD#", DDD).replace("#DD#",
        DD).replace("#D#", D).replace("#th#", th);
    h = (hhh = this.getHours());
    if (h == 0) h = 24;
    if (h > 12) h -= 12;
    hh = h < 10 ? ('0' + h) : h;
    hhhh = hhh < 10 ? ('0' + hhh) : hhh;
    AMPM = (ampm = hhh < 12 ? 'am' : 'pm').toUpperCase();
    mm = (m = this.getMinutes()) < 10 ? ('0' + m) : m;
    ss = (s = this.getSeconds()) < 10 ? ('0' + s) : s;
    return formatString.replace("#hhhh#", hhhh).replace("#hhh#", hhh).replace("#hh#", hh).replace("#h#", h).replace(
        "#mm#", mm).replace("#m#", m).replace("#ss#", ss).replace("#s#", s).replace("#ampm#", ampm).replace(
        "#AMPM#", AMPM);
};
/*
@api - Function calling a Data Transform to store data into the clipboard - Date time is used to store time passed into a status.
@param $String$dateTime - The datetime used when status is updated
@param $String$status - The status to know when datetime is used
*/
function setDateTimeVocalcom(dateTime, status) {
    var qDateTime = dateTime;
    var qStatus = status;
    var options = {
        name: "SetDateTimeVocalcom",
        parameters: [
            {
                name: "DateTime",
                value: qDateTime,
                isProperty: false
            },
            {
                name: "Status",
                value: qStatus,
                isProperty: false
            }
                ],
        contextPage: "CTIPhone"
    };
    pega.cti.API.Logger.info("Calling SetDatime data transform....");
    try {
        pega.api.ui.actions.runDataTransform(options);
        //console.log((new Date()).getTime() + " : Call SetDateTime data transform success");
        logmessage = (new Date()).getTime() + " : Call SetDateTime data transform success";
        SetConsoleLogMsg(logmessage,LogLevel);
    } catch (e) {
        //console.log((new Date()).getTime() + " : Error during SetDateTime data transform: " + e);
        logmessage = (new Date()).getTime() + " : Error during SetDateTime data transform: " + e;
        SetConsoleLogMsg(logmessage,ErrorLevel);
    }
}
/*
@api - Function calling a Data Transform to store data into the clipboard - manual campaign is send by vocalcom
@param $String$id - The id of manual campaign
@param $String$Name - The label of the manual campaing
*/
function setManualCampaigns(id, Name) {
    pega.cti.API.Logger.info("Manual Campaign Id::" + id + "---- Manual Campaign Name::::" + Name);
    var _mcId = id;
    var _mcName = Name;
    var options = {
        name: "SetManualCampaign",
        parameters: [
            {
                name: "campaignId",
                value: _mcId,
                isProperty: false
            },
            {
                name: "campaignName",
                value: _mcName,
                isProperty: false
            }
                ],
        contextPage: "CTIPhone"
    };
    try {
        pega.api.ui.actions.runDataTransform(options);
        //console.log((new Date()).getTime() + " : Call SetManualCampaign data transform success");
        logmessage = (new Date()).getTime() + " : Call SetManualCampaign data transform success";
        SetConsoleLogMsg(logmessage,LogLevel);
    } catch (e) {
        //console.log((new Date()).getTime() + " : Error during SetManualCampaign data transform: " + e);
        logmessage = (new Date()).getTime() + " : Error during SetManualCampaign data transform: " + e;
        SetConsoleLogMsg(logmessage,ErrorLevel);
    }
}
/*
@api - Function calling a Data Transform to store data into the clipboard - campaign is send by vocalcom
@param $String$id - The id of campaign
@param $String$Name - The label of the campaign
*/
function setCampaigns(id, Name) {
    pega.cti.API.Logger.info("Campaign Id::" + id + "---- Camapaign Name::::" + Name);
    var _mcId = id;
    var _mcName = Name;
    var options = {
        name: "SetCampaign",
        parameters: [
            {
                name: "campaignId",
                value: _mcId,
                isProperty: false
            },
            {
                name: "campaignName",
                value: _mcName,
                isProperty: false
            }
                ],
        contextPage: "CTIPhone"
    };
    try {
        pega.api.ui.actions.runDataTransform(options);
        //console.log((new Date()).getTime() + " : Call SetCampaign data transform success");
        logmessage = (new Date()).getTime() + " : Call SetCampaign data transform success";
        SetConsoleLogMsg(logmessage,LogLevel);
    } catch (e) {
        //console.log((new Date()).getTime() + " : Error during SetCampaign data transform: " + e);
        logmessage = (new Date()).getTime() + " : Error during SetCampaign data transform: " + e;
        SetConsoleLogMsg(logmessage,ErrorLevel);
    }
}
/*
@api - Function calling a Data Transform to store data into the db
@param $String$extension - The number of site id
*/
function setSoftPhoneDB(extension) {
    try {
        var oSafeUrl = new SafeURL("Cnam-CTI-Phone-UI.setSoftPhoneDB");
        if (extension !== ("" || undefined)) {
            oSafeUrl.put("extension", extension);
            //console.log((new Date()).getTime() + " : put extension in acitivity: " + extension)
            logmessage = (new Date()).getTime() + " : put extension in acitivity: " + extension;
            SetConsoleLogMsg(logmessage,LogLevel);
        }
        var callback = {
            success: function(oResponse) {
                //console.log((new Date()).getTime() + " : update database is done");
                logmessage = (new Date()).getTime() + " : update database is done";
                SetConsoleLogMsg(logmessage,LogLevel);
            },
            failure: function() {
                //console.log((new Date()).getTime() + " : error during update db");
                logmessage = (new Date()).getTime() + " : error during update db";
                SetConsoleLogMsg(logmessage,ErrorLevel);
            }
        };
        pega.u.d.asyncRequest('GET', oSafeUrl, callback);
        //console.log((new Date()).getTime() + " : Call setSoftPhoneDB activity");
        logmessage = (new Date()).getTime() + " : Call setSoftPhoneDB activity";
        SetConsoleLogMsg(logmessage,LogLevel);
    } catch (e) {
        //console.log((new Date()).getTime() + " : Error during setSoftPhoneDB activity: " + e);
        logmessage = (new Date()).getTime() + " : Error during setSoftPhoneDB activity: " + e;
        SetConsoleLogMsg(logmessage,ErrorLevel);
    }
}
/*
@api - Function calling a Data Transform to store data into the clipboard - manual campaign is send by vocalcom
@param $String$id - The id of manual campaign
@param $String$Name - The label of the manual campaing
*/
function removePage(id) {
    //console.log((new Date()).getTime() + " : rmove Page name::" + id);
    logmessage = (new Date()).getTime() + " : rmove Page name::" + id;
    SetConsoleLogMsg(logmessage,InfoLevel);
    var _mcId = id;
    var options = {
        name: "RemovePageCTI",
        parameters: [
            {
                name: "Id",
                value: _mcId,
                isProperty: false
            }
                ],
        contextPage: "CTIPhone"
    };
    try {
        pega.api.ui.actions.runDataTransform(options);
        //console.log((new Date()).getTime() + " : Call RemovePageCTI data transform success");
        logmessage = (new Date()).getTime() + " : Call RemovePageCTI data transform success";
        SetConsoleLogMsg(logmessage,LogLevel);
        
    } catch (e) {
        //console.log((new Date()).getTime() + " : Error during SetManualCampaign data transform: " + e);
        logmessage = (new Date()).getTime() + " : Error during SetManualCampaign data transform: " + e;
        SetConsoleLogMsg(logmessage,ErrorLevel);

    }
}
/*
@api - Function to manage Prefix when receive a call
@param $String$phoneNumber - The phoneNumber
@return $String$phoneNumber - The phoneNumber without prefix
*/
function managePhonePrefix(phoneNumber) {
    if (phoneNumber.startsWith("+33")) {
        phoneNumber = "0" + phoneNumber.substring(3, 12);
    } else if (phoneNumber.startsWith("+590590")) {
        phoneNumber = "0590" + phoneNumber.substring(7, 13)
    } else if (phoneNumber.startsWith("+594594")) {
        phoneNumber = "0594" + phoneNumber.substring(7, 13)
    } else if (phoneNumber.startsWith("+596596")) {
        phoneNumber = "0596" + phoneNumber.substring(7, 13)
    } else if (phoneNumber.startsWith("+269290")) {
        phoneNumber = "0269" + phoneNumber.substring(7, 13)
    } else if (phoneNumber.startsWith("+687687")) {
        phoneNumber = "0687" + phoneNumber.substring(7, 13)
    } else if (phoneNumber.startsWith("+689689")) {
        phoneNumber = "0689" + phoneNumber.substring(7, 13)
    } else if (phoneNumber.startsWith("+262262")) {
        phoneNumber = "0262" + phoneNumber.substring(7, 13)
    } else if (phoneNumber.startsWith("+508508")) {
        phoneNumber = "0508" + phoneNumber.substring(7, 13)
    } else if (phoneNumber.startsWith("+681681")) {
        phoneNumber = "0681" + phoneNumber.substring(7, 13)
    } else if (phoneNumber.startsWith("+262692")) {
        phoneNumber = "0692" + phoneNumber.substring(7, 13)
    } else if (phoneNumber === ("" || undefined)) {
        phoneNumber = "Appelant inconnu";
    }
    return phoneNumber;
}

function IsMemberExists(phonenumber, contactId){
    //console.log("Entered in Member Exists function.");
    logmessage = "Entered in Member Exists function.";
    SetConsoleLogMsg(logmessage,LogLevel);
    var oXmlHttp = returnXMLHttpObj();
    var _classname = "Cnam-CTI-Phone-UI";
    var _activityname = "GetMemberFromContact";
    var recentUrlval = new SafeURL(_classname+"."+_activityname);
    recentUrlval.put("pzPrimaryPageName", "CTIPhone");
    recentUrlval.put("phonenumber", phonenumber);
    recentUrlval.put("contactId", contactId);
    oXmlHttp.open("GET", recentUrlval.toURL(), false);
    oXmlHttp.send(null);
    var IsMemberExists = JSON.parse(oXmlHttp.responseText);
    //console.log("Member Exists function existed with value."+IsMemberExists);
    logmessage = "Member Exists function existed with value."+IsMemberExists;
    SetConsoleLogMsg(logmessage,LogLevel);
    return IsMemberExists;
}
function sethangupProcessing(hangupValue,hangupmsg){
  //console.log("Started function sethangup processing");
  logmessage = "Started function sethangup processing";
  SetConsoleLogMsg(logmessage,InfoLevel);
  var options = {
        name: "SetHangupState",
        parameters: [
            {
                name: "isHangupprocessing",
                value: hangupValue,
                isProperty: false
            },
            {
                name: "HangupMessage",
                value: hangupmsg,
                isProperty: false
            }
                ],
        contextPage: "CTIPhone"
    };
    try {
        pega.api.ui.actions.runDataTransform(options);
        setTimeout(function() {
                    // reload function 100ms after udpate CTIPhone page to be sure to not doing during propagation data
                    var recentSection = pega.u.d.getSectionByName("PegaCallControlPanelAdaptor");
                    pega.u.d.reloadSection(recentSection);
                    //console.log((new Date()).getTime() +" : *******reloaded PegaCallControlPanelAdaptor section for hangup processing******: "+hangupValue);
                    logmessage = (new Date()).getTime() +" : Reloaded PegaCallControlPanelAdaptor section: "+hangupValue
                    SetConsoleLogMsg(logmessage,LogLevel);
        }, 100);
         setTimeout(function() {
                    // reload function 100ms after udpate CTIPhone page to be sure to not doing during propagation data
                    var recentSection = pega.u.d.getSectionByName("PegaCallContainer");
                    pega.u.d.reloadSection(recentSection);
                    //console.log((new Date()).getTime() +" : *******reloaded PegaCallContainer section for hangup processing ******");
                    logmessage = (new Date()).getTime() +" : Reloaded PegaCallContainer section";
                    SetConsoleLogMsg(logmessage,LogLevel);
                }, 100);
        
    } catch (e) {
        //console.log((new Date()).getTime() + " : Error during hangupprocessing: " + e);
        logmessage = (new Date()).getTime() + " : Error during hangupprocessing: " + e;
        SetConsoleLogMsg(logmessage,ErrorLevel);
    }
  
  
}

function SendCTIMsgLogToPega(source,caller){
  var msgValue;
  //console.log("Sending CTI Log to Pega for the function:"+caller);
  logmessage = "Sending CTI Log to Pega for the function:"+caller;
  SetConsoleLogMsg(msgValue,LogLevel);
  var srcMsg = source;
  if (caller === "SendQualification"){
    msgValue = (new Date()).getTime() +" = Send Qualification has been initiated from:"+source;
    //console.log(msgValue);
    SetConsoleLogMsg(msgValue,LogLevel);
  }
  if (caller === "LogIn"){
    msgValue = (new Date()).getTime() +" = Log In has been initiated from:"+source;
    //console.log(msgValue);
    SetConsoleLogMsg(msgValue,LogLevel);
  }
  if (caller === "LogOut"){
    msgValue = (new Date()).getTime() +" = Log Out has been initiated from:"+source;
    //console.log(msgValue);
    SetConsoleLogMsg(msgValue,LogLevel);
  }
  if (caller === "Ready"){
    msgValue = (new Date()).getTime() +" = Ready :"+source;
    //console.log(msgValue);
    SetConsoleLogMsg(msgValue,LogLevel);
  }  if (caller === "StopRecord"){
    msgValue = (new Date()).getTime() +" = Stop record has been initiated :"+source;
    //console.log(msgValue);
    SetConsoleLogMsg(msgValue,LogLevel);
  }
  var buffermsgvalue = cBuffer.getStack();
  cBuffer.flush();
  console.info("Circular buffer objects"+buffermsgvalue)
  setListeCode(buffermsgvalue, "SetLogMessagesToList");
  //console.info("Circular buffer objects with json stringfy"+JSON.stringify(buffermsgvalue))
  /*var options = {
        name: "WriteCTILogInPega",
        parameters: [
            {
                name: "Message",
                value: msgValue,
                isProperty: false
            }
        ],
        contextPage: "CTIPhone"
    };
    try{
      pega.api.ui.actions.runDataTransform(options);
      //console.log((new Date()).getTime() + " : Write Log to the Pega from CTI has been success");
      logmessage = (new Date()).getTime() + " : Write Log to the Pega from CTI has been success";
      SetConsoleLogMsg(msgValue,InfoLevel);
    }catch (e){
      //console.log((new Date()).getTime() + " : Write Log to the Pega from CTI has been Failed");
      logmessage = (new Date()).getTime() + " : Write Log to the Pega from CTI has been Failed";
      SetConsoleLogMsg(logmessage,ErrorLevel);
    }*/
  
}

function SetConsoleLogMsg(message, level){
    if (level === "Info"){
        console.info(message);
    } else if (level === "Error"){
        message = "Error @ : "+ message;
        if(pushconsolelogstopega){
            WriteConsoleLogToBuffer(message, cBuffer)
            console.error("Pushed to pega :"+message);
        }
     }else if (level === "Log"){
        message = "Info @ : "+ message;
        if(pushconsolelogstopega){
            WriteConsoleLogToBuffer(message, cBuffer)
            console.log("Pushed to pega :"+message);
        }
    }
}

function WriteConsoleLogToBuffer(rawMessage, varBuffer) {
  varBuffer.push(rawMessage);    
}



function CircularBuffer(n) {
    this._array = new Array(n);
    this._position = 0;
}

function reorder(data, index) {
    return data.slice(index).concat(data.slice(0, index))
};

CircularBuffer.prototype.push = function(v) {
    this._array[this._position % this._array.length] = v;
    this._position = (this._position + 1) % this._array.length;
};

CircularBuffer.prototype.flush = function() {
    this._array = new Array(this._array.length);
    this.position = 0;
};

CircularBuffer.prototype.getStack = function() {

       var stack = reorder(this._array, this._position);
       //return 'CircularBufferStack ['+ this._array.filter(Boolean).join(',') + ']'
       var arr = stack.filter(Boolean);
       var listOfObjects = [];
       var obj = {};
       arr.forEach(
         function(element, index){ 
           var singleObj = {};
           //singleObj['index'] = index;
           singleObj['message'] = element;
           listOfObjects.push(singleObj);
         }
       );
       return listOfObjects

};
//static-content-hash-trigger-NON