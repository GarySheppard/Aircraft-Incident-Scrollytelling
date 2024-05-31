var svg = d3.select('#charts').select('svg');

// Get layout parameters
var svgWidth = +svg.attr('width');
var svgHeight = +svg.attr('height');

var padding = {t: 40, r: 40, b: 40, l: 40};

//Color scales
var colors1 = ['#ff9da7', '#9c755f', '#bab0ac', '#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#edc948', '#b07aa1'];
var colorScale1 = d3.scaleOrdinal(colors1);
var colors2 = ['#e15759', '#76b7b2', '#59a14f', '#edc948', '#b07aa1'];
var colorScale2 = d3.scaleOrdinal(colors2);
var colors3 = ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#edc948', '#b07aa1', '#ff9da7', '#9c755f', '#bab0ac'];
var colorScale3 = d3.scaleOrdinal(colors3);

//Vis scales
var circlesXScale = d3.scaleLinear()
    .range([0, svgWidth]);
var circlesYScale = d3.scaleLinear()
    .range([0, svgHeight]);

var countries = ['United States', 'United Kingdom', 'Japan', 'Indonesia', 'France', 'Australia', 'Brazil', 'Germany', 'Canada', 'China'];
var barsCountryXScale = d3.scaleBand()
    .domain(countries)
    .range([0, svgWidth - 60]);
var barsCountryYScale = d3.scaleLinear()
    .domain([0, 1150])
    .range([svgHeight - 60, 0]);

var carriers = ['Delta', 'American', 'United', 'Southwest', 'Continental', 'US Airways', 'Northwest', 'FedEx', 'America West', 'Alaska'];
var barsCarrierXScale = d3.scaleBand()
    .domain(carriers)
    .range([0, svgWidth - 60]);
var barsCarrierYScale = d3.scaleLinear()
    .domain([0, 105])
    .range([svgHeight - 60, 0]);

var manufacturers = ['Bombardier', 'Boeing', 'McDonnell Douglas', 'Embraer', 'Airbus'];
var barsManufacturerXScale = d3.scaleBand()
    .domain(manufacturers)
    .range([0, svgWidth - 60]);
var barsManufacturerYScale = d3.scaleLinear()
    .domain([0, 1250])
    .range([svgHeight - 60, 0]);

var phases = ['Cruise', 'Landing', 'Standing', 'Approach', 'Takeoff', 'Climb', 'Taxi', 'Other', 'Maneuvering', 'Unknown', 'Descent', 'Go-around'];
var barsPhaseXScale = d3.scaleBand()
    .domain(phases)
    .range([0, svgWidth - 60]);
var barsPhaseYScale = d3.scaleLinear()
    .domain([0, 205])
    .range([svgHeight - 60, 0]);

// Create group elements for appending chart elements
var gridG = svg.append('g')
    .attr('transform', 'translate('+[padding.l, padding.t]+')');
var countryG = svg.append('g')
    .attr('transform', 'translate('+[padding.l, padding.t]+')');
var carrierG = svg.append('g')
    .attr('transform', 'translate('+[padding.l, padding.t]+')');
var manufacturerG = svg.append('g')
    .attr('transform', 'translate('+[padding.l, padding.t]+')');
var phaseG = svg.append('g')
    .attr('transform', 'translate('+[padding.l, padding.t]+')');

//Indices for vis sections
var prevIndex = -1;
var activeIndex = 0;

//Array for the activation for each vis depending on section
var activateFunctions = [
    showNothing,
    showTotalIncidents,
    showFatalIncidents,
    showNonFatalIncidents,
    showNothing,
    showIncidentsByCountry,
    showIncidentsByCarrier,
    showIncidentsByManufacturer,
    showIncidentsByPhase
];

//Scroller functionality
var scroll = scroller()
    .container(d3.select('#main'));

scroll(d3.selectAll('.part'));

