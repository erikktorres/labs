/*
== BSD2 LICENSE ==
Copyright (c) 2014, Tidepool Project

This program is free software; you can redistribute it and/or modify it under
the terms of the associated License, which is identical to the BSD 2-Clause
License as published by the Open Source Initiative at opensource.org.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
FOR A PARTICULAR PURPOSE. See the License for more details.

You should have received a copy of the License along with this program; if
not, you can obtain one from Tidepool Project at tidepool.org.
== BSD2 LICENSE ==
*/
var data = {};
var sections = {};

var waiting = function() {
	$('body').css('cursor', 'wait');
};
var clearWaiting = function() {
	$('body').css('cursor', 'default');
};

var drawLake = function(lake) {
	var id = 'pool_' + lake.start.time;
	var template = _.template("<li id='<%= id%>'><div class='pool_date'><%= start %></div><div class='pool_close'>x</div><div class='clear'></div></li>");

	$('.search_results_items').append(template({id: id, start: moment(lake.start.time).format('dddd MMMM Do YYYY h:mma')}));

	graph(id, lake.readings, {
		height: 250,
		sectionHeight: 175, 
		width: 570
	});
};

var search = function(readings, range) {
	$('.search_results_summary').text('searching...');
	$('.search_results_items').html('');

	var searchOptions = {
		days: sections.searchCriteria.filters.days.selected() ? sections.searchCriteria.filters.days.value() : null,
		timeOfDayRange: sections.searchCriteria.filters.timeOfDay.selected() ? sections.searchCriteria.filters.timeOfDay.value() : null
	};

	if(sections.searchCriteria.filters.carbs.selected() && !sections.searchCriteria.filters.glucose.selected()) {	
		lakes = filterOne.carbsOnly(readings, sections.searchCriteria.filters.carbs.value(), searchOptions.days, searchOptions.timeOfDayRange);	

	} else if(!sections.searchCriteria.filters.carbs.selected() && sections.searchCriteria.filters.glucose.selected()) {
		
		lakes = filterOne.glucoseOnly(readings, sections.searchCriteria.filters.glucose.value(), 3, searchOptions.days, searchOptions.timeOfDayRange);	

	} else if(sections.searchCriteria.filters.carbs.selected() && sections.searchCriteria.filters.glucose.selected()) {
		var options = {
			days: searchOptions.days,
			timeOfDayRange: searchOptions.timeOfDayRange,
			carbRange: sections.searchCriteria.filters.carbs.value(),
			glucoseRange: sections.searchCriteria.filters.glucose.value(),
			glucoseOccurence: 3
		};

		lakes = filterOne.carbsAndGlucose(readings, options);	

		console.log('carbsAndGlucose', lakes);

	} else if(sections.searchCriteria.filters.bolus.selected() && !sections.searchCriteria.filters.carbs.selected() && !sections.searchCriteria.filters.glucose.selected())	{
		lakes = filterOne.bolusOnly(readings, sections.searchCriteria.filters.bolus.value(), searchOptions.days, searchOptions.timeOfDayRange);
	//} else if bolus and carbs{
	//} else if bolus and glucose{
	} else {
		$('.search_results_summary').text('No results :(. Try again.');
		return;
	}

	lakes.reverse();

	lakes = _.uniq(lakes, function(l) {
		return l.start.id;
	});

	var count = 0;
	var shown = 20;

	for(var i in lakes) {
		drawLake(lakes[i]);
		
		if(count++ == shown) {
			break;
		} 
	}
	
	$('.search_results_summary').text(lakes.length + ' results found. ' + count + ' shown.');
};

var openSection = function(el) {
  $(el).addClass('arrow_opened');
  $(el).removeClass('arrow_closed');
  $(el).siblings('.search_panel_sections_content').show();
};

var closeSection = function(el) {
	$(el).removeClass('arrow_opened');
  $(el).addClass('arrow_closed');
  $(el).siblings('.search_panel_sections_content').hide();
};

