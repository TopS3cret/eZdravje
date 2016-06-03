
var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";


var uporabniki =  [
    {
        ime: "Matej",
        priimek: "Žalec",
        datumRojstva: new Date("2003-04-17"),
        spol: "MALE",
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
        spol: "MALE",
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
        spol: "FEMALE",
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
        gender: uporabnik.spol,
        partyAdditionalInfo: [{key: "ehrId", value: ehrId}]
    };
    $.ajax({
        url: baseUrl + "/demographics/party",
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(partyData),
        success: function (party) {
            // TODO: Log success
            //console.log(party);
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
                // console.log(party);
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


function preberiOsvnovnePodatkeUporabnika(ehrId) {
	var sessionId = getSessionId();

	$.ajax({
		url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
		type: 'GET',
		headers: {"Ehr-Session": sessionId},
    	success: function (data) {
			var party = data.party;
			$("#uporabnik-ime").text(party.firstNames + " " + party.lastNames);
			$("#uporabnik-starost").text(izracunajStarost(party.dateOfBirth) + " let");
			$("#uporabnik-spol").text(party.gender=="MALE"?"M":"Ž");
			// console.log(party);
		},
		error: function(err) {
			// TODO: Izpis napake
		}
	});
}

function izracunajStarost(datumRojstva){
    var rojstvo = new Date(datumRojstva);
    var danes = new Date();
    var starost = danes.getFullYear() - rojstvo.getFullYear(); 
    
    if (danes.getMonth() < rojstvo.getMonth() - 1)
        starost--;
    
    if (rojstvo.getMonth() - 1 == danes.getMonth() && danes.getDate() < rojstvo.getDate)
        starost--;
        
    return starost;
}

function preberiVisineInTezeUporabnika(ehrId){
    var sessionId = getSessionId();
    $.when($.ajax({
  	    url: baseUrl + "/view/" + ehrId + "/" + "height",
	    type: 'GET',
	    headers: {"Ehr-Session": sessionId},
	    }), 
	    $.ajax({
  	    url: baseUrl + "/view/" + ehrId + "/" + "weight",
	    type: 'GET',
	    headers: {"Ehr-Session": sessionId},
	    })
	).done(function(a,b){
	    var visine = a[0];
	    var teze = b[0];
	    var meritve = zdruziVisineInTeze(visine, teze);
	    
	    var visinaGraphData = {
          "xScale": "time",
          "yScale": "linear",
          "type": "line-dotted",
          "tickHintX": 5,
          "tickFormatX":function(e){
            var d = new Date(e);
            return d.getFullYear()+ "-" +d.getMonth()+"-"+d.getDate();
          },
          "main": [
            {
              "className": ".pizza",
              "data": [

              ]
            }
          ],
        }
        
        var tezaGraphData = {
          "xScale": "time",
          "yScale": "linear",
          "type": "line-dotted",
          "tickHintX": 5,
          "tickFormatX":function(e){
            var d = new Date(e);
            return d.getFullYear()+ "-" +d.getMonth()+"-"+d.getDate();
          },
          "main": [
            {
              "className": ".pizza",
              "data": [

              ]
            }
          ],
        }
	    
	    var tabela = document.getElementById("meritve-tabela");
	    tabela.innerHTML = "";
	    for(var i=0; i<meritve.length; i++){
            var m = meritve[i];
            
            var visinaPoint = {x:new Date(meritve[i].datum), y:meritve[i].visina.height};
            visinaGraphData.main[0].data.push(visinaPoint);
            
            var tezaPoint = {x:new Date(meritve[i].datum), y:meritve[i].teza.weight};
            tezaGraphData.main[0].data.push(tezaPoint);
            
            var trElm = document.createElement('tr');
    
            var datumTd = document.createElement('td');
            var datumText = document.createTextNode(m.datum);
            datumTd.appendChild(datumText);
    
            var visinaTd = document.createElement('td');
            var visinaText = document.createTextNode(m.visina.height + " " + m.visina.unit);
            visinaTd.appendChild(visinaText);
            
            var tezaTd = document.createElement('td');
            var tezaText = document.createTextNode(m.teza.weight + " " + m.teza.unit);
            tezaTd.appendChild(tezaText);
            
            trElm.appendChild(datumTd); 
            trElm.appendChild(visinaTd);
            trElm.appendChild(tezaTd);
    
            tabela.appendChild(trElm);
	    }
	    
	    var visinaGraph = new xChart('line', visinaGraphData, '#visina-graf');
	    var tezaGraph = new xChart('line', tezaGraphData, '#teza-graf');
	    
	    // ITM meter
	    for(var i=0; i<meritve.length; i++){
	        var m = meritve[i];
	        if(m.visina != undefined && m.teza != undefined){
    	        itmMeter.update(m.teza.weight/((m.visina.height/100)*(m.visina.height/100)));
    	        break;
	        }
	    }
	});
}

function zdruziVisineInTeze(visine, teze){
    var meritve={};
    for(var i=0; i<visine.length; i++){
        var v = visine[i];
        if(meritve[v.time]===undefined)
            meritve[v.time] = {}
        meritve[v.time].visina = v;
    }
    for(var i=0; i<teze.length; i++){
        var t = teze[i];
        if(meritve[t.time]===undefined)
            meritve[t.time] = {}
        meritve[t.time].teza = t;
    }
    
    var arr_meritve = [];
    // Novejše najprej
    var keys = Object.keys(meritve).sort().reverse();
    for(var i=0; i<keys.length; i++){
        var m = meritve[keys[i]];
        //m.datum = datumToString(new Date(keys[i]));
        m.datum = keys[i];
        arr_meritve.push(m);
    }
    
    return arr_meritve;
}

// TODO: Če bo čas
function datumToString(date){
    return date.getDate() + "." +date.getMonth() + "." + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes();
}

function izberiUporabnika(){
    var ehrId = $("#uporabniki-dropdown").val();
    preberiOsvnovnePodatkeUporabnika(ehrId);
    preberiVisineInTezeUporabnika(ehrId);
}

$(document).ready(function(){
   $(".generate-data").click(generirajNove); 
   $("#btn-select-user").click(izberiUporabnika);
   
   itmMeter = gauge('#itm-meter', {
		size: 250,
		clipWidth: 250,
		clipHeight: 160,
		ringWidth: 60,
		maxValue: 40,
		transitionMs: 4000,
		arcColorFn: function(v){
		    if(v<=0.5)
		        return d3.interpolateHsl(d3.rgb('#E30505'), d3.rgb('#3CD117'))(v*2);
		    else
		        return d3.interpolateHsl(d3.rgb('#3CD117'),d3.rgb('#E30505'))((v-0.40)*2);
		},
		majorTicks: 7
	});
	itmMeter.render();
});