scroll.on('active', function(index) {
    d3.selectAll('.part')
        .transition().duration(200)
        .style('opacity', function(d,i) { return i == index ? 1 : 0.1; });

    activeIndex = index;
    var sign = (activeIndex - prevIndex) < 0 ? -1 : 1;
    var scrolledSections = d3.range(prevIndex + sign, activeIndex + sign, sign);
    scrolledSections.forEach(function (index) {
        activateFunctions[index]();
    });
    prevIndex = activeIndex;
})

d3.csv('incidents.csv', dataPreprocessor).then(function(dataset) {
    incidents = dataset;
    console.log(incidents);

    incidentsByCountry = d3.group(incidents, d => d['Country']);
    console.log(incidentsByCountry);

    incidentsByCarrier = d3.group(incidents, function(d) {
        if ((d['Air_Carrier']).substring(1,4) != 'DBA') {
            if ((d['Air_Carrier']).includes('DBA')) {
                return carrierProcessor((d['Air_Carrier']).replace(''+(d['Air_Carrier']).substring(((d['Air_Carrier']).indexOf('DBA')) - 2)+'', ''));
            } else {
                return carrierProcessor(d['Air_Carrier']);
            }
        }
    });
    console.log(incidentsByCarrier);

    incidentsByManufacturer = d3.group(incidents, d => d['Make']);
    console.log(incidentsByManufacturer);

    incidentsByPhase = d3.group(incidents, function(d) {
        return toTitleCase(d['Broad_Phase_of_Flight']);
    });
    console.log(incidentsByPhase);
    
    initializeVis();
});

function dataPreprocessor(row) {
    return {
        'Accident_Number': row['Accident_Number'],
        'Event_Date': row['Event_Date'],
        'Location': row['Location'],
        'Location Copy': row['Location Copy'],
        'Country': row['Country'],
        'Latitude': +row['Latitude'],
        'Longitude': +row['Longitude'],
        'Airport_Code': row['Airport_Code'],
        'Airport_Name': row['Airport_Name'],
        'Injury_Severity': row['Injury_Severity'],
        'Aircraft_Damage': row['Aircraft_Damage'],
        'Registration_Number': row['Registration_Number'],
        'Make': row['Make'],
        'Model': row['Model'],
        'Schedule': row['Schedule'],
        'Air_Carrier': row['Air_Carrier'],
        'Total_Fatal_Injuries': +row['Total_Fatal_Injuries'],
        'Total_Serious_Injuries': +row['Total_Serious_Injuries'],
        'Total_Uninjured': +row['Total_Uninjured'],
        'Weather_Condition': row['Weather_Condition'],
        'Broad_Phase_of_Flight': row['Broad_Phase_of_Flight']
    };
}

var bannedCarrierStuff = ['airlines', 'air', 'lines', 'industries', 'corporations', 'corporation', 'corp', 'co', 'company', 'linee', 'aeree', 'italiane', 'spa', 'commercial', 'flight', 'operations', 'international', 'int\'l', 'inc', 'llc', 'ltd', ',', '.'];
function carrierProcessor(str) {
    var splitStr = str.toLowerCase().split(' ');
    var parsedStr = [];
    for (var i = 0; i < splitStr.length; i++) {
        var word = splitStr[i];
        if (word.includes(',')) {
            word = word.replaceAll(',', '');
        }
        if (word.includes('.')) {
            word = word.replaceAll('.', '');
        }
        if (!(bannedCarrierStuff.includes(word))) {
            parsedStr.push(word);
        }
    }

    return parsedStr.map(function (token) {
        return (token.charAt(0).toUpperCase() + token.slice(1));
    }).join(' ');
}

function toTitleCase(str) {
    return str.toLowerCase().split(' ').map(function (token) {
        return (token.charAt(0).toUpperCase() + token.slice(1));
    }).join(' ');
}