var openCriteriaSection = function(el) {
	$(el).addClass('arrow_opened');
  $(el).removeClass('arrow_closed');
  $(el).siblings('.search_panel_sections_filter_criteria_content').show();
};

var closeCriteriaSection = function(el) {
	$(el).removeClass('arrow_opened');
  $(el).addClass('arrow_closed');
  $(el).siblings('.search_panel_sections_filter_criteria_content').hide();
};

var initSections = function() {
	sections.savedSearches = {
		el: $('.search_panel_sections_saved'),
		open: function() {
			openSection(sections.savedSearches.el.find('.search_panel_sections_header'));
		},
		close: function() {
			closeSection(sections.savedSearches.el.find('.search_panel_sections_header'));
		}
	};

	sections.searchCriteria = {
		el: $('.search_panel_sections_filter'),
		open: function() {
			openSection(sections.savedSearches.el.find('.search_panel_sections_header'));
		},
		close: function() {
			closeSection(sections.savedSearches.el.find('.search_panel_sections_header'));
		},
		filters: {
			glucose: {
				el: $('.criteria_glucose'),
				header: function() {
					return sections.searchCriteria.filters.glucose.el.find('.search_panel_sections_filter_criteria_header');
				},
				open: function() {
					openCriteriaSection(sections.searchCriteria.filters.glucose.header());
				},
				close: function() {
					closeCriteriaSection(sections.searchCriteria.filters.glucose.header());
				},
				selected: function() {
					return sections.searchCriteria.filters.glucose.header().hasClass('arrow_opened');
				},
				value: function() {
					var range = $('.criteria_glucose .search_panel_sections_filter_criteria_ranges_range').attr('value').split(';');

					return range.map(function(r) { return parseInt(r)});
				}
			},
			carbs: {
				el: $('.criteria_carbs'),
				header: function() {
					return sections.searchCriteria.filters.carbs.el.find('.search_panel_sections_filter_criteria_header');
				},
				open: function() {
					openCriteriaSection(sections.searchCriteria.filters.carbs.header());
				},
				close: function() {
					closeCriteriaSection(sections.searchCriteria.filters.carbs.header());
				},
				selected: function() {
					return sections.searchCriteria.filters.carbs.header().hasClass('arrow_opened');
				},
				value: function() {
					return $('.criteria_carbs .search_panel_sections_filter_criteria_ranges_range').attr('value').split(';');
				}
			},
			bolus: {
				el: $('.criteria_bolus'),
				header: function() {
					return sections.searchCriteria.filters.bolus.el.find('.search_panel_sections_filter_criteria_header');
				},
				open: function() {
					openCriteriaSection(sections.searchCriteria.filters.bolus.header());
				},
				close: function() {
					closeCriteriaSection(sections.searchCriteria.filters.bolus.header());
				},
				selected: function() {
					return sections.searchCriteria.filters.bolus.header().hasClass('arrow_opened');
				},
				value: function() {
					var selected = $('.criteria_bolus').find('.choice_selected');

					if(!selected.length) {
						return [];
					}

					var days = [];

					selected.each(function(i, el) {
						days.push($(el).attr('data'));
					})

					return days;
				}
			},
			timeOfDay: {
				el: $('.criteria_timeOfDay'),
				header: function() {
					return sections.searchCriteria.filters.timeOfDay.el.find('.search_panel_sections_filter_criteria_header');
				},
				open: function() {
					openCriteriaSection(sections.searchCriteria.filters.timeOfDay.header());
				},
				close: function() {
					closeCriteriaSection(sections.searchCriteria.filters.timeOfDay.header());
				},
				selected: function() {
					return sections.searchCriteria.filters.timeOfDay.header().hasClass('arrow_opened');
				},
				value: function() {
					var times = $('.criteria_timeOfDay .search_panel_sections_filter_criteria_ranges_range').attr('value').split(';').map(function(r) { return parseInt(r)});

					return times.map(function(t) {
						/*if(t >= 18) {
							t = t - 18;
						} else {
							t = t + 6;
						}*/

						return t * 1000 * 60 * 60;
					}).sort();
				}
			},
			days: {
				el: $('.criteria_days'),
				header: function() {
					return sections.searchCriteria.filters.days.el.find('.search_panel_sections_filter_criteria_header');
				},
				open: function() {
					openCriteriaSection(sections.searchCriteria.filters.days.header());
				},
				close: function() {
					closeCriteriaSection(sections.searchCriteria.filters.days.header());
				},
				selected: function() {
					return sections.searchCriteria.filters.days.header().hasClass('arrow_opened');
				},
				value: function() {
					var selected = $('.criteria_days').find('.choice_selected');

					if(!selected.length) {
						return;
					}

					var days = [];

					selected.each(function(i, el) {
						days.push(parseInt($(el).attr('value')));
					})

					return days;
				}
			}
		}
	};
};

