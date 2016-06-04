
var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";

var flickrAPIKey = "2505c8adcbd2b8253354a5ed118e0009";

var itmMeter;
var graphTooltip;

var uporabnik={};

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
function getSessionId(callback) {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        success: function(response){
            callback(response.sessionId);
        }
    });
}


/**
 * Generator podatkov za novega pacienta, ki bo uporabljal aplikacijo. Pri
 * generiranju podatkov je potrebno najprej kreirati novega pacienta z
 * določenimi osebnimi podatki (ime, priimek in datum rojstva) ter za njega
 * shraniti nekaj podatkov o vitalnih znakih.
 * @param stPacienta zaporedna številka pacienta (1, 2 ali 3)
 * @return ehrId generiranega pacienta
 */
function generirajPodatke(stPacienta, callback) {
    
    getSessionId(function(sessionId){
        var uporabnik = uporabniki[stPacienta-1];
    	
    	// Dodamo pacienta v bazo
    	var req = $.ajax({
    	    url: baseUrl + "/ehr",
    	    type: 'POST',
    	    headers: {"Ehr-Session": sessionId},
    	    success:function(data){
    	        var ehrId = data.ehrId;
    	        
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
                    headers: {"Ehr-Session": sessionId},
                    success: function (party) {
                        // TODO: Log success
                        //console.log(party);
                        // Dodamo meritve
                    	async.eachSeries(uporabnik.meritve, function(meritev, callback){
                    	    var podatki = {
                        	    "ctx/language": "en",
                        	    "ctx/territory": "SI",
                        	    "ctx/time": meritev.datum,
                        	    "vital_signs/height_length/any_event/body_height_length": meritev.visina,
                        	    "vital_signs/body_weight/any_event/body_weight": meritev.teza
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
                        	    headers: {"Ehr-Session": sessionId},
                        	    success: function (party) {
                                    // TODO: Log success
                                    // console.log(party);
                                    callback();
                                },
                                error: function(err) {
                                    // TODO: Log error
                                	console.log(err);
                                }
                        	});
                    	});
                    },
                    error: function(err) {
                        // TODO: Log error
                    	console.log(err);
                    }
                });
            
                callback(ehrId);
    	    }
    	});
    	
    });
    
}

function generirajNove(){
    var dropDown = document.getElementById("uporabniki-dropdown");
    dropDown.innerHTML = "";
    var a = [1,2,3];
    async.eachSeries(a,function(i,callback){
        var opt = document.createElement("option");
        var up = uporabniki[i-1];
        generirajPodatke(i, function(ehrId){
            opt.value= ehrId;
            opt.innerHTML = up.ime + " " + up.priimek;
    
            dropDown.appendChild(opt);
            $("#input-ehr-id").val(dropDown.value);
            callback();
        });
        
    });

        
}


function preberiOsvnovnePodatkeUporabnika(ehrId, callback) {
	
	
	getSessionId(function(sessionId){
	    $.ajax({
    		url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
    		type: 'GET',
    		headers: {"Ehr-Session": sessionId},
        	success: function (data) {
    			var party = data.party;
    			uporabnik.ime = party.firstNames;
    			uporabnik.priimek = party.lastNames;
    			uporabnik.datumRojstva = new Date(party.dateOfBirth);
    			uporabnik.spol = party.gender=="MALE"?"m":"f";
    			
    			$("#uporabnik-ime").text(party.firstNames + " " + party.lastNames);
    			$("#uporabnik-starost").text(izracunajStarost(party.dateOfBirth) + " let");
    			$("#uporabnik-datum-rojstva").text(d3.time.format("(%x)")(new Date(party.dateOfBirth)));
    			$("#uporabnik-spol").text(party.gender=="MALE"?"M":"Ž");
    			if(party.gender=="MALE")
    			    $("#uporabnik-spol").removeClass("spol-f").addClass("spol-m");
    			else
    			    $("#uporabnik-spol").removeClass("spol-m").addClass("spol-f");
    			// console.log(party);
    			
    			callback();
    		},
    		error: function(err) {
    			// TODO: Izpis napake
    		}
    	});
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
    getSessionId(function(sessionId){
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
    	    
    	    napolniTabelo(meritve);
    	    narisiGrafe(meritve);
    	    
    	    // ITM meter
    	    for(var i=0; i<meritve.length; i++){
    	        var m = meritve[i];
    	        if(m.visina != undefined && m.teza != undefined){
    	            var itm = m.teza.weight/((m.visina.height/100)*(m.visina.height/100));
        	        itmMeter.update(itm);
        	        loadGallery(itm);
        	        break;
    	        }
    	    }
    	});
    });
    
}