function initializeVis() {
    //Grid vis
    var dotSize = 4;
    var dots = gridG.selectAll('.dot')
        .data(incidents, function(d) {
            return d['Accident_Number'];
        });
    var dotsEnter = dots.enter()
        .append('circle')
        .classed('dot', true);
    dots.merge(dotsEnter)
        .attr('r', dotSize)
        .attr('cx', function(d,i) {
            return (i % 60) * (dotSize + 5); 
        })
        .attr('cy', function(d,i) {
            return (Math.floor(i / 60)) * (dotSize + 5);
        })
        .style('fill', '#a7a7a7')
        .classed('fatal-dot', function(d) { return (d['Injury_Severity']).substring(0,5) == 'Fatal'; } )
        .classed('non-fatal-dot', function(d) { return d['Injury_Severity'] == 'Non-Fatal'; })
        .attr('opacity', 0.0);
    
    //Country bar vis
    var barsCountryXAxis = d3.axisBottom(barsCountryXScale)
        .tickFormat(function(d) {
            return d;
        });
    var barsCountryYAxis = d3.axisLeft(barsCountryYScale);

    countryG.append('g')
        .attr('class', 'x axis country')
        .attr('transform', 'translate('+(20)+','+(svgHeight - 60)+')')
        .call(barsCountryXAxis)
        .attr('opacity', 0.0);
    countryG.append('g')
        .attr('class', 'y axis country')
        .attr('transform', 'translate('+(12)+','+(0)+')')
        .call(barsCountryYAxis)
        .attr('opacity', 0.0);

    var barBandCountry = (svgWidth/countries.length) - 10;
    var barsCountry = countryG.selectAll('.bar.country')
        .data(countries);
    var barsCountryEnter = barsCountry.enter()
        .append('rect')
        .attr('class', 'bar country');
    barsCountry.merge(barsCountryEnter)
        .attr('x', function(d,i) {
            return (barsCountryXScale(d) + 22);
        })
        .attr('y', function(d){
            return (svgHeight - 60);
        })
        .attr('width', barBandCountry)
        .attr('height', function(d) {
            return 0;
        })
        .style('fill', function(d) {
            return colorScale1(d);
        })
        .attr('opacity', 0.0);

    //Carrier bar vis
    var barsCarrierXAxis = d3.axisBottom(barsCarrierXScale)
        .tickFormat(function(d) {
            return d;
        });
    var barsCarrierYAxis = d3.axisLeft(barsCarrierYScale);

    carrierG.append('g')
        .attr('class', 'x axis carrier')
        .attr('transform', 'translate('+(20)+','+(svgHeight - 60)+')')
        .call(barsCarrierXAxis)
        .attr('opacity', 0.0);
    carrierG.append('g')
        .attr('class', 'y axis carrier')
        .attr('transform', 'translate('+(12)+','+(0)+')')
        .call(barsCarrierYAxis)
        .attr('opacity', 0.0);

    var barBandCarrier = (svgWidth/carriers.length) - 10;
    var barsCarrier = carrierG.selectAll('.bar.carrier')
        .data(carriers);
    var barsCarrierEnter = barsCarrier.enter()
        .append('rect')
        .attr('class', 'bar carrier');
    barsCountry.merge(barsCarrierEnter)
        .attr('x', function(d) {
            return (barsCarrierXScale(d) + 22);
        })
        .attr('y', function(d){
            return (svgHeight - 60);
        })
        .attr('width', barBandCarrier)
        .attr('height', function(d) {
            return 0
        })
        .style('fill', function(d) {
            return colorScale1(d);
        })
        .attr('opacity', 0.0);

    //Manufacturer bar vis
    var barsManufacturerXAxis = d3.axisBottom(barsManufacturerXScale)
        .tickFormat(function(d) {
            return d;
        });
    var barsManufacturerYAxis = d3.axisLeft(barsManufacturerYScale);

    manufacturerG.append('g')
        .attr('class', 'x axis manufacturer')
        .attr('transform', 'translate('+(20)+','+(svgHeight - 60)+')')
        .call(barsManufacturerXAxis)
        .attr('opacity', 0.0);
    manufacturerG.append('g')
        .attr('class', 'y axis manufacturer')
        .attr('transform', 'translate('+(12)+','+(0)+')')
        .call(barsManufacturerYAxis)
        .attr('opacity', 0.0);

    var barBandManufacturer = (svgWidth/manufacturers.length) - 25;
    var barsManufacturer = manufacturerG.selectAll('.bar.country')
        .data(manufacturers);
    var barsManufacturerEnter = barsManufacturer.enter()
        .append('rect')
        .attr('class', 'bar manufacturer');
    barsManufacturer.merge(barsManufacturerEnter)
        .attr('x', function(d,i) {
            return (barsManufacturerXScale(d) + 26);
        })
        .attr('y', function(d){
            return (svgHeight - 60);
        })
        .attr('width', barBandManufacturer)
        .attr('height', function(d) {
            return 0;
        })
        .style('fill', function(d) {
            return colorScale2(d);
        })
        .attr('opacity', 0.0);

    //Flight phase bar vis
    var barsPhaseXAxis = d3.axisBottom(barsPhaseXScale)
        .tickFormat(function(d) {
            return d;
        });
    var barsPhaseYAxis = d3.axisLeft(barsPhaseYScale);

    phaseG.append('g')
        .attr('class', 'x axis phase')
        .attr('transform', 'translate('+(20)+','+(svgHeight - 60)+')')
        .call(barsPhaseXAxis)
        .attr('opacity', 0.0);
    phaseG.append('g')
        .attr('class', 'y axis phase')
        .attr('transform', 'translate('+(12)+','+(0)+')')
        .call(barsPhaseYAxis)
        .attr('opacity', 0.0);

    var barBandPhase = (svgWidth/phases.length) - 10;
    var barsPhase = phaseG.selectAll('.bar.phase')
        .data(phases);
    var barsPhaseEnter = barsPhase.enter()
        .append('rect')
        .attr('class', 'bar phase');
    barsPhase.merge(barsPhaseEnter)
        .attr('x', function(d,i) {
            return (barsPhaseXScale(d) + 23);
        })
        .attr('y', function(d){
            return (svgHeight - 60);
        })
        .attr('width', barBandPhase)
        .attr('height', function(d) {
            return 0;
        })
        .style('fill', function(d) {
            return colorScale3(d);
        })
        .attr('opacity', 0.0);
}