var careTeamlistItem = function(user) {
	return function() {
		console.log('click', user);
		waiting();
		fetchReadings(user.userid, loadSonarSearchInterface);

		$('.navbar-patient-name').html(user.firstName + ' ' + user.lastName);
	}
};

var start = function(teams) {
	$('.login').hide();
	$('.careteam').show();
	$('.navbar-user-name').html(teams.user.firstName + ' ' + teams.user.lastName);

	var userli = $('<li class="people-list-item list-group-item js-person people-list-item-with-link"><a class="people-list-item-link list-group-item-link"><div class="people-list-item-name">Howard Look</div></a></li>');

	userli.find('.people-list-item-name').html(teams.user.firstName + ' ' + teams.user.lastName);
	userli.click(careTeamlistItem(teams.user));

	$('.js-patients-user .people-list').append(userli);

	for(var i in teams.members) {
		var member = teams.members[i];
		var userli = $('<li class="people-list-item list-group-item js-person people-list-item-with-link"><a class="people-list-item-link list-group-item-link"><div class="people-list-item-name">Howard Look</div></a></li>');

		userli.find('.people-list-item-name').html(member.firstName + ' ' + member.lastName);		
		
		userli.click(careTeamlistItem(member));

		$('.js-patients-shared .people-list').append(userli);
	}
};

var fetchReadings = function(userid, callback) {
	$.get('/userData/' + userid + '?token=' + data.loggedUser.token, callback).fail(function() {
		alert('error fetching readings');
		console.log('error fetching readings', arguments);
	});
};

