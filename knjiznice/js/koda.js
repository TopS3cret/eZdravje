
var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";


var uporabniki =  [
    {
        ime: "Matej",
        priimek: "Žalec",
        datumRojstva: new Date("2003-04-17"),
        meritve: [
            {
                izvajalec: "Matej Žalec",
                datum: new Date("2015-06-10 16:00:00"),
                visina: 152,
                teza: 60.4
            },
            {
                izvajalec: "Matej Žalec",
                datum: new Date("2016-04-14 16:00:00"),
                visina: 161.8,
                teza: 68.3
            },
            {
                izvajalec: "Matej Žalec",
                datum: new Date("2016-05-26 16:00:00"),
                visina: 162,
                teza: 69.1
            }
        ]
    },
    {
        ime: "Job",
        priimek: "Rožanec",
        datumRojstva: new Date("2009-07-23"),
        meritve: [
            {
                izvajalec: "Tina Rožanec",
                datum: new Date("2015-06-10 16:00:00"),
                visina: 120,
                teza: 38,
            },
            {
                izvajalec: "Tilen Rožanec",
                datum: new Date("2016-04-14 16:00:00"),
                visina: 145,
                teza: 44
            },
            {
                izvajalec: "Tilen Rožanec",
                datum: new Date("2016-05-26 16:00:00"),
                visina: 146,
                teza: 45
            }
        ]
    },
    {
        ime: "Lori",
        priimek: "Bregar",
        datumRojstva: new Date("2007-09-13"),
        meritve: [
            {
                izvajalec: "Tonja Bregar",
                datum: new Date("2015-06-10 16:00:00"),
                visina: 145,
                teza: 60.4
            },
            {
                izvajalec: "Hinko Bregar",
                datum: new Date("2016-04-14 16:00:00"),
                visina: 146,
                teza: 68.3
            },
            {
                izvajalec: "Tonja Bregar",
                datum: new Date("2016-05-26 16:00:00"),
                visina: 146,
                teza: 69.1
            }
        ]
    }
    
    ];



/**
 * Prijava v sistem z privzetim uporabnikom za predmet OIS in pridobitev
 * enolične ID številke za dostop do funkcionalnosti
 * @return enolični identifikator seje za dostop do funkcionalnosti
 */
function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}


/**
 * Generator podatkov za novega pacienta, ki bo uporabljal aplikacijo. Pri
 * generiranju podatkov je potrebno najprej kreirati novega pacienta z
 * določenimi osebnimi podatki (ime, priimek in datum rojstva) ter za njega
 * shraniti nekaj podatkov o vitalnih znakih.
 * @param stPacienta zaporedna številka pacienta (1, 2 ali 3)
 * @return ehrId generiranega pacienta
 */
function generirajPodatke(stPacienta) {
    
    var sessionId = getSessionId();
    
    var uporabnik = uporabniki[stPacienta-1];

	$.ajaxSetup({
	    headers: {"Ehr-Session": sessionId}
	});
	
	// Dodamo pacienta v bazo
	var req = $.ajax({
	    url: baseUrl + "/ehr",
	    type: 'POST',
	    async: false
	});
	
	var ehrId = req.responseJSON.ehrId;

    var partyData = {
        firstNames: uporabnik.ime,
        lastNames: uporabnik.priimek,
        dateOfBirth: uporabnik.datumRojstva,
        partyAdditionalInfo: [{key: "ehrId", value: ehrId}]
    };
    $.ajax({
        url: baseUrl + "/demographics/party",
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(partyData),
        success: function (party) {
            // TODO: Log success
            console.log(party);
        },
        error: function(err) {
            // TODO: Log error
        	console.log(err);
        }
    });
    
	// Dodamo meritve
	for(var i=0; i<uporabnik.meritve.length; i++){
	    var meritev = uporabnik.meritve[i];
    	var podatki = {
    		// Struktura predloge je na voljo na naslednjem spletnem naslovu:
            // https://rest.ehrscape.com/rest/v1/template/Vital%20Signs/example
    	    "ctx/language": "en",
    	    "ctx/territory": "SI",
    	    "ctx/time": meritev.datum,
    	    "vital_signs/height_length/any_event/body_height_length": meritev.visina,
    	    "vital_signs/body_weight/any_event/body_weight": meritev.teza
    	   	//"vital_signs/body_temperature/any_event/temperature|magnitude": telesnaTemperatura,
    	    //"vital_signs/body_temperature/any_event/temperature|unit": "°C",
    	};
    	var parametriZahteve = {
    	    ehrId: ehrId,
    	    templateId: 'Vital Signs',
    	    format: 'FLAT',
    	    committer: meritev.izvajalec
    	};
    	$.ajax({
    	    url: baseUrl + "/composition?" + $.param(parametriZahteve),
    	    type: 'POST',
    	    contentType: 'application/json',
    	    data: JSON.stringify(podatki),
    	    success: function (party) {
                // TODO: Log success
                console.log(party);
            },
            error: function(err) {
                // TODO: Log error
            	console.log(err);
            },
            async: false
    	});
	}

    // TODO: Potrebno implementirati

    return ehrId;
}

function generirajNove(){
    var dropDown = document.getElementById("uporabniki-dropdown");
    dropDown.innerHTML = "";
    for(var i=1; i<=3; i++){
        var opt = document.createElement("option");
        var up = uporabniki[i-1];
        var ehrId = generirajPodatke(i);
        opt.value= ehrId;
        opt.innerHTML = up.ime + " " + up.priimek + " ("+ehrId+")";

        dropDown.appendChild(opt);
    }
}

$(document).ready(function(){
   $(".generate-data").click(generirajNove); 
});