function showNothing() {
    console.log('Nothing');

    gridG.selectAll('.dot')
        .transition().duration(600)
        .attr('opacity', 0.0);

    countryG.selectAll('.axis')
        .transition().duration(400)
        .attr('opacity', 0.0);
    countryG.selectAll('.bar')
        .transition().duration(400)
        .attr('y', function(d){
            return (svgHeight - 60);
        })
        .attr('height', function(d) {
            return 0;
        })
        .attr('opacity', 0.0);
}

function showTotalIncidents() {
    console.log('Total Incidents');

    gridG.selectAll('.dot')
        .transition().duration(600)
        .style('fill', '#a7a7a7')
        .attr('opacity', 1.0);
}

function showFatalIncidents() {
    console.log('Fatal Incidents');

    gridG.selectAll('.dot')
        .transition().duration(600)
        .style('fill', '#a7a7a7');
    
    gridG.selectAll('.fatal-dot')
        .transition('fill-fatal').duration(600)
        .style('fill', '#FF0000')
        .attr('opacity', 1.0);
}

function showNonFatalIncidents() {
    console.log('Non-Fatal Incidents');

    gridG.selectAll('.dot')
        .transition().duration(600)
        .attr('opacity', 1.0);
    
    gridG.selectAll('.non-fatal-dot')
        .transition('fill-non-fatal').duration(600)
        .style('fill', '#FFA500')
        .attr('opacity', 1.0);
}

function showIncidentsByCountry() {
    console.log('Incidents by Country');

    carrierG.selectAll('.axis')
        .transition().duration(500)
        .attr('opacity', 0.0);
    carrierG.selectAll('.bar')
        .transition().duration(500)
        .attr('opacity', 0.0);
    
    countryG.selectAll('.axis')
        .transition().duration(500)
        .attr('opacity', 1.0);
    countryG.selectAll('.bar')
        .transition().duration(500)
        .attr('y', function(d){
            return (barsCountryYScale((incidentsByCountry.get(d)).length)) - 0.5;
        })
        .attr('height', function(d) {
            return (svgHeight - 60) - (barsCountryYScale((incidentsByCountry.get(d)).length));
        })
        .attr('opacity', 1.0);
}

