/*
# RUN THE BOT:

  Get a Bot token from Slack:

    -> http://my.slack.com/services/new/bot

  Run your bot from the command line:

    token=<MY TOKEN> node slack_bot.js
*/

/*
   ----- Initialization -----
*/
if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

var Botkit = require('./lib/Botkit.js');
var os = require('os');
var request = require('request');
var cheerio = require('cheerio');

var controller = Botkit.slackbot({
    debug: true,
});

var bot = controller.spawn({
    token: process.env.token,
}).startRTM();
/*
   ----- End Initialization -----
*/

// Created own string insertion method :D
String.prototype.insertAt=function(index, string) { 
  return this.substr(0, index) + string + this.substr(index);
}


// Listener for 'schedule' in mention/direct message
controller.hears(['schedule'], 'direct_mention,direct_message', function(bot, message) {
    
    // URL to scrape
    var url = '';
    var month = new Date().getMonth();

    // Spring training is on this URL
    if(month === 1 || month === 2)
    {
        url = 'http://www.espn.com/mlb/team/schedule/_/name/bal/seasontype/1';
    } 

    // First half of the season is on this URL
    if(month === 3 || month === 4 || month === 5 || month === 6) 
    {
        url = 'http://www.espn.com/mlb/team/schedule/_/name/bal'
    }

    // Second half of the season is on this URL
    if(month === 6 || month === 7 || month === 8 || month === 9)
    {
        url = 'http://www.espn.com/mlb/team/schedule/_/name/bal/half/2'
    }
    
    // Request the url & get its html
    request(url, function(error, response, body)
        {
            // Error handling on request
            if(error)
                throw error;

            // The heading string, formatted
            var output = "Date\t\t\t\t\tOpponent\t\t\t\t\tTime (EST)\t\t\t\t\tBaltimore Pitcher\t\t\t\t\tOpposing Pitcher\n";
            
            // Load the html from the url
            var $ = cheerio.load(body);
            
            var dates = []; // Dates Array
            var gs    = []; // Game Status
            var opp   = []; // Opponents Array
            var time  = []; // Time Array
            var bp    = []; // Baltimore Pitcher Array
            var op    = []; // Opposing Pitcher Array

            // Get all of the dates
            $('nobr').each(function(i, element)
            { 
                // Get all dates for the current month
                if(new Date($(this).text()).getMonth() === month)
                {
                    dates.push($(this).text());
                }
            });

            // Get the game status
            $('li.game-status').each(function(i, element)
            {
                gs.push($(this).text());
            });

            // Get the opponents
            $('li.team-name').each(function(i, element)
            {
                opp.push($(this).text());
            });

            // Get the time of each game
            $('td[align="right"]').each(function(i, element)
            {
                if(i > 0) // Skip header
                    time.push($(this).text());
            });

            // Generate a blank string that we can insert data into
            var data = " ".repeat(output.length+30 * dates.length);

            // Put it altogether 
            for(var i = 0; i < dates.length; i++)
            {
                data = data.insertAt(i*output.length, dates[i]);
                data = data.insertAt(i*output.length+24, gs[i] + " " + opp[i]);
                data = data.insertAt(i*output.length+53, time[i]);
                data = data.insertAt((i+1)*output.length-1, "\n");
            }

            // Format the message as a code-block
            result = {
                "text": "```" + output + data + "```"
            }

            // Execute the reply
            bot.reply(message, result.text);
        });
});

// Countdown function
function getCountdown()
{
    // Date of Os home opener, what time it is now, the difference
    var openingDay = new Date("April 3, 2017 15:05:00").getTime();
    var now = new Date().getTime();
    var timeLeft = openingDay - now;

    // Conversion to days/hours/mins/secs
    var days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    var hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    // Return the string of data
    return "Time until Orioles opener: " + days + " days " + hours + " hours " + minutes + " minutes " + seconds + " seconds";
};

// Countdown listener
controller.hears(['countdown'], 'direct_mention,direct_message', function(bot, message) {
    
    // Execute the response
    bot.reply(message, getCountdown());
});