function napolniTabelo(meritve){
    var tabela = document.getElementById("meritve-tabela");
    tabela.innerHTML = "";
    for(var i=0; i<meritve.length; i++){
        var m = meritve[i];
        
        var trElm = document.createElement('tr');

        var datumTd = document.createElement('td');
        var datumText = document.createTextNode(d3.time.format("%e.%-m.%Y %H:%M")(new Date(m.datum)));
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
}

function narisiGrafe(meritve){
    
    var visinaGraphData = {
      "xScale": "time",
      "yScale": "linear",
      "type": "line-dotted",
      "main": [
        {
          "className": ".graf-data-primary",
          "data": [
    
          ]
        }
      ],
      "comp": [
          {
              "className": ".graph-median",
              "type": "line",
              "data" : [
            
                ]
          }
        ]
    }
    
    var tezaGraphData = {
      "xScale": "time",
      "yScale": "linear",
      "type": "line-dotted",
      "main": [
        {
          "className": ".graf-data-primary",
          "data": [
    
          ]
        }
      ],
      "comp": [
          {
              "className": ".graph-median",
              "type": "line",
              "data" : [
            
                ]
          }
        ]
    }
    
    pridobiPodatkePovprecja(meritve, function(stat){
        for(var i=0; i<meritve.length; i++){
            var m = meritve[i];
            
            var visinaPoint = {x:m.datum, y:m.visina.height};
            visinaGraphData.main[0].data.push(visinaPoint);
            
            var tezaPoint = {x:m.datum, y:m.teza.weight};
            tezaGraphData.main[0].data.push(tezaPoint);
        }
        for(var i=0; i<stat.visina.length; i++){
            var s = stat.visina[i];
            
            var datum = uporabnik.datumRojstva.getTime() + s.ageMonths*30*24*60*60*1000;
            var visinaPoint = {x:new Date(datum), y:s.M};
            visinaGraphData.comp[0].data.push(visinaPoint);
        }
        
        for(var i=0; i<stat.teza.length; i++){
            var s = stat.teza[i];
            
            var datum = uporabnik.datumRojstva.getTime() + s.ageMonths*30*24*60*60*1000;
            var tezaPoint = {x:new Date(datum), y:s.M};
            tezaGraphData.comp[0].data.push(tezaPoint);
        }
        
        var visinaGraph = new xChart('line', visinaGraphData, '#visina-graf', getGraphOptions("cm"));
        var tezaGraph = new xChart('line', tezaGraphData, '#teza-graf', getGraphOptions("kg"));
    });
    	    
    
}

function pridobiPodatkePovprecja(meritve, callback){
    
    $.when($.ajax("data/wtage.json"), $.ajax("data/statage.json")).done(function(a,b){
        var wtage = uporabnik.spol=="m"?a[0].male : a[0].female;
        var statage = uporabnik.spol=="m"?b[0].male : b[0].female;
        
        var zadnjaMeritev = new Date(meritve[0].datum);
        var prvaMeritev = new Date(meritve[meritve.length-1].datum);
        var ageMonthsStart = (prvaMeritev.getTime() - uporabnik.datumRojstva.getTime())/(1000*60*60*24*30);
        var ageMonthsEnd = (zadnjaMeritev.getTime() - uporabnik.datumRojstva.getTime())/(1000*60*60*24*30);
        
        var iStartW = -1;
        var iStartH = -1;
        var iEndW = -1;
        var iEndH = -1;
        
        for(var j=0; j<wtage.length; j++){
            var w = wtage[j];
            if(iStartW==-1 && w.ageMonths > ageMonthsStart){
                if(j!=0 && Math.abs(wtage[j-1].ageMonths-ageMonthsStart)<Math.abs(w.ageMonths-ageMonthsStart))
                    iStartW = j-1;
                else
                    iStartW = j;
            }
            
            if(iEndW==-1 && w.ageMonths > ageMonthsEnd){
                if(j!=0 && Math.abs(wtage[j-1].ageMonths-ageMonthsEnd)<Math.abs(w.ageMonths-ageMonthsEnd))
                    iEndW = j-1;
                else
                    iEndW = j;
            }
        }
        
        for(var j=0; j<statage.length; j++){
            var h = statage[j];
            if(iStartH==-1 && h.ageMonths > ageMonthsStart){
                if(j!=0 && Math.abs(statage[j-1].ageMonths-ageMonthsStart)<Math.abs(h.ageMonths-ageMonthsStart))
                    iStartH = j-1;
                else
                    iStartH = j;
            }
            
            if(iEndH==-1 && h.ageMonths > ageMonthsEnd){
                if(j!=0 && Math.abs(statage[j-1].ageMonths-ageMonthsEnd)<Math.abs(h.ageMonths-ageMonthsEnd))
                    iEndH = j-1;
                else
                    iEndH = j;
            }
        }
    
        var stat = {
            teza: wtage.slice(iStartW,iEndW+2),
            visina: statage.slice(iStartH,iEndH+2)
        }
        callback(stat);
    })
}

function getGraphOptions(enota){
    return {
            "dataFormatX": function (x) { return new Date(x) },
            "tickFormatX": function (x) { return d3.time.format('%e.%-m.%Y')(x); },
            "tickFormatY": function (x) { return x + " " + enota; },
            "mouseover": function (d, i) {
                $(this).tooltip({
                       container: 'body',
                       title: "<div>" + d3.time.format('%e.%-m.%Y %H:%M')(d.x) + "</div>" +
                                "<div><strong>" + d.y + " " + enota + "</strong></div>",
                       placement: 'top',
                       html: true
                     }).tooltip('show');
              }
	    };
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

function loadGallery(itm){
    var query = "";
    if(itm>25)
        query = "diet food plate";
    else if(itm>18)
        query = "meal food"
    else
        query = "junk fat food";
    $.ajax("https://api.flickr.com/services/rest/", {
	    data:{
	        method:"flickr.photos.search",
	        api_key: flickrAPIKey,
	        text:query,
	        format:"json",
	        nojsoncallback:"1",
	        sort: "relevance"
	    },
	    success: function(e){
	        var photos = e.photos.photo;
	        var gallery = document.getElementById("food-gallery");
	        gallery.innerHTML = "";
	        shuffle(photos);
	        for(var i=0; i<8; i++){
	            var photo = photos[i];
	            var src = "https://farm"+ photo.farm +".staticflickr.com/"+ photo.server +"/"+photo.id+"_"+photo.secret+"_q.jpg";
	            
	            var div = document.createElement("div");
	            $(div).addClass("col-md-3");
	            
	            
	            var a = document.createElement("a");
	            $(a).addClass("fancybox");
	            a.setAttribute("href", "https://farm"+ photo.farm +".staticflickr.com/"+ photo.server +"/"+photo.id+"_"+photo.secret+".jpg");
	            a.setAttribute("rel", "food");
	            
	            var img = document.createElement("img");
	            $(img).addClass("img-responsive");
	            img.setAttribute("src", src);

	            a.appendChild(img);
	            div.appendChild(a);
	            gallery.appendChild(div);
	        } 
	        
	        $(".fancybox").fancybox();
	    },
	    error: function(e){
	        console.log(e);
	    }
	});
}

function izberiUporabnika(){
    var ehrId = $("#input-ehr-id").val();
    uporabnik.ehrId = ehrId;
    preberiOsvnovnePodatkeUporabnika(ehrId, function(){
        preberiVisineInTezeUporabnika(ehrId);
    });
    
}

function dodajMeritev(){
    var visina = $("#form-meritev-visina").val();
    var teza = $("#form-meritev-teza").val();
    var datum = $("#form-meritev-datum").val();
    
    var valid = ($.isNumeric(visina) && $.isNumeric(teza) && !isNaN(new Date(datum).getTime()));
    var userActive = uporabnik.ehrId!=undefined;
    
    if(valid && userActive){
        visina = parseInt(visina);
        teza = parseInt(teza);
        datum = new Date(datum);
        
        
        var podatki = {
    	    "ctx/language": "en",
    	    "ctx/territory": "SI",
    	    "ctx/time": datum,
    	    "vital_signs/height_length/any_event/body_height_length": visina,
    	    "vital_signs/body_weight/any_event/body_weight": teza
    	};
    	var parametriZahteve = {
    	    ehrId: uporabnik.ehrId,
    	    templateId: 'Vital Signs',
    	    format: 'FLAT'
    	};
    	
    	getSessionId(function(sessionId){
    	    $.ajax({
        	    url: baseUrl + "/composition?" + $.param(parametriZahteve),
        	    headers: {"Ehr-Session": sessionId},
        	    type: 'POST',
        	    contentType: 'application/json',
        	    data: JSON.stringify(podatki),
        	    success: function (party) {
                    // TODO: Log success
                    // console.log(party);
                    preberiVisineInTezeUporabnika(uporabnik.ehrId);
                },
                error: function(err) {
                    // TODO: Log error
                	console.log(err);
                }
        	});
    	});
        
    }
    else{
        // TODO: Error
    }
}

$(document).ready(function(){
   $(".generate-data").click(generirajNove); 
   $("#btn-select-user").click(izberiUporabnika);
   $("#form-meritev-submit").click(dodajMeritev);
   $("#btn-itm-more").click(function(e){
       e.preventDefault();
      $("#itm-info").slideToggle(300); 
   });
   $("#uporabniki-dropdown").change(function(){ $("#input-ehr-id").val( $(this).val() ) });
   
   itmMeter = gauge('#itm-meter', {
		size: 220,
		clipWidth: 220,
		clipHeight: 120,
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
	
    $("#graph-tabs a").click(function(){
        console.log("FIRED");
        window.dispatchEvent(new Event('resize'));
    })
});

// HELPERS

function shuffle(a) {
    var j, x, i;
    for (i = a.length; i; i -= 1) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
}