var loadSonarSearchInterface = function(readings) {
	clearWaiting();
	console.log('loadSonarSearchInterface', readings);

	readings = normalizeBlip(readings);

	readings = readings.map(function(r) {
		r.date = new Date(r.date);

		return r;
	});

	data.readings = readings;

	$('.search_panel_sections_header').click(function() {
    if($(this).hasClass('arrow_opened')) {
      closeSection(this);    
    } else {
  		openSection(this);
    }
	});

	$('.search_panel_sections_filter_criteria_header').click(function() {
		if(!$(this).parent().hasClass('active')) return;

    if($(this).hasClass('arrow_opened')) {
    	closeCriteriaSection(this);
    } else {
      openCriteriaSection(this);
    }
	});

	initSections();

	sections.savedSearches.close();
	//sections.searchCriteria.filters.glucose.close();
	sections.searchCriteria.filters.bolus.close();
	sections.searchCriteria.filters.carbs.close();
	sections.searchCriteria.filters.timeOfDay.close();
	sections.searchCriteria.filters.days.close();

	$('.search_panel_sections_filter_search').click(function() {
		waiting();
		search(readings, sections.searchCriteria.filters.glucose.value());
		clearWaiting();
	});

	range('criteria_glucose', {
		start: 10,
		end: 300,
		maxPostfix: '+',
		step: 5
	}, [
		{start: 10, end: 40, title: 'Very low'},
		{start: 40, end: 80, title: 'Low'},
		{start: 80, end: 180, title: 'In range'},
		{start: 180, end: 250, title: 'High'},
		{start: 250, end: 300, title: 'Very High'}
	]);

	range('criteria_carbs', {
		start: 0,
		end: 150,
		step: 5,
		width: 300,
		maxPostfix: '+'
	}, [
		{start: 0, end: 25, title: 'Small'},
		{start: 25, end: 75, title: 'Medium'},
		{start: 75, end: 150, title: 'Large'},
	]);

	$('.criteria_carbs_none').click(function() {
		$('.criteria_carbs').find('.search_panel_sections_filter_criteria_ranges_range').ionRangeSlider('update', {
			from: 0,
			to: 0
		});
	});

	range('criteria_timeOfDay', {
		//values: ['6am','7am','8am','9am','10am','11am','12pm','1pm','2pm','3pm','4pm','5pm','6pm','7pm','8pm','9pm','10pm','11pm','12am','1am','2am','3am','4am','5am','6am']
		values: ['12am','1am','2am','3am','4am','5am','6am','7am','8am','9am','10am','11am','12pm','1pm','2pm','3pm','4pm','5pm','6pm','7pm','8pm','9pm','10pm','11pm','12am']
	}, [
		{start: 0, end: 6, title: 'Night'},
		{start: 6, end: 12, title: 'Morning'},
		{start: 12, end: 18, title: 'Afternoon'},
		{start: 18, end: 24, title: 'Evening'}
	]);

	$(document).keyup(function(e) {
  	if (e.keyCode == 27) {
  		$('.search_panel_sections_filter_save_input').hide();
  		$('.search_panel_sections_filter_save_label').show();
  	}   // esc
	});
	
	$('.search_panel_sections_filter_save_label').click(function() {

		$('.search_panel_sections_filter_save_input').show();
		$('.search_panel_sections_filter_save_input > input').val();
		$('.search_panel_sections_filter_save_input > input').focus();
  	$('.search_panel_sections_filter_save_label').hide();
	});

	$('.search_panel_sections_filter_criteria_choices > ul > li').click(function() {
		if( $(this).hasClass('choice_selected') ) {
			$(this).removeClass('choice_selected');	
			$(this).addClass('choice_notSelected');	
		} else {
			$(this).addClass('choice_selected');	
			$(this).removeClass('choice_notSelected');	
		}	
	});

	$('.search_panel_sections_filter_criteria_glucoseTrends_arrow > li').click(function() {
		if( $(this).hasClass('choice_selected_trend') ) {
			$(this).removeClass('choice_selected_trend');	
			$(this).addClass('choice_notSelected_trend');	
		} else {
			$(this).addClass('choice_selected_trend');	
			$(this).removeClass('choice_notSelected_trend');	
		}	
	});

	$('.careteam').hide();
	$('.main').show();	
}

$(function() {
	$('.simple-form-submit').click(function() {
		$('.simple-form-submit').html('Loging in...');
		$.get('/login?username=' + $('#username').val() + '&password=' + $('#password').val(), function(user) {
			data.loggedUser = user;

			$.get('/teams?userid=' + data.loggedUser.userid + '&token=' + data.loggedUser.token, function(teams) {
				data.loggedUser.teams = teams;
				start(teams);
			}).fail(function() {
				$('.simple-form-submit').html('Error logging in, try again...');
	    	setTimeout(function() {
	    		$('.simple-form-submit').html('Log in');
	    	}, 4000);
			}); 
		}).fail(function() {
			$('.simple-form-submit').html('Error logging in, try again...');
    	setTimeout(function() {
    		$('.simple-form-submit').html('Log in');
    	}, 4000);
		});
		return false;
	});
});