function showIncidentsByCarrier() {
    console.log('Incidents by Carrier');

    countryG.selectAll('.axis')
        .transition().duration(500)
        .attr('opacity', 0.0);
    countryG.selectAll('.bar')
        .transition().duration(500)
        .attr('y', function(d){
            return (svgHeight - 60);
        })
        .attr('height', function(d) {
            return 0;
        })
        .attr('opacity', 0.0);

    manufacturerG.selectAll('.axis')
        .transition().duration(500)
        .attr('opacity', 0.0);
    manufacturerG.selectAll('.bar')
        .transition().duration(500)
        .attr('y', function(d){
            return (svgHeight - 60);
        })
        .attr('height', function(d) {
            return 0;
        })
        .attr('opacity', 0.0);

    carrierG.selectAll('.axis')
        .transition().duration(500)
        .attr('opacity', 1.0);
    carrierG.selectAll('.bar')
        .transition().duration(500)
        .attr('y', function(d){
            var newD = d;
            if (newD == 'FedEx') {
                newD = 'Federal Express';
            } else if (newD == 'US Airways') {
                newD = 'Us Airways';
            }
            return (barsCarrierYScale((incidentsByCarrier.get(newD)).length)) - 0.5;
        })
        .attr('height', function(d) {
            var newD = d;
            if (newD == 'FedEx') {
                newD = 'Federal Express';
            } else if (newD == 'US Airways') {
                newD = 'Us Airways';
            }
            return (svgHeight - 60) - (barsCarrierYScale((incidentsByCarrier.get(newD)).length));
        })
        .attr('opacity', 1.0);
}

function showIncidentsByManufacturer() {
    console.log('Incidents by Manufacturer');

    carrierG.selectAll('.axis')
        .transition().duration(500)
        .attr('opacity', 0.0);
    carrierG.selectAll('.bar')
        .transition().duration(500)
        .attr('y', function(d){
            return (svgHeight - 60);
        })
        .attr('height', function(d) {
            return 0;
        })
        .attr('opacity', 0.0);

    phaseG.selectAll('.axis')
        .transition().duration(500)
        .attr('opacity', 0.0);
    phaseG.selectAll('.bar')
        .transition().duration(500)
        .attr('y', function(d){
            return (svgHeight - 60);
        })
        .attr('height', function(d) {
            return 0;
        })
        .attr('opacity', 0.0);

    manufacturerG.selectAll('.axis')
        .transition().duration(500)
        .attr('opacity', 1.0);
    manufacturerG.selectAll('.bar')
        .transition().duration(500)
        .attr('y', function(d){
            return (barsManufacturerYScale((incidentsByManufacturer.get(d)).length)) - 0.5;
        })
        .attr('height', function(d) {
            return (svgHeight - 60) - (barsManufacturerYScale((incidentsByManufacturer.get(d)).length));
        })
        .attr('opacity', 1.0);
}

function showIncidentsByPhase() {
    console.log('Incidents by Phase');

    manufacturerG.selectAll('.axis')
        .transition().duration(500)
        .attr('y', function(d){
            return (svgHeight - 60);
        })
        .attr('height', function(d) {
            return 0;
        })
        .attr('opacity', 0.0);
    manufacturerG.selectAll('.bar')
        .transition().duration(500)
        .attr('y', function(d){
            return (svgHeight - 60);
        })
        .attr('height', function(d) {
            return 0;
        })
        .attr('opacity', 0.0);

    phaseG.selectAll('.axis')
        .transition().duration(500)
        .attr('opacity', 1.0);
    phaseG.selectAll('.bar')
        .transition().duration(500)
        .attr('y', function(d){
            return (barsPhaseYScale((incidentsByPhase.get(d)).length)) - 0.5;
        })
        .attr('height', function(d) {
            return (svgHeight - 60) - (barsPhaseYScale((incidentsByPhase.get(d)).length));
        })
        .attr('opacity', 1.